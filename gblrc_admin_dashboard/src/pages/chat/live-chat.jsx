import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { chatService } from '../../services';
import { pushToast } from '../../store/slices/toast-slice';
import { getAdminRealtimeSocket } from '../../lib/realtime';
import { formatDate } from '../../utils/orders';

const panelClass = 'rounded-2xl border border-border bg-background-secondary p-5';

export const LiveChatPage = () => {
  const dispatch = useDispatch();
  const [threads, setThreads] = useState([]);
  const [active, setActive] = useState(null);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);

  const loadThreads = async () => {
    try {
      const items = await chatService.adminThreads();
      setThreads(Array.isArray(items) ? items : []);
    } catch (error) {
      dispatch(pushToast({ type: 'error', message: error.message || 'Failed to load chats' }));
    }
  };

  const openThread = async (id) => {
    try {
      const thread = await chatService.adminThread(id);
      setActive(thread);
      getAdminRealtimeSocket().emit('chat:join', id);
    } catch (error) {
      dispatch(pushToast({ type: 'error', message: error.message || 'Failed to open chat' }));
    }
  };

  useEffect(() => {
    loadThreads();
    const socket = getAdminRealtimeSocket();
    const onThread = () => loadThreads();
    const onMessage = (payload) => {
      setActive((current) => {
        if (!current || String(current._id) !== String(payload?.threadId)) return current;
        return { ...current, messages: [...(current.messages || []), payload.message] };
      });
      loadThreads();
    };
    socket.on('chat:thread', onThread);
    socket.on('chat:message', onMessage);
    return () => {
      socket.off('chat:thread', onThread);
      socket.off('chat:message', onMessage);
    };
  }, []);

  const send = async (event) => {
    event.preventDefault();
    if (!active?._id || !reply.trim()) return;
    setBusy(true);
    try {
      const updated = await chatService.send(active._id, reply.trim());
      setActive(updated);
      setReply('');
      await loadThreads();
    } catch (error) {
      dispatch(pushToast({ type: 'error', message: error.message || 'Send failed' }));
    } finally {
      setBusy(false);
    }
  };

  const close = async () => {
    if (!active?._id) return;
    try {
      await chatService.close(active._id);
      setActive(null);
      await loadThreads();
    } catch (error) {
      dispatch(pushToast({ type: 'error', message: error.message || 'Close failed' }));
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <section className={panelClass}>
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-lg font-extrabold">Live chat</h1>
          <button type="button" onClick={loadThreads} className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold">
            Refresh
          </button>
        </div>
        <div className="space-y-2">
          {threads.map((thread) => (
            <button
              key={thread._id}
              type="button"
              onClick={() => openThread(thread._id)}
              className={`w-full rounded-xl border px-3 py-2 text-left text-sm ${
                active?._id === thread._id ? 'border-warning bg-warning/10' : 'border-border'
              }`}
            >
              <p className="font-semibold">{thread.guestName || 'Customer'}</p>
              <p className="truncate text-xs text-text-muted">{thread.preview}</p>
              <p className="text-[10px] text-text-muted">
                {formatDate(thread.lastMessageAt)} · {thread.status}
              </p>
            </button>
          ))}
          {!threads.length ? <p className="py-8 text-center text-sm text-text-muted">No chats yet</p> : null}
        </div>
      </section>

      <section className={`${panelClass} flex min-h-[480px] flex-col`}>
        {active ? (
          <>
            <div className="mb-3 flex items-center justify-between border-b border-border pb-3">
              <div>
                <h2 className="font-bold">{active.guestName || 'Customer'}</h2>
                <p className="text-xs text-text-muted">{active.guestEmail || active.userId || 'Guest'}</p>
              </div>
              <button type="button" onClick={close} className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold">
                Close thread
              </button>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto">
              {(active.messages || []).map((message, index) => (
                <div
                  key={message._id || index}
                  className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                    message.senderRole === 'admin' ? 'ml-auto bg-warning/15' : 'bg-background'
                  }`}
                >
                  <p className="text-[10px] font-semibold uppercase text-text-muted">{message.senderName}</p>
                  <p>{message.body}</p>
                </div>
              ))}
            </div>
            <form onSubmit={send} className="mt-3 flex gap-2 border-t border-border pt-3">
              <input
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm"
                placeholder="Reply to customer…"
              />
              <button type="submit" disabled={busy} className="rounded-xl bg-warning px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                Send
              </button>
            </form>
          </>
        ) : (
          <p className="m-auto text-sm text-text-muted">Select a conversation</p>
        )}
      </section>
    </div>
  );
};

export default LiveChatPage;
