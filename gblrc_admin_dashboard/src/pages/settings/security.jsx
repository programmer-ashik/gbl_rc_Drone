import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { settingsService, adminService } from '../../services';
import { pushToast } from '../../store/slices/toast-slice';
import { ROUTES } from '../../constants/routes';

const controlClass = 'rounded-xl border border-border bg-background px-3 py-2 text-sm w-full';
const panelClass = 'rounded-2xl border border-border bg-background-secondary p-5';

export const SecuritySettingsPage = () => {
  const dispatch = useDispatch();
  const [settings, setSettings] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const [nextSettings, nextAdmins] = await Promise.all([settingsService.get(), settingsService.admins()]);
      setSettings(nextSettings);
      setAdmins(nextAdmins);
    } catch (error) {
      dispatch(pushToast({ type: 'error', message: error.message || 'Load failed' }));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    setBusy(true);
    try {
      const saved = await settingsService.save({ security: settings.security });
      setSettings(saved);
      dispatch(pushToast({ type: 'success', message: 'Security settings saved' }));
    } catch (error) {
      dispatch(pushToast({ type: 'error', message: error.message || 'Save failed' }));
    } finally {
      setBusy(false);
    }
  };

  const toggleBlock = async (user) => {
    try {
      await adminService.updateUser(user._id, { isBlocked: !user.isBlocked });
      dispatch(pushToast({ type: 'success', message: user.isBlocked ? 'Admin unblocked' : 'Admin blocked' }));
      await load();
    } catch (error) {
      dispatch(pushToast({ type: 'error', message: error.message || 'Update failed' }));
    }
  };

  if (!settings) return <p className='text-sm text-text-muted'>Loading security…</p>;

  return (
    <div className='space-y-6'>
      <div className='flex flex-wrap items-end justify-between gap-3'>
        <div>
          <h1 className='text-2xl font-extrabold text-text-primary'>Security settings</h1>
          <p className='text-sm text-text-muted'>Admin accounts, login limits, and session policy</p>
        </div>
        <button type='button' disabled={busy} onClick={save} className='rounded-xl bg-warning px-4 py-2 text-sm font-semibold text-white disabled:opacity-50'>
          Save security
        </button>
      </div>

      <section className={`${panelClass} grid gap-3 md:grid-cols-2`}>
        <label className='flex items-center gap-2 text-sm font-semibold md:col-span-2'>
          <input
            type='checkbox'
            checked={Boolean(settings.security?.twoFactorOptional)}
            onChange={(e) =>
              setSettings((current) => ({
                ...current,
                security: { ...current.security, twoFactorOptional: e.target.checked },
              }))
            }
          />
          Allow optional two-factor authentication for admins
        </label>
        <label className='text-sm'>
          <span className='mb-1 block text-text-muted'>Login attempts limit</span>
          <input
            type='number'
            className={controlClass}
            value={settings.security?.loginAttemptsLimit ?? 5}
            onChange={(e) =>
              setSettings((current) => ({
                ...current,
                security: { ...current.security, loginAttemptsLimit: Number(e.target.value) },
              }))
            }
          />
        </label>
        <label className='text-sm'>
          <span className='mb-1 block text-text-muted'>Session timeout (minutes)</span>
          <input
            type='number'
            className={controlClass}
            value={settings.security?.sessionTimeoutMinutes ?? 60}
            onChange={(e) =>
              setSettings((current) => ({
                ...current,
                security: { ...current.security, sessionTimeoutMinutes: Number(e.target.value) },
              }))
            }
          />
        </label>
        <label className='flex items-center gap-2 text-sm font-semibold md:col-span-2'>
          <input
            type='checkbox'
            checked={settings.security?.requireStrongPasswords !== false}
            onChange={(e) =>
              setSettings((current) => ({
                ...current,
                security: { ...current.security, requireStrongPasswords: e.target.checked },
              }))
            }
          />
          Require strong passwords
        </label>
      </section>

      <section className={panelClass}>
        <div className='mb-3 flex items-center justify-between'>
          <h2 className='text-sm font-bold uppercase text-text-muted'>Admin accounts</h2>
          <Link to={ROUTES.USERS} className='text-sm font-semibold text-warning'>
            Manage users
          </Link>
        </div>
        <table className='w-full text-sm'>
          <thead>
            <tr className='text-left text-xs uppercase text-text-muted'>
              <th className='py-2'>Name</th>
              <th className='py-2'>Email</th>
              <th className='py-2'>Role</th>
              <th className='py-2'>Status</th>
              <th className='py-2'>Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((user) => (
              <tr key={user._id} className='border-t border-border'>
                <td className='py-2 font-semibold'>{user.name}</td>
                <td className='py-2'>{user.email}</td>
                <td className='py-2'>{user.role}</td>
                <td className='py-2'>{user.isBlocked ? 'Blocked' : 'Active'}</td>
                <td className='py-2'>
                  <button type='button' className='font-semibold text-warning' onClick={() => toggleBlock(user)}>
                    {user.isBlocked ? 'Unblock' : 'Block'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default SecuritySettingsPage;
