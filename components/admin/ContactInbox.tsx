'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import InstantLink from '@/components/InstantLink';

const fetcher = (url: string) =>
  fetch(url, { credentials: 'include' }).then((res) => {
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  });

interface ContactMessageItem {
  id: string;
  userId: string;
  name?: string | null;
  email?: string | null;
  subject: string;
  message: string;
  status: 'new' | 'open' | 'closed';
  tags?: string[];
  internalNotes?: string | null;
  assignedTo?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export default function ContactInbox() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (search.trim()) params.set('search', search.trim());
    return `/api/admin/contact-messages?${params.toString()}`;
  }, [statusFilter, search]);

  const { data, error, mutate, isLoading } = useSWR<{ items: ContactMessageItem[] }>(query, fetcher);

  const selectedMessage = data?.items.find((item) => item.id === selectedId) || data?.items[0];

  useEffect(() => {
    if (!selectedMessage || selectedId) return;
    setSelectedId(selectedMessage.id);
    setNotes(selectedMessage.internalNotes || '');
    setAssignedTo(selectedMessage.assignedTo || '');
    setTags(selectedMessage.tags?.join(', ') || '');
  }, [selectedId, selectedMessage]);

  const handleSelect = (message: ContactMessageItem) => {
    setSelectedId(message.id);
    setNotes(message.internalNotes || '');
    setAssignedTo(message.assignedTo || '');
    setTags(message.tags?.join(', ') || '');
  };

  const handleStatusUpdate = async (status: 'new' | 'open' | 'closed') => {
    if (!selectedMessage) return;
    setSaving(true);
    await fetch(`/api/admin/contact-messages/${selectedMessage.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status }),
    });
    await mutate();
    setSaving(false);
  };

  const handleSaveNotes = async () => {
    if (!selectedMessage) return;
    setSaving(true);
    await fetch(`/api/admin/contact-messages/${selectedMessage.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        internalNotes: notes,
        assignedTo: assignedTo || null,
        tags: tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      }),
    });
    await mutate();
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[180px]">
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="new">New</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </Select>
        </div>
        <div className="flex-1 min-w-[220px]">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by subject"
            aria-label="Search contact messages"
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-sm text-[color:var(--text-3)]">Loading messages...</div>
          ) : error ? (
            <div className="text-sm text-red-400">Unable to load messages.</div>
          ) : data?.items.length ? (
            data.items.map((message) => (
              <button
                key={message.id}
                onClick={() => handleSelect(message)}
                className={`w-full rounded-2xl border px-4 py-4 text-left transition-all ${
                  selectedMessage?.id === message.id
                    ? 'border-[color:var(--brand-primary)] bg-[color:var(--surface-3)]'
                    : 'border-[color:var(--border-subtle)] bg-[color:var(--surface-2)] hover:border-[color:var(--brand-accent)]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[color:var(--text-1)]">{message.subject}</p>
                  <Badge tone={message.status === 'new' ? 'info' : message.status === 'open' ? 'warning' : 'neutral'}>
                    {message.status}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-[color:var(--text-4)]">
                  {message.name || message.email || message.userId}
                </p>
                <p className="mt-2 line-clamp-2 text-sm text-[color:var(--text-3)]">{message.message}</p>
              </button>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-[color:var(--border-subtle)] p-6 text-sm text-[color:var(--text-3)]">
              No contact messages yet.
            </div>
          )}
        </div>

        <div className="surface-card space-y-4">
          {selectedMessage ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--text-4)]">Message</p>
                  <h3 className="text-xl font-semibold text-[color:var(--text-1)]">{selectedMessage.subject}</h3>
                </div>
                <Badge tone={selectedMessage.status === 'new' ? 'info' : selectedMessage.status === 'open' ? 'warning' : 'neutral'}>
                  {selectedMessage.status}
                </Badge>
              </div>
              <div className="text-sm text-[color:var(--text-3)]">
                <p>From: {selectedMessage.name || 'Unknown'}</p>
                <p>Email: {selectedMessage.email || 'Not provided'}</p>
                <p>User ID: {selectedMessage.userId}</p>
                {selectedMessage.createdAt && (
                  <p>Received: {new Date(selectedMessage.createdAt).toLocaleString()}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <InstantLink href={`/admin?tab=users&userId=${selectedMessage.userId}`}>
                  <Button variant="outline" size="sm">View user profile</Button>
                </InstantLink>
                {selectedMessage.email && (
                  <a href={`mailto:${selectedMessage.email}`} className="inline-flex">
                    <Button variant="ghost" size="sm">Reply via email</Button>
                  </a>
                )}
              </div>
              <div className="rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-3)] p-4 text-sm text-[color:var(--text-2)]">
                {selectedMessage.message}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedMessage.status === 'open' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusUpdate('open')}
                  disabled={saving}
                >
                  Mark open
                </Button>
                <Button
                  variant={selectedMessage.status === 'closed' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusUpdate('closed')}
                  disabled={saving}
                >
                  Close
                </Button>
                <Button
                  variant={selectedMessage.status === 'new' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusUpdate('new')}
                  disabled={saving}
                >
                  Reset to new
                </Button>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[color:var(--text-2)]">Internal notes</label>
                <Textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add internal notes for this message"
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs uppercase tracking-[0.2em] text-[color:var(--text-4)]">Assigned to</label>
                    <Input
                      value={assignedTo}
                      onChange={(e) => setAssignedTo(e.target.value)}
                      placeholder="Admin UID"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-[0.2em] text-[color:var(--text-4)]">Tags</label>
                    <Input
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="e.g. vip, billing"
                    />
                  </div>
                </div>
                <Button variant="secondary" size="sm" onClick={handleSaveNotes} disabled={saving}>
                  Save notes
                </Button>
              </div>
            </>
          ) : (
            <div className="text-sm text-[color:var(--text-3)]">Select a message to view details.</div>
          )}
        </div>
      </div>
    </div>
  );
}
