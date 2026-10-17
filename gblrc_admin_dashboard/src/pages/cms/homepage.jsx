import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { cmsAdminService } from '../../services';
import { pushToast } from '../../store/slices/toast-slice';

const controlClass = 'rounded-xl border border-border bg-background px-3 py-2 text-sm w-full';
const panelClass = 'rounded-2xl border border-border bg-background-secondary p-5';

const emptySlide = () => ({
  title: '',
  subtitle: '',
  description: '',
  badge: '',
  image: '',
  videoUrl: '',
  ctaText: 'Shop now',
  ctaLink: '/products',
  secondaryCtaText: '',
  secondaryCtaLink: '',
  enabled: true,
  order: 0,
});

export const CmsHomepagePage = () => {
  const dispatch = useDispatch();
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    cmsAdminService
      .getHomepage()
      .then(setForm)
      .catch((error) => dispatch(pushToast({ type: 'error', message: error.message || 'Load failed' })));
  }, [dispatch]);

  if (!form) return <p className='text-sm text-text-muted'>Loading homepage…</p>;

  const save = async () => {
    setBusy(true);
    try {
      const saved = await cmsAdminService.saveHomepage({
        metaTitle: form.metaTitle,
        metaDescription: form.metaDescription,
        heroSlides: form.heroSlides,
        sections: form.sections,
      });
      setForm(saved);
      dispatch(pushToast({ type: 'success', message: 'Homepage saved' }));
    } catch (error) {
      dispatch(pushToast({ type: 'error', message: error.message || 'Save failed' }));
    } finally {
      setBusy(false);
    }
  };

  const updateSlide = (index, patch) => {
    setForm((current) => ({
      ...current,
      heroSlides: current.heroSlides.map((slide, i) => (i === index ? { ...slide, ...patch } : slide)),
    }));
  };

  const updateSection = (index, patch) => {
    setForm((current) => ({
      ...current,
      sections: current.sections.map((section, i) => (i === index ? { ...section, ...patch } : section)),
    }));
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-end justify-between gap-3'>
        <div>
          <h1 className='text-2xl font-extrabold text-text-primary'>Homepage sections</h1>
          <p className='text-sm text-text-muted'>Hero, categories, arrivals, offers, testimonials</p>
        </div>
        <button type='button' disabled={busy} onClick={save} className='rounded-xl bg-warning px-4 py-2 text-sm font-semibold text-white disabled:opacity-50'>
          Save homepage
        </button>
      </div>

      <section className={panelClass}>
        <h2 className='mb-3 text-sm font-bold uppercase text-text-muted'>SEO</h2>
        <div className='grid gap-3 md:grid-cols-2'>
          <input className={controlClass} value={form.metaTitle || ''} onChange={(e) => setForm({ ...form, metaTitle: e.target.value })} placeholder='Meta title' />
          <input className={controlClass} value={form.metaDescription || ''} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })} placeholder='Meta description' />
        </div>
      </section>

      <section className={panelClass}>
        <div className='mb-3 flex items-center justify-between'>
          <h2 className='text-sm font-bold uppercase text-text-muted'>Hero slides</h2>
          <button
            type='button'
            className='rounded-xl border border-border px-3 py-1.5 text-sm font-semibold'
            onClick={() => setForm({ ...form, heroSlides: [...(form.heroSlides || []), emptySlide()] })}
          >
            Add slide
          </button>
        </div>
        <div className='space-y-4'>
          {(form.heroSlides || []).map((slide, index) => (
            <div key={slide._id || index} className='grid gap-2 rounded-xl bg-background p-3 md:grid-cols-2'>
              <input className={controlClass} value={slide.title || ''} onChange={(e) => updateSlide(index, { title: e.target.value })} placeholder='Title' />
              <input className={controlClass} value={slide.subtitle || ''} onChange={(e) => updateSlide(index, { subtitle: e.target.value })} placeholder='Subtitle' />
              <input className={controlClass} value={slide.ctaText || ''} onChange={(e) => updateSlide(index, { ctaText: e.target.value })} placeholder='CTA text' />
              <input className={controlClass} value={slide.ctaLink || ''} onChange={(e) => updateSlide(index, { ctaLink: e.target.value })} placeholder='CTA link' />
              <input className={controlClass} value={slide.image || ''} onChange={(e) => updateSlide(index, { image: e.target.value })} placeholder='Image URL' />
              <label className='flex items-center gap-2 text-sm'>
                <input type='checkbox' checked={slide.enabled !== false} onChange={(e) => updateSlide(index, { enabled: e.target.checked })} />
                Enabled
              </label>
              <textarea className={`${controlClass} md:col-span-2`} rows={2} value={slide.description || ''} onChange={(e) => updateSlide(index, { description: e.target.value })} placeholder='Description' />
            </div>
          ))}
        </div>
      </section>

      <section className={panelClass}>
        <h2 className='mb-3 text-sm font-bold uppercase text-text-muted'>Sections</h2>
        <div className='space-y-3'>
          {(form.sections || []).map((section, index) => (
            <div key={section.key} className='grid gap-2 rounded-xl bg-background p-3 md:grid-cols-4'>
              <p className='font-semibold md:col-span-1'>{section.key}</p>
              <input className={controlClass} value={section.title || ''} onChange={(e) => updateSection(index, { title: e.target.value })} placeholder='Title' />
              <input className={controlClass} value={section.subtitle || ''} onChange={(e) => updateSection(index, { subtitle: e.target.value })} placeholder='Subtitle' />
              <label className='flex items-center gap-2 text-sm'>
                <input type='checkbox' checked={section.enabled !== false} onChange={(e) => updateSection(index, { enabled: e.target.checked })} />
                Enabled · limit
                <input
                  type='number'
                  className='w-16 rounded-lg border border-border px-2 py-1'
                  value={section.limit || 8}
                  onChange={(e) => updateSection(index, { limit: Number(e.target.value) || 8 })}
                />
              </label>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default CmsHomepagePage;
