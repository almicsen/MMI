'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { sanitizePlainText } from '@/lib/utils/sanitize';

interface ChatMessage {
  id: string;
  author: string;
  text: string;
  createdAt: number;
}

const MAX_MESSAGE_LENGTH = 200;
const SEND_COOLDOWN_MS = 1200;

export default function LiveShowPage() {
  const params = useParams();
  const showId = typeof params?.id === 'string' ? params.id : 'live';
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const lastSendRef = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const viewerCount = useMemo(() => 128 + Math.min(messages.length, 42), [messages.length]);

  const handleSend = () => {
    if (!messageInput.trim() || sending) return;
    const now = Date.now();
    if (now - lastSendRef.current < SEND_COOLDOWN_MS) return;

    const sanitized = sanitizePlainText(messageInput).slice(0, MAX_MESSAGE_LENGTH);
    if (!sanitized) return;

    setSending(true);
    setMessages((prev) => [
      ...prev,
      {
        id: `${now}`,
        author: 'You',
        text: sanitized,
        createdAt: now,
      },
    ]);
    setMessageInput('');
    lastSendRef.current = now;
    setSending(false);
  };

  if (!mounted) return null;

  return (
    <ProtectedRoute>
      <div className="relative min-h-[100svh] overflow-hidden text-white">
        <div className="absolute inset-0" aria-hidden />

        <div className="relative z-10 flex min-h-[100svh] flex-col">
          <header
            className="flex items-center justify-between px-4"
            style={{ paddingTop: 'max(16px, env(safe-area-inset-top))' }}
          >
            <button
              type="button"
              className="flex h-11 min-w-[44px] items-center justify-center rounded-full bg-white/10 px-3 text-sm font-semibold"
              aria-label="Back"
              onClick={() => window.history.back()}
            >
              ←
            </button>
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.3em] text-white/70">Live</p>
              <p className="text-base font-semibold">HQ Trivia</p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 text-sm">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              <span className="font-semibold">{viewerCount.toLocaleString()}</span>
            </div>
          </header>

          <main className="relative flex-1">
            <div className="absolute inset-0" aria-hidden />

            <div className="absolute left-4 top-4 rounded-full bg-rose-600 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
              Live
            </div>

            <div className="absolute right-4 top-4 rounded-full bg-black/50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
              {showId}
            </div>
          </main>

          <section className="relative px-4 pb-4" style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}>
            <div className="mb-3 max-h-48 overflow-y-auto rounded-2xl bg-black/35 p-3">
              <div className="space-y-3 text-sm">
                {messages.length === 0 ? (
                  <p className="text-white/70">No chat yet. Say hello!</p>
                ) : (
                  messages.map((message) => (
                    <div key={message.id} className="space-y-1">
                      <p className="text-xs font-semibold text-white/70">{message.author}</p>
                      <p className="text-sm text-white">{message.text}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-2xl bg-black/45 px-3 py-2">
              <input
                type="text"
                value={messageInput}
                onChange={(event) => setMessageInput(event.target.value.slice(0, MAX_MESSAGE_LENGTH))}
                placeholder="Write a message"
                className="h-11 flex-1 bg-transparent text-sm text-white placeholder:text-white/60 focus:outline-none"
                maxLength={MAX_MESSAGE_LENGTH}
                aria-label="Chat message"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!messageInput.trim() || sending}
                className="h-10 rounded-full bg-white px-4 text-sm font-semibold text-black disabled:opacity-50"
                aria-label="Send message"
              >
                Send
              </button>
            </div>
          </section>
        </div>
      </div>
    </ProtectedRoute>
  );
}
