import { Router } from 'express';
import { asyncHandler } from '../../../utils/async-handler.js';
import { envelope } from '../../../core/http/middleware.js';
import { zodValidate } from '../../../core/http/validate.js';
import { requireAuth, requireRole } from '../../../core/auth/middleware.js';
import { buildSitemapXml, deletePage, deleteRedirect, deleteTestimonial, ensureCmsDefaults, getHomepageConfig, getHomepagePayload, getPageBySlug, getRobotsTxt, getSeoSettings, homepageWriteSchema, listPages, listRedirects, listTestimonials, pageWriteSchema, redirectWriteSchema, seoSettingsWriteSchema, testimonialWriteSchema, updateHomepageConfig, updateSeoSettings, upsertPage, upsertRedirect, upsertTestimonial, } from './cms.service.js';
const adminOnly = [requireAuth, requireRole('store_admin', 'platform_admin', 'platform_super_admin')];
export const cmsRouter = Router();
cmsRouter.get('/bootstrap', asyncHandler(async (_req, res) => {
    await ensureCmsDefaults();
    envelope.ok(res, { ready: true });
}));
cmsRouter.get('/homepage', asyncHandler(async (_req, res) => {
    envelope.ok(res, await getHomepagePayload());
}));
cmsRouter.get('/pages', asyncHandler(async (_req, res) => {
    envelope.ok(res, await listPages(false));
}));
cmsRouter.get('/pages/:slug', asyncHandler(async (req, res) => {
    envelope.ok(res, await getPageBySlug(String(req.params.slug)));
}));
cmsRouter.get('/seo', asyncHandler(async (_req, res) => {
    envelope.ok(res, await getSeoSettings());
}));
cmsRouter.get('/testimonials', asyncHandler(async (_req, res) => {
    envelope.ok(res, await listTestimonials(false));
}));
cmsRouter.get('/redirects/lookup', asyncHandler(async (req, res) => {
    const path = typeof req.query.path === 'string' ? req.query.path : '';
    const { findRedirect } = await import('./cms.service.js');
    const redirect = path ? await findRedirect(path) : null;
    envelope.ok(res, redirect);
}));
cmsRouter.use('/admin', ...adminOnly);
cmsRouter.get('/admin/pages', asyncHandler(async (_req, res) => {
    envelope.ok(res, await listPages(true));
}));
cmsRouter.post('/admin/pages', zodValidate(pageWriteSchema), asyncHandler(async (req, res) => {
    envelope.created(res, await upsertPage(null, req.body));
}));
cmsRouter.put('/admin/pages/:id', zodValidate(pageWriteSchema), asyncHandler(async (req, res) => {
    envelope.ok(res, await upsertPage(String(req.params.id), req.body));
}));
cmsRouter.delete('/admin/pages/:id', asyncHandler(async (req, res) => {
    envelope.ok(res, await deletePage(String(req.params.id)));
}));
cmsRouter.get('/admin/homepage', asyncHandler(async (_req, res) => {
    envelope.ok(res, await getHomepageConfig());
}));
cmsRouter.put('/admin/homepage', zodValidate(homepageWriteSchema), asyncHandler(async (req, res) => {
    envelope.ok(res, await updateHomepageConfig(req.body));
}));
cmsRouter.get('/admin/testimonials', asyncHandler(async (_req, res) => {
    envelope.ok(res, await listTestimonials(true));
}));
cmsRouter.post('/admin/testimonials', zodValidate(testimonialWriteSchema), asyncHandler(async (req, res) => {
    envelope.created(res, await upsertTestimonial(null, req.body));
}));
cmsRouter.put('/admin/testimonials/:id', zodValidate(testimonialWriteSchema), asyncHandler(async (req, res) => {
    envelope.ok(res, await upsertTestimonial(String(req.params.id), req.body));
}));
cmsRouter.delete('/admin/testimonials/:id', asyncHandler(async (req, res) => {
    envelope.ok(res, await deleteTestimonial(String(req.params.id)));
}));
cmsRouter.get('/admin/seo', asyncHandler(async (_req, res) => {
    envelope.ok(res, await getSeoSettings());
}));
cmsRouter.put('/admin/seo', zodValidate(seoSettingsWriteSchema), asyncHandler(async (req, res) => {
    envelope.ok(res, await updateSeoSettings(req.body));
}));
cmsRouter.get('/admin/redirects', asyncHandler(async (_req, res) => {
    envelope.ok(res, await listRedirects());
}));
cmsRouter.post('/admin/redirects', zodValidate(redirectWriteSchema), asyncHandler(async (req, res) => {
    envelope.created(res, await upsertRedirect(null, req.body));
}));
cmsRouter.put('/admin/redirects/:id', zodValidate(redirectWriteSchema), asyncHandler(async (req, res) => {
    envelope.ok(res, await upsertRedirect(String(req.params.id), req.body));
}));
cmsRouter.delete('/admin/redirects/:id', asyncHandler(async (req, res) => {
    envelope.ok(res, await deleteRedirect(String(req.params.id)));
}));
export const registerSeoFiles = (app) => {
    app.get('/sitemap.xml', asyncHandler(async (_req, res) => {
        const xml = await buildSitemapXml();
        res.type('application/xml').send(xml);
    }));
    app.get('/robots.txt', asyncHandler(async (_req, res) => {
        const text = await getRobotsTxt();
        res.type('text/plain').send(text);
    }));
};
