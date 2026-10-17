import React, { useEffect, useRef, useState } from 'react';
import { chatService } from '../../services/uxService';
import { getRealtimeSocket } from '../../lib/realtime';
import Icon from '../common/Icon/Icon';

const GUEST_KEY = 'gblrc_chat_guest';

const getGuestId = () => {
  let id = localStorage.getItem(GUEST_KEY);
  if (!id) {
    id = `guest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(GUEST_KEY, id);
  }
  return id;
};

export const LiveChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [thread, setThread] = useState(null);
  const [body, setBody] = useState('');
  const [name, setName] = useState('Guest');
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef(null);
  const guestId = getGuestId();

  useEffect(() => {
    if (!open) return undefined;
    chatService.mine(guestId).then((data) => data && setThread(data)).catch(() => {});
    const socket = getRealtimeSocket();
    const onMessage = (payload) => {
      if (!payload?.threadId) return;
      setThread((current) => {
        if (!current || String(current._id) !== String(payload.threadId)) return current;
        return { ...current, messages: [...(current.messages || []), payload.message] };
      });
    };
    socket.on('chat:message', onMessage);
    if (thread?._id) socket.emit('chat:join', thread._id);
    return () => socket.off('chat:message', onMessage);
  }, [open, guestId, thread?._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread?.messages?.length, open]);

  const send = async (event) => {
    event.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    try {
      const socket = getRealtimeSocket();
      if (!thread?._id) {
        const created = await chatService.start({ guestId, guestName: name, message: body.trim() });
        setThread(created);
        socket.emit('chat:join', created._id);
      } else {
        const updated = await chatService.send(thread._id, body.trim(), guestId);
        setThread(updated);
      }
      setBody('');
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-40">
      {open ? (
        <div className="mb-3 flex h-[min(420px,calc(100dvh-7rem))] w-[min(340px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
          <div className="flex items-center justify-between bg-warning px-4 py-3 text-white">
            <strong className="text-sm">Live support</strong>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close chat">
              <Icon name="close" size={5} />
            </button>
          </div>
          {!thread ? (
            <div className="border-b border-border p-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-border bg-background-secondary px-3 py-2 text-sm"
                placeholder="Your name"
              />
            </div>
          ) : null}
          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {(thread?.messages || []).map((message, index) => (
              <div
                key={message._id || index}
                className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                  message.senderRole === 'admin' ? 'bg-background-secondary' : 'ml-auto bg-warning/15'
                }`}
              >
                <p className="text-[10px] font-semibold uppercase text-text-muted">{message.senderName}</p>
                <p>{message.body}</p>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <form onSubmit={send} className="flex gap-2 border-t border-border p-3">
            <input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="flex-1 rounded-xl border border-border bg-background-secondary px-3 py-2 text-sm"
              placeholder="Type a message…"
            />
            <button type="submit" disabled={busy} className="rounded-xl bg-warning px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">
              Send
            </button>
          </form>
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-warning text-white shadow-lg shadow-warning/30"
        aria-label="Open live chat"
      >
        <Icon name="email" size={6} />
      </button>
    </div>
  );
};

export default LiveChatWidget;
