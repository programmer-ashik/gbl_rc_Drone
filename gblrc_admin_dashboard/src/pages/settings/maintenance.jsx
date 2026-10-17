import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { settingsService } from '../../services';
import { pushToast } from '../../store/slices/toast-slice';
import { API_CONFIG } from '../../constants/api';
import { formatDate } from '../../utils/orders';

const panelClass = 'rounded-2xl border border-border bg-background-secondary p-5';

export const MaintenancePage = () => {
  const dispatch = useDispatch();
  const [health, setHealth] = useState(null);
  const [backups, setBackups] = useState([]);
  const [settings, setSettings] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const [nextHealth, nextBackups, nextSettings] = await Promise.all([
        settingsService.health(),
        settingsService.listBackups(),
        settingsService.get(),
      ]);
      setHealth(nextHealth);
      setBackups(nextBackups);
      setSettings(nextSettings);
    } catch (error) {
      dispatch(pushToast({ type: 'error', message: error.message || 'Load failed' }));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const flushCache = async () => {
    setBusy(true);
    try {
      const result = await settingsService.flushCache();
      dispatch(pushToast({ type: 'success', message: `Cache cleared${result.redis ? ' (Redis)' : ' (memory)'}` }));
    } catch (error) {
      dispatch(pushToast({ type: 'error', message: error.message || 'Flush failed' }));
    } finally {
      setBusy(false);
    }
  };

  const createBackup = async () => {
    setBusy(true);
    try {
      const backup = await settingsService.createBackup();
      dispatch(pushToast({ type: 'success', message: `Backup created: ${backup.filename}` }));
      await load();
    } catch (error) {
      dispatch(pushToast({ type: 'error', message: error.message || 'Backup failed' }));
    } finally {
      setBusy(false);
    }
  };

  const saveAutoBackup = async () => {
    setBusy(true);
    try {
      const saved = await settingsService.save({
        maintenance: {
          autoBackupEnabled: settings.maintenance?.autoBackupEnabled,
          autoBackupCron: settings.maintenance?.autoBackupCron,
        },
      });
      setSettings(saved);
      dispatch(pushToast({ type: 'success', message: 'Maintenance settings saved' }));
    } catch (error) {
      dispatch(pushToast({ type: 'error', message: error.message || 'Save failed' }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-extrabold text-text-primary'>Backup & maintenance</h1>
        <p className='text-sm text-text-muted'>Database backups, cache, and system health</p>
      </div>

      <section className={panelClass}>
        <div className='mb-3 flex items-center justify-between'>
          <h2 className='text-sm font-bold uppercase text-text-muted'>System health</h2>
          <button type='button' onClick={load} className='rounded-xl border border-border px-3 py-1.5 text-sm font-semibold'>
            Refresh
          </button>
        </div>
        {health ? (
          <div className='grid gap-3 md:grid-cols-4 text-sm'>
            <div className='rounded-xl bg-background p-3'>
              <p className='text-text-muted'>Status</p>
              <p className='text-xl font-bold capitalize'>{health.status}</p>
            </div>
            <div className='rounded-xl bg-background p-3'>
              <p className='text-text-muted'>Mongo</p>
              <p className='text-xl font-bold'>{health.mongo?.ok ? `OK (${health.mongo.latencyMs}ms)` : 'Down'}</p>
            </div>
            <div className='rounded-xl bg-background p-3'>
              <p className='text-text-muted'>Redis</p>
              <p className='text-xl font-bold'>{health.redis?.ok ? 'Connected' : 'Memory fallback'}</p>
            </div>
            <div className='rounded-xl bg-background p-3'>
              <p className='text-text-muted'>Uptime</p>
              <p className='text-xl font-bold'>{Math.round((health.uptimeSec || 0) / 60)}m</p>
            </div>
          </div>
        ) : (
          <p className='text-sm text-text-muted'>Checking…</p>
        )}
      </section>

      <section className={panelClass}>
        <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
          <h2 className='text-sm font-bold uppercase text-text-muted'>Cache</h2>
          <button type='button' disabled={busy} onClick={flushCache} className='rounded-xl bg-warning px-4 py-2 text-sm font-semibold text-white disabled:opacity-50'>
            Clear cache
          </button>
        </div>
        <p className='text-sm text-text-muted'>Clears category tree/nav and product featured/new/detail caches.</p>
      </section>

      <section className={panelClass}>
        <div className='mb-4 flex flex-wrap items-center justify-between gap-2'>
          <h2 className='text-sm font-bold uppercase text-text-muted'>Database backup</h2>
          <button type='button' disabled={busy} onClick={createBackup} className='rounded-xl bg-warning px-4 py-2 text-sm font-semibold text-white disabled:opacity-50'>
            Create backup now
          </button>
        </div>
        {settings && (
          <div className='mb-4 flex flex-wrap items-center gap-3 text-sm'>
            <label className='flex items-center gap-2 font-semibold'>
              <input
                type='checkbox'
                checked={Boolean(settings.maintenance?.autoBackupEnabled)}
                onChange={(e) =>
                  setSettings((current) => ({
                    ...current,
                    maintenance: { ...current.maintenance, autoBackupEnabled: e.target.checked },
                  }))
                }
              />
              Enable auto backup schedule
            </label>
            <input
              className='rounded-xl border border-border bg-background px-3 py-2'
              value={settings.maintenance?.autoBackupCron || ''}
              onChange={(e) =>
                setSettings((current) => ({
                  ...current,
                  maintenance: { ...current.maintenance, autoBackupCron: e.target.value },
                }))
              }
              placeholder='Cron (0 3 * * *)'
            />
            <button type='button' disabled={busy} onClick={saveAutoBackup} className='rounded-xl border border-border px-3 py-2 font-semibold disabled:opacity-50'>
              Save schedule
            </button>
          </div>
        )}
        <div className='space-y-2'>
          {backups.map((backup) => (
            <div key={backup.filename} className='flex flex-wrap items-center justify-between gap-2 rounded-xl bg-background px-3 py-2 text-sm'>
              <div>
                <p className='font-semibold'>{backup.filename}</p>
                <p className='text-xs text-text-muted'>
                  {formatDate(backup.createdAt)} · {(backup.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <a className='font-semibold text-warning' href={`${API_CONFIG.BASE_URL}${backup.path}`} target='_blank' rel='noreferrer'>
                Download
              </a>
            </div>
          ))}
          {!backups.length && <p className='text-sm text-text-muted'>No backups yet</p>}
        </div>
      </section>
    </div>
  );
};

export default MaintenancePage;
