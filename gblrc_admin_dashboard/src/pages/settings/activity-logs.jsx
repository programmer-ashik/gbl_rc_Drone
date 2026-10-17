import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { settingsService } from '../../services';
import { pushToast } from '../../store/slices/toast-slice';
import { downloadTextFile, formatDate } from '../../utils/orders';

const controlClass = 'rounded-xl border border-border bg-background px-3 py-2 text-sm';

export const ActivityLogsPage = () => {
  const dispatch = useDispatch();
  const [query, setQuery] = useState({ search: '', action: '', actorEmail: '', from: '', to: '', page: 1, limit: 50 });
  const [data, setData] = useState({ items: [], total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    settingsService
      .activity(query)
      .then((result) => {
        if (active) setData(result);
      })
      .catch((error) => {
        if (active) dispatch(pushToast({ type: 'error', message: error.message || 'Failed to load logs' }));
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [dispatch, query]);

  const exportCsv = async () => {
    try {
      const file = await settingsService.exportActivity(query);
      downloadTextFile(file.filename || 'activity-logs.csv', file.csv);
      dispatch(pushToast({ type: 'success', message: `Exported ${file.total} logs` }));
    } catch (error) {
      dispatch(pushToast({ type: 'error', message: error.message || 'Export failed' }));
    }
  };

  return (
    <div>
      <div className='mb-6 flex flex-wrap items-end justify-between gap-3'>
        <div>
          <h1 className='text-2xl font-extrabold text-text-primary'>Activity logs</h1>
          <p className='text-sm text-text-muted'>{data.total} admin actions recorded</p>
        </div>
        <button type='button' onClick={exportCsv} className='rounded-xl border border-border px-4 py-2 text-sm font-semibold'>
          Export CSV
        </button>
      </div>

      <div className='mb-4 grid grid-cols-1 gap-3 md:grid-cols-5'>
        <input className={controlClass} placeholder='Search' value={query.search} onChange={(e) => setQuery({ ...query, search: e.target.value, page: 1 })} />
        <input className={controlClass} placeholder='Action type' value={query.action} onChange={(e) => setQuery({ ...query, action: e.target.value, page: 1 })} />
        <input className={controlClass} placeholder='User email' value={query.actorEmail} onChange={(e) => setQuery({ ...query, actorEmail: e.target.value, page: 1 })} />
        <input type='date' className={controlClass} value={query.from} onChange={(e) => setQuery({ ...query, from: e.target.value, page: 1 })} />
        <input type='date' className={controlClass} value={query.to} onChange={(e) => setQuery({ ...query, to: e.target.value, page: 1 })} />
      </div>

      <div className='overflow-hidden rounded-2xl border border-border bg-background-secondary'>
        <table className='w-full text-sm'>
          <thead>
            <tr className='text-left text-xs uppercase text-text-muted'>
              <th className='px-4 py-3'>When</th>
              <th className='px-4 py-3'>User</th>
              <th className='px-4 py-3'>Action</th>
              <th className='px-4 py-3'>Target</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className='px-4 py-8 text-center text-text-muted'>
                  Loading…
                </td>
              </tr>
            ) : data.items.length === 0 ? (
              <tr>
                <td colSpan={4} className='px-4 py-8 text-center text-text-muted'>
                  No logs found
                </td>
              </tr>
            ) : (
              data.items.map((item) => (
                <tr key={item._id} className='border-t border-border'>
                  <td className='px-4 py-3'>{formatDate(item.createdAt)}</td>
                  <td className='px-4 py-3'>{item.actorEmail}</td>
                  <td className='px-4 py-3 font-semibold'>{item.action}</td>
                  <td className='px-4 py-3 text-text-muted'>
                    {item.targetType || '—'} {item.targetId ? `· ${String(item.targetId).slice(-6)}` : ''}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className='mt-4 flex items-center justify-between'>
        <p className='text-sm text-text-muted'>
          Page {data.page} of {data.totalPages}
        </p>
        <div className='flex gap-2'>
          <button type='button' disabled={query.page <= 1} onClick={() => setQuery((c) => ({ ...c, page: c.page - 1 }))} className='rounded-xl border border-border px-3 py-1.5 text-sm disabled:opacity-40'>
            Previous
          </button>
          <button type='button' disabled={query.page >= data.totalPages} onClick={() => setQuery((c) => ({ ...c, page: c.page + 1 }))} className='rounded-xl border border-border px-3 py-1.5 text-sm disabled:opacity-40'>
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivityLogsPage;
