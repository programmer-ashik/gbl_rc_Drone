import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { stockAlertService } from '../../services/uxService';
import Button from '../common/Button/Button';

export const StockAlertButton = ({ productId, className = '' }) => {
  const user = useSelector((state) => state.auth.user);
  const [email, setEmail] = useState(user?.email || '');
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const subscribe = async () => {
    setBusy(true);
    setMessage('');
    try {
      await stockAlertService.subscribe(productId, email || undefined);
      setMessage('We will email you when this item is back in stock.');
      setOpen(false);
    } catch (error) {
      setMessage(error.message || 'Could not subscribe');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={className}>
      {!open ? (
        <Button type="button" variant="ghost" className="rounded-xl border border-border px-4 py-2 text-sm font-semibold" onClick={() => setOpen(true)}>
          Notify when available
        </Button>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email for alert"
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
          <Button type="button" disabled={busy} onClick={subscribe} className="rounded-xl bg-warning px-4 py-2 text-sm font-semibold text-white">
            Subscribe
          </Button>
        </div>
      )}
      {message ? <p className="mt-2 text-xs text-text-muted">{message}</p> : null}
    </div>
  );
};

export default StockAlertButton;
