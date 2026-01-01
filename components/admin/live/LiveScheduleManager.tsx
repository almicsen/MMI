'use client';

import { useEffect, useMemo, useState } from 'react';
import { LiveShow } from '@/lib/firebase/types';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useToast } from '@/contexts/ToastContext';

interface LiveShowResponse extends LiveShow {
  startTime: string;
}

interface LiveShowsPayload {
  items: LiveShowResponse[];
}

const statusTone = (status: LiveShow['status']) => {
  switch (status) {
    case 'live':
      return 'warning';
    case 'ended':
      return 'neutral';
    default:
      return 'info';
  }
};

export default function LiveScheduleManager() {
  const toast = useToast();
  const [items, setItems] = useState<LiveShowResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    prize: '',
    startTime: '',
    status: 'scheduled',
  });

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [items]);

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/live-shows', { credentials: 'include' });
      if (!response.ok) {
        if (response.status === 401) {
          toast.showError('Session expired. Please sign in again.');
        } else if (response.status === 403) {
          toast.showError('Admin access required for live scheduling.');
        }
        throw new Error('Failed to load live schedule');
      }
      const payload = (await response.json()) as LiveShowsPayload;
      setItems(payload.items || []);
    } catch (error) {
      console.error('Error loading live schedule:', error);
      toast.showError('Unable to load live schedule.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createShow = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch('/api/admin/live-shows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: form.title,
          prize: Number(form.prize || 0),
          startTime: form.startTime,
          status: form.status,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to create show');
      }
      toast.showSuccess('Live show scheduled.');
      setForm({ title: '', prize: '', startTime: '', status: 'scheduled' });
      await load();
    } catch (error) {
      console.error('Error creating show:', error);
      toast.showError('Unable to schedule show.');
    } finally {
      setSaving(false);
    }
  };

  const updateShow = async (id: string, updates: Partial<LiveShow>) => {
    setActionId(id);
    try {
      const response = await fetch(`/api/admin/live-shows/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        throw new Error('Failed to update show');
      }
      if (updates.status === 'live') {
        toast.showSuccess('Show is now live.');
      }
      if (updates.status === 'ended') {
        toast.showSuccess('Show ended.');
      }
      await load();
    } catch (error) {
      console.error('Error updating show:', error);
      toast.showError('Unable to update show.');
    } finally {
      setActionId(null);
    }
  };

  const deleteShow = async (id: string) => {
    const confirmed = typeof window === 'undefined' ? true : window.confirm('Remove this show from the schedule?');
    if (!confirmed) return;
    setActionId(id);
    try {
      const response = await fetch(`/api/admin/live-shows/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to delete show');
      }
      toast.showSuccess('Show removed.');
      await load();
    } catch (error) {
      console.error('Error deleting show:', error);
      toast.showError('Unable to delete show.');
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <form className="grid gap-4 md:grid-cols-[2fr_1fr_1.2fr_1fr_auto] md:items-end" onSubmit={createShow}>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--text-4)]">
              Show title
            </label>
            <Input
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              placeholder="HQ Trivia"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--text-4)]">
              Prize
            </label>
            <Input
              value={form.prize}
              onChange={(event) => setForm({ ...form, prize: event.target.value })}
              placeholder="10000"
              type="number"
              min="0"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--text-4)]">
              Start time (ET)
            </label>
            <Input
              value={form.startTime}
              onChange={(event) => setForm({ ...form, startTime: event.target.value })}
              type="datetime-local"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--text-4)]">
              Status
            </label>
            <select
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value })}
              className="h-11 w-full rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-2)] px-3 text-sm text-[color:var(--text-1)]"
            >
              <option value="scheduled">Scheduled</option>
              <option value="live">Live</option>
              <option value="ended">Ended</option>
            </select>
          </div>
          <Button type="submit" size="md" disabled={saving}>
            {saving ? 'Saving…' : 'Schedule'}
          </Button>
        </form>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[color:var(--text-1)]">Upcoming & live shows</h3>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            Refresh
          </Button>
        </div>

        {loading ? (
          <Card className="animate-pulse">Loading schedule…</Card>
        ) : sortedItems.length === 0 ? (
          <Card>
            <p className="text-sm text-[color:var(--text-3)]">No live shows scheduled yet.</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {sortedItems.map((show) => (
              <Card key={show.id} className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-base font-semibold text-[color:var(--text-1)]">{show.title}</p>
                    <Badge tone={statusTone(show.status)}>{show.status}</Badge>
                  </div>
                  <p className="text-sm text-[color:var(--text-3)]">
                    {new Date(show.startTime).toLocaleString()} · ${show.prize.toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {show.status !== 'live' && (
                    <Button
                      size="sm"
                      onClick={() => updateShow(show.id, { status: 'live' })}
                      disabled={actionId === show.id}
                    >
                      {actionId === show.id ? 'Working…' : 'Go live'}
                    </Button>
                  )}
                  {show.status !== 'ended' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateShow(show.id, { status: 'ended' })}
                      disabled={actionId === show.id}
                    >
                      {actionId === show.id ? 'Working…' : 'End show'}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteShow(show.id)}
                    disabled={actionId === show.id}
                  >
                    {actionId === show.id ? 'Removing…' : 'Remove'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
