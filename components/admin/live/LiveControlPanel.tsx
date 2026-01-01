'use client';

import { useEffect, useMemo, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { LiveShow } from '@/lib/firebase/types';
import { useToast } from '@/contexts/ToastContext';

interface LiveShowResponse extends LiveShow {
  startTime: string;
}

interface LiveShowsPayload {
  items: LiveShowResponse[];
}

export default function LiveControlPanel() {
  const toast = useToast();
  const [items, setItems] = useState<LiveShowResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/live-shows', { credentials: 'include' });
      if (!response.ok) {
        if (response.status === 401) {
          toast.showError('Session expired. Please sign in again.');
        } else if (response.status === 403) {
          toast.showError('Admin access required for live controls.');
        }
        throw new Error('Failed to load live shows');
      }
      const payload = (await response.json()) as LiveShowsPayload;
      setItems(payload.items || []);
    } catch (error) {
      console.error('Error loading live control:', error);
      toast.showError('Unable to load live control data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const liveShow = useMemo(() => items.find((item) => item.status === 'live') || null, [items]);
  const nextShow = useMemo(
    () =>
      items
        .filter((item) => item.status === 'scheduled')
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0] || null,
    [items]
  );

  const updateShow = async (id: string, status: LiveShow['status']) => {
    setActionId(id);
    try {
      const response = await fetch(`/api/admin/live-shows/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        throw new Error('Failed to update show');
      }
      if (status === 'live') {
        toast.showSuccess('Show is now live.');
      }
      if (status === 'ended') {
        toast.showSuccess('Show ended.');
      }
      await load();
    } catch (error) {
      console.error('Error updating live show:', error);
      toast.showError('Unable to update live show.');
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[color:var(--text-1)]">Now live</p>
            {liveShow ? <Badge tone="warning">Live</Badge> : <Badge tone="neutral">Offline</Badge>}
          </div>
          {loading ? (
            <p className="text-sm text-[color:var(--text-3)]">Loading live show…</p>
          ) : liveShow ? (
            <div className="space-y-2">
              <p className="text-lg font-semibold">{liveShow.title}</p>
              <p className="text-sm text-[color:var(--text-3)]">
                Started {new Date(liveShow.startTime).toLocaleString()} · ${liveShow.prize.toLocaleString()}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateShow(liveShow.id, 'ended')}
                  disabled={actionId === liveShow.id}
                >
                  {actionId === liveShow.id ? 'Working…' : 'End show'}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-[color:var(--text-3)]">No show is live right now.</p>
          )}
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[color:var(--text-1)]">Next show</p>
            {nextShow ? <Badge tone="info">Scheduled</Badge> : <Badge tone="neutral">None</Badge>}
          </div>
          {loading ? (
            <p className="text-sm text-[color:var(--text-3)]">Loading upcoming show…</p>
          ) : nextShow ? (
            <div className="space-y-2">
              <p className="text-lg font-semibold">{nextShow.title}</p>
              <p className="text-sm text-[color:var(--text-3)]">
                {new Date(nextShow.startTime).toLocaleString()} · ${nextShow.prize.toLocaleString()}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => updateShow(nextShow.id, 'live')}
                  disabled={actionId === nextShow.id}
                >
                  {actionId === nextShow.id ? 'Working…' : 'Go live now'}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-[color:var(--text-3)]">Schedule a show to go live.</p>
          )}
        </Card>
      </div>

      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-[color:var(--text-1)]">Control notes</p>
          <Button variant="outline" size="sm" onClick={load}>
            Refresh
          </Button>
        </div>
        <p className="text-sm text-[color:var(--text-3)]">
          Live controls are scoped to show status for now. Use the schedule manager to adjust timings and prizes.
        </p>
      </Card>
    </div>
  );
}
