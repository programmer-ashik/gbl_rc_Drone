import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { cmsAdminService } from '../../services';
import { pushToast } from '../../store/slices/toast-slice';

const controlClass = 'rounded-xl border border-border bg-background px-3 py-2 text-sm w-full';

export const CmsTestimonialsPage = () => {
  const dispatch = useDispatch();
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ name: '', role: '', quote: '', rating: 5, enabled: true, order: 0 });

  const load = async () => {
    try {
      setRows(await cmsAdminService.listTestimonials());
    } catch (error) {
      dispatch(pushToast({ type: 'error', message: error.message || 'Load failed' }));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    try {
      await cmsAdminService.createTestimonial(form);
      setForm({ name: '', role: '', quote: '', rating: 5, enabled: true, order: 0 });
      dispatch(pushToast({ type: 'success', message: 'Testimonial added' }));
      await load();
    } catch (error) {
      dispatch(pushToast({ type: 'error', message: error.message || 'Save failed' }));
    }
  };

  const remove = async (id) => {
    try {
      await cmsAdminService.deleteTestimonial(id);
      await load();
    } catch (error) {
      dispatch(pushToast({ type: 'error', message: error.message || 'Delete failed' }));
    }
  };

  return (
    <div>
      <h1 className='mb-6 text-2xl font-extrabold text-text-primary'>Testimonials</h1>
      <div className='mb-6 grid gap-3 rounded-2xl border border-border bg-background-secondary p-4 md:grid-cols-2'>
        <input className={controlClass} placeholder='Name' value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className={controlClass} placeholder='Role' value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
        <textarea className={`${controlClass} md:col-span-2`} rows={3} placeholder='Quote' value={form.quote} onChange={(e) => setForm({ ...form, quote: e.target.value })} />
        <button type='button' onClick={save} className='rounded-xl bg-warning px-4 py-2 text-sm font-semibold text-white md:col-span-2'>
          Add testimonial
        </button>
      </div>
      <div className='space-y-3'>
        {rows.map((row) => (
          <div key={row._id} className='rounded-2xl border border-border bg-background-secondary p-4'>
            <div className='flex items-start justify-between gap-3'>
              <div>
                <p className='font-semibold'>{row.name}</p>
                <p className='text-xs text-text-muted'>{row.role}</p>
                <p className='mt-2 text-sm'>{row.quote}</p>
              </div>
              <button type='button' className='text-sm font-semibold text-danger' onClick={() => remove(row._id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CmsTestimonialsPage;
