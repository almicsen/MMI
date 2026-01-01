'use client';

import { useEffect, useMemo, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { usePageEnabled } from '@/lib/hooks/usePageEnabled';
import LoadingState from '@/components/LoadingState';
import LiveHeader from '@/components/live/LiveHeader';
import StatMetric from '@/components/live/StatMetric';
import HeartCounter from '@/components/live/HeartCounter';
import Carousel from '@/components/live/Carousel';
import BottomDock from '@/components/live/BottomDock';
import LiveModal from '@/components/live/LiveModal';
import { LiveShow, LiveStats } from '@/lib/firebase/types';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { getUserPhotoURL } from '@/lib/firebase/auth';
import { collection, doc, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { mapLiveShow } from '@/lib/live/transform';
import { liveStatsSchema } from '@/lib/validators/live';
import { useRouter } from 'next/navigation';

interface ScheduleResponse {
  items: Array<LiveShow & { startTime: string }>;
}

export default function LiveSchedulePage() {
  const { enabled, loading: pageCheckLoading } = usePageEnabled('live');
  const toast = useToast();
  const router = useRouter();
  const { user, sessionStatus } = useAuth();
  const [shows, setShows] = useState<LiveShow[]>([]);
  const [stats, setStats] = useState<LiveStats>({ balance: 0, hearts: 0, weeklyRank: 0 });
  const [loading, setLoading] = useState(true);
  const [realtimeReady, setRealtimeReady] = useState(false);
  const [realtimeEnabled, setRealtimeEnabled] = useState(true);
  const [modal, setModal] = useState<{ title: string; description: string } | null>(null);

  useEffect(() => {
    if (pageCheckLoading || !enabled || sessionStatus !== 'ready') return;

    const load = async () => {
      setLoading(true);
      try {
        const [scheduleRes, statsRes] = await Promise.all([
          fetch('/api/live/schedule', { credentials: 'include', cache: 'no-store' }),
          fetch('/api/live/stats', { credentials: 'include', cache: 'no-store' }),
        ]);

        if (!scheduleRes.ok || !statsRes.ok) {
          if (scheduleRes.status === 401 || statsRes.status === 401) {
            return;
          }
          throw new Error('Failed to load live data');
        }

        const scheduleJson = (await scheduleRes.json()) as ScheduleResponse;
        const statsJson = (await statsRes.json()) as LiveStats;

        setShows(
          scheduleJson.items.map((item) => ({
            ...item,
            startTime: new Date(item.startTime),
          }))
        );
        setStats(statsJson);
        setRealtimeReady(false);
      } catch (error) {
        console.error('Error loading live schedule:', error);
        toast.showError('Unable to load Live schedule.');
      } finally {
        setLoading(false);
      }
    };

    load();

    const interval = window.setInterval(load, 15000);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        load();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [enabled, pageCheckLoading, sessionStatus, toast]);

  useEffect(() => {
    if (pageCheckLoading || !enabled || sessionStatus !== 'ready' || !user?.uid) return;
    if (!realtimeEnabled) return;
    let unsubscribeShows: (() => void) | null = null;
    let unsubscribeStats: (() => void) | null = null;

    try {
      const showsQuery = query(collection(db, 'liveShows'), orderBy('startTime', 'asc'), limit(12));
      unsubscribeShows = onSnapshot(
        showsQuery,
        (snapshot) => {
          const next = snapshot.docs
            .map((docSnap) => mapLiveShow(docSnap.id, docSnap.data()))
            .filter((item): item is LiveShow => Boolean(item))
            .filter((item) => item.status !== 'ended')
            .filter((item) => item.status === 'live' || item.startTime.getTime() >= Date.now());
          setShows(next);
          setRealtimeReady(true);
          setLoading(false);
        },
        (error) => {
          const code = (error as { code?: string }).code;
          if (code === 'permission-denied') {
            console.warn('Live show realtime disabled due to permissions.');
            setRealtimeEnabled(false);
            return;
          }
          console.error('Live show realtime error:', error);
        }
      );

      const statsRef = doc(db, 'liveStats', user.uid);
      unsubscribeStats = onSnapshot(
        statsRef,
        (docSnap) => {
          const data = docSnap.exists() ? docSnap.data() : { balance: 0, hearts: 0, weeklyRank: 0 };
          const parsed = liveStatsSchema.safeParse(data);
          if (parsed.success) {
            setStats(parsed.data);
          }
        },
        (error) => {
          const code = (error as { code?: string }).code;
          if (code === 'permission-denied') {
            console.warn('Live stats realtime disabled due to permissions.');
            setRealtimeEnabled(false);
            return;
          }
          console.error('Live stats realtime error:', error);
        }
      );
    } catch (error) {
      console.error('Failed to initialize realtime live feeds:', error);
    }

    return () => {
      unsubscribeShows?.();
      unsubscribeStats?.();
    };
  }, [enabled, pageCheckLoading, realtimeEnabled, sessionStatus, user?.uid]);

  const formatTime = (show: LiveShow) => {
    const now = new Date();
    const date = show.startTime;
    const isToday = date.toDateString() === now.toDateString();
    const label = isToday ? 'TODAY' : date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    const time = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/New_York',
    }).format(date);
    const tz = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      timeZoneName: 'short',
    })
      .formatToParts(date)
      .find((part) => part.type === 'timeZoneName')?.value || 'ET';

    return `${label} ${time.replace(':00', '')} ${tz}`.toUpperCase();
  };

  const nextShows = useMemo(() => {
    return shows
      .filter((show) => show.status !== 'ended')
      .sort((a, b) => {
        if (a.status === 'live' && b.status !== 'live') return -1;
        if (b.status === 'live' && a.status !== 'live') return 1;
        return a.startTime.getTime() - b.startTime.getTime();
      });
  }, [shows]);
  const userInitials = useMemo(() => {
    if (!user) return 'ME';
    const source = user.displayName || user.email || 'ME';
    return source
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'ME';
  }, [user]);
  const photoUrl = getUserPhotoURL(user);

  if (pageCheckLoading || !enabled || sessionStatus === 'loading') {
    return <LoadingState />;
  }

  return (
    <ProtectedRoute>
      <div
        className="relative min-h-[100svh] overflow-hidden text-white"
        style={{
          background: 'linear-gradient(90deg, #543EAA 0%, #4356BD 100%)',
        }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: 'radial-gradient(circle at 80% 10%, rgba(255,255,255,0.25), transparent 45%)',
          }}
        />

        <div className="relative z-10 flex min-h-[100svh] flex-col">
          <LiveHeader
            onInvite={() => setModal({ title: 'Invite Friends', description: 'Invite flow coming soon.' })}
            onHelp={() => setModal({ title: 'Help & FAQ', description: 'Live FAQ will be available soon.' })}
          />

          <div className="h-px w-full bg-white/20" />

          <div className="px-4 sm:px-6">
            <div className="mx-auto flex max-w-[1100px] items-center justify-between py-4">
              <StatMetric label="Balance" value={`$${stats.balance}`} />
              <HeartCounter value={stats.hearts} />
              <StatMetric label="Weekly Rank" value={`${stats.weeklyRank}`} align="right" />
            </div>
          </div>

          <div className="flex-1 pb-40 md:pb-44">
            {loading ? (
              <div className="px-4 sm:px-6">
                <div
                  className="rounded-[18px] bg-white/15 animate-pulse"
                  style={{ width: 'clamp(280px, 82vw, 360px)', height: 'clamp(340px, 92vw, 440px)' }}
                />
              </div>
            ) : nextShows.length === 0 ? (
              <div className="px-4 sm:px-6">
                <div className="mx-auto max-w-[520px] rounded-[18px] border border-white/20 bg-white/10 px-6 py-12 text-center">
                  <p className="text-sm uppercase tracking-[0.3em] text-white/70">No shows scheduled</p>
                  <p className="mt-3 text-lg font-semibold">Check back soon for the next HQ Trivia.</p>
                </div>
              </div>
            ) : (
              <Carousel
                shows={nextShows}
                onSelect={(show) =>
                  show.status === 'live'
                    ? router.push(`/live/show/${show.id}`)
                    : setModal({
                        title: show.title,
                        description: `Show details and join flow for ${show.title} coming soon.`,
                      })
                }
                formatTime={formatTime}
              />
            )}
          </div>

          <BottomDock
            onLeaderboard={() => setModal({ title: 'Leaderboard', description: 'Leaderboard view coming soon.' })}
            onInvite={() => setModal({ title: 'Invite Friends', description: 'Invite flow coming soon.' })}
            onOverflow={() => setModal({ title: 'More', description: 'More actions coming soon.' })}
            photoUrl={photoUrl}
            initials={userInitials}
          />
        </div>

        {modal && (
          <LiveModal
            title={modal.title}
            description={modal.description}
            onClose={() => setModal(null)}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
