import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { cmsAdminService } from '../../services';
import { pushToast } from '../../store/slices/toast-slice';
import HeadlessSelect from '../../components/headless-select';

const controlClass = 'rounded-xl border border-border bg-background px-3 py-2 text-sm w-full';

export const CmsRedirectsPage = () => {
  const dispatch = useDispatch();
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ fromPath: '', toPath: '', statusCode: 301, enabled: true, note: '' });

  const load = async () => {
    try {
      setRows(await cmsAdminService.listRedirects());
    } catch (error) {
      dispatch(pushToast({ type: 'error', message: error.message || 'Load failed' }));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    try {
      await cmsAdminService.createRedirect(form);
      setForm({ fromPath: '', toPath: '', statusCode: 301, enabled: true, note: '' });
      dispatch(pushToast({ type: 'success', message: 'Redirect added' }));
      await load();
    } catch (error) {
      dispatch(pushToast({ type: 'error', message: error.message || 'Save failed' }));
    }
  };

  const remove = async (id) => {
    try {
      await cmsAdminService.deleteRedirect(id);
      await load();
    } catch (error) {
      dispatch(pushToast({ type: 'error', message: error.message || 'Delete failed' }));
    }
  };

  return (
    <div>
      <h1 className='mb-2 text-2xl font-extrabold text-text-primary'>301 Redirects</h1>
      <p className='mb-6 text-sm text-text-muted'>Map old paths to new category/product URLs</p>

      <div className='mb-6 grid gap-3 rounded-2xl border border-border bg-background-secondary p-4 md:grid-cols-5'>
        <input className={controlClass} placeholder='/old-path' value={form.fromPath} onChange={(e) => setForm({ ...form, fromPath: e.target.value })} />
        <input className={controlClass} placeholder='/new-path' value={form.toPath} onChange={(e) => setForm({ ...form, toPath: e.target.value })} />
        <HeadlessSelect
          aria-label='Redirect type'
          value={form.statusCode}
          options={[
            { value: 301, label: '301 · Permanent' },
            { value: 302, label: '302 · Temporary' },
          ]}
          onChange={(statusCode) => setForm({ ...form, statusCode })}
        />
        <input className={controlClass} placeholder='Note' value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        <button type='button' onClick={save} className='rounded-xl bg-warning px-4 py-2 text-sm font-semibold text-white'>
          Add redirect
        </button>
      </div>

      <div className='overflow-hidden rounded-2xl border border-border bg-background-secondary'>
        <table className='w-full text-sm'>
          <thead>
            <tr className='text-left text-xs uppercase text-text-muted'>
              <th className='px-4 py-3'>From</th>
              <th className='px-4 py-3'>To</th>
              <th className='px-4 py-3'>Code</th>
              <th className='px-4 py-3'>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row._id} className='border-t border-border'>
                <td className='px-4 py-3'>{row.fromPath}</td>
                <td className='px-4 py-3'>{row.toPath}</td>
                <td className='px-4 py-3'>{row.statusCode}</td>
                <td className='px-4 py-3'>
                  <button type='button' className='font-semibold text-danger' onClick={() => remove(row._id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CmsRedirectsPage;
