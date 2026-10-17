import mongoose from 'mongoose';
import { z } from 'zod';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../../core/http/errors.js';
import { makeSlug } from '../../../utils/strings.js';
import { OrderModel, normalizeOrderStatus } from '../orders/order.model.js';
import { ensureSystemSettings } from '../settings/settings.service.js';
import { InvoiceTemplateModel } from './invoice.model.js';

export const invoiceTemplateWriteSchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: z.string().trim().max(80).optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
  companyName: z.string().trim().max(120).optional(),
  logo: z.string().optional(),
  address: z.string().trim().max(400).optional(),
  phone: z.string().trim().max(40).optional(),
  email: z.string().trim().max(120).optional(),
  accentColor: z.string().trim().max(20).optional(),
  currencySymbol: z.string().trim().max(8).optional(),
  headerNote: z.string().trim().max(200).optional(),
  footerNote: z.string().trim().max(500).optional(),
  terms: z.string().trim().max(500).optional(),
  showSku: z.boolean().optional(),
  showPayment: z.boolean().optional(),
});

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export const ensureDefaultInvoiceTemplate = async () => {
  const count = await InvoiceTemplateModel.countDocuments();
  if (count > 0) {
    const hasDefault = await InvoiceTemplateModel.exists({ isDefault: true, isActive: true });
    if (!hasDefault) {
      const first = await InvoiceTemplateModel.findOne().sort({ createdAt: 1 });
      if (first) {
        first.isDefault = true;
        first.isActive = true;
        await first.save();
      }
    }
    return InvoiceTemplateModel.findOne({ isDefault: true, isActive: true }).lean();
  }

  const settings: any = await ensureSystemSettings();
  const general = settings.general || {};
  const created = await InvoiceTemplateModel.create({
    name: 'Classic',
    slug: 'classic',
    isDefault: true,
    isActive: true,
    companyName: general.siteName || 'GBLrcDrone',
    logo: general.logo || '',
    address: general.address || '',
    phone: general.phone || '',
    email: general.contactEmail || '',
    accentColor: '#f59e0b',
    currencySymbol: '৳',
    headerNote: 'Tax Invoice / Receipt',
    footerNote: 'Thank you for shopping with us.',
    terms: 'Goods once sold are subject to our return policy.',
    showSku: true,
    showPayment: true,
  });
  await InvoiceTemplateModel.create({
    name: 'Minimal',
    slug: 'minimal',
    isDefault: false,
    isActive: true,
    companyName: general.siteName || 'GBLrcDrone',
    logo: general.logo || '',
    address: general.address || '',
    phone: general.phone || '',
    email: general.contactEmail || '',
    accentColor: '#0f172a',
    currencySymbol: '৳',
    headerNote: 'Invoice',
    footerNote: 'Questions? Contact support.',
    terms: '',
    showSku: false,
    showPayment: true,
  });
  return created.toObject();
};

export const listInvoiceTemplates = async () => {
  await ensureDefaultInvoiceTemplate();
  return InvoiceTemplateModel.find().sort({ isDefault: -1, name: 1 }).lean();
};

export const getInvoiceTemplate = async (idOrSlug: string) => {
  await ensureDefaultInvoiceTemplate();
  const query = mongoose.Types.ObjectId.isValid(idOrSlug)
    ? { $or: [{ _id: idOrSlug }, { slug: idOrSlug }] }
    : { slug: idOrSlug };
  const template = await InvoiceTemplateModel.findOne(query).lean();
  if (!template) throw new NotFoundError('Invoice template not found');
  return template;
};

export const createInvoiceTemplate = async (payload: z.infer<typeof invoiceTemplateWriteSchema>) => {
  await ensureDefaultInvoiceTemplate();
  const slug = makeSlug(payload.slug || payload.name) || `template-${Date.now()}`;
  const exists = await InvoiceTemplateModel.findOne({ slug });
  if (exists) throw new BadRequestError('Template slug already exists');
  if (payload.isDefault) {
    await InvoiceTemplateModel.updateMany({}, { $set: { isDefault: false } });
  }
  return InvoiceTemplateModel.create({
    ...payload,
    slug,
    isDefault: Boolean(payload.isDefault),
    isActive: payload.isActive !== false,
  });
};

export const updateInvoiceTemplate = async (
  id: string,
  payload: z.infer<typeof invoiceTemplateWriteSchema>,
) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new BadRequestError('Invalid template id');
  const template = await InvoiceTemplateModel.findById(id);
  if (!template) throw new NotFoundError('Invoice template not found');
  const nextSlug = payload.slug ? makeSlug(payload.slug) : template.slug;
  if (nextSlug !== template.slug) {
    const clash = await InvoiceTemplateModel.findOne({ slug: nextSlug, _id: { $ne: id } });
    if (clash) throw new BadRequestError('Template slug already exists');
    template.slug = nextSlug;
  }
  const fields = [
    'name',
    'companyName',
    'logo',
    'address',
    'phone',
    'email',
    'accentColor',
    'currencySymbol',
    'headerNote',
    'footerNote',
    'terms',
    'showSku',
    'showPayment',
    'isActive',
  ] as const;
  for (const key of fields) {
    if (payload[key] !== undefined) (template as any)[key] = payload[key];
  }
  if (payload.isDefault === true) {
    await InvoiceTemplateModel.updateMany({ _id: { $ne: template._id } }, { $set: { isDefault: false } });
    template.isDefault = true;
    template.isActive = true;
  } else if (payload.isDefault === false) {
    template.isDefault = false;
  }
  await template.save();
  if (!(await InvoiceTemplateModel.exists({ isDefault: true, isActive: true }))) {
    template.isDefault = true;
    template.isActive = true;
    await template.save();
  }
  return template.toObject();
};

export const deleteInvoiceTemplate = async (id: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new BadRequestError('Invalid template id');
  const template = await InvoiceTemplateModel.findById(id);
  if (!template) throw new NotFoundError('Invoice template not found');
  const count = await InvoiceTemplateModel.countDocuments();
  if (count <= 1) throw new BadRequestError('At least one invoice template is required');
  const wasDefault = template.isDefault;
  await template.deleteOne();
  if (wasDefault) {
    const next = await InvoiceTemplateModel.findOne({ isActive: true }).sort({ createdAt: 1 });
    if (next) {
      next.isDefault = true;
      await next.save();
    }
  }
  return { deleted: true };
};

const money = (symbol: string, value: unknown) => `${symbol}${Number(value || 0).toLocaleString()}`;

export const renderInvoiceHtml = (invoice: {
  invoiceNumber: string;
  issuedAt: string;
  order: any;
  template: any;
}) => {
  const order = invoice.order || {};
  const template = invoice.template || {};
  const address = order.shippingAddress || {};
  const symbol = template.currencySymbol || '৳';
  const accent = template.accentColor || '#f59e0b';
  const items = Array.isArray(order.items) ? order.items : [];
  const rows = items
    .map((item: any) => {
      const title = escapeHtml(item.title || 'Item');
      const variant = item.variantName ? ` (${escapeHtml(item.variantName)})` : '';
      const sku =
        template.showSku && (item.sku || item.variantSku)
          ? `<div style="font-size:11px;color:#64748b;">SKU ${escapeHtml(item.sku || item.variantSku)}</div>`
          : '';
      const lineTotal = Number(item.price || 0) * Number(item.quantity || 0);
      return `<tr>
        <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;vertical-align:top;">${title}${variant}${sku}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;text-align:center;">${Number(item.quantity || 0)}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;text-align:right;">${money(symbol, item.price)}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;text-align:right;">${money(symbol, lineTotal)}</td>
      </tr>`;
    })
    .join('');

  const logo = template.logo
    ? `<img src="${escapeHtml(template.logo)}" alt="" style="max-height:56px;max-width:180px;object-fit:contain;margin-bottom:8px;" />`
    : '';

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(invoice.invoiceNumber || 'Invoice')}</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; color: #0f172a; margin: 0; padding: 32px; background: #fff; }
    .accent { color: ${escapeHtml(accent)}; }
    .muted { color: #64748b; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    .totals { margin-top: 16px; text-align: right; line-height: 1.7; }
    .footer { margin-top: 28px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; }
    @media print { body { padding: 12px; } }
  </style>
</head>
<body>
  <div style="display:flex;justify-content:space-between;gap:24px;align-items:flex-start;">
    <div>
      ${logo}
      <h1 style="margin:0 0 4px;font-size:24px;">${escapeHtml(template.companyName || 'Store')}</h1>
      <p class="muted" style="margin:0;font-size:13px;white-space:pre-line;">${escapeHtml(template.address || '')}</p>
      <p class="muted" style="margin:4px 0 0;font-size:13px;">
        ${escapeHtml([template.phone, template.email].filter(Boolean).join(' · '))}
      </p>
    </div>
    <div style="text-align:right;">
      <p class="accent" style="margin:0;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;font-size:12px;">
        ${escapeHtml(template.headerNote || 'Invoice')}
      </p>
      <h2 style="margin:6px 0 0;font-size:20px;">${escapeHtml(invoice.invoiceNumber)}</h2>
      <p class="muted" style="margin:6px 0 0;font-size:13px;">Issued ${escapeHtml(new Date(invoice.issuedAt || Date.now()).toLocaleString())}</p>
      <p style="margin:8px 0 0;font-size:13px;"><strong>Order</strong> ${escapeHtml(order.orderNumber || '')}</p>
    </div>
  </div>

  <div style="margin-top:24px;padding:14px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc;">
    <p style="margin:0;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;" class="muted">Bill to</p>
    <p style="margin:8px 0 0;font-weight:700;">${escapeHtml(address.fullName || '')}</p>
    <p class="muted" style="margin:4px 0 0;font-size:13px;">
      ${escapeHtml([address.email, address.phone].filter(Boolean).join(' · '))}<br/>
      ${escapeHtml([address.address, address.city, address.postalCode].filter(Boolean).join(', '))}
    </p>
  </div>

  <table>
    <thead>
      <tr>
        <th style="text-align:left;padding:8px;border-bottom:2px solid ${escapeHtml(accent)};">Item</th>
        <th style="padding:8px;border-bottom:2px solid ${escapeHtml(accent)};">Qty</th>
        <th style="text-align:right;padding:8px;border-bottom:2px solid ${escapeHtml(accent)};">Price</th>
        <th style="text-align:right;padding:8px;border-bottom:2px solid ${escapeHtml(accent)};">Total</th>
      </tr>
    </thead>
    <tbody>${rows || '<tr><td colspan="4" style="padding:16px;text-align:center;" class="muted">No items</td></tr>'}</tbody>
  </table>

  <div class="totals">
    <div>Subtotal: ${money(symbol, order.subtotal)}</div>
    <div>Shipping: ${money(symbol, order.shippingFee)}</div>
    <div style="font-size:18px;font-weight:700;margin-top:6px;">Total: ${money(symbol, order.total)}</div>
  </div>

  ${
    template.showPayment
      ? `<p class="muted" style="margin-top:16px;font-size:13px;">Payment: ${escapeHtml(order.paymentMethod || '—')} · ${escapeHtml(order.paymentStatus || '—')}${
          order.transactionId ? ` · ${escapeHtml(order.transactionId)}` : ''
        }</p>`
      : ''
  }

  <div class="footer">
    <p style="margin:0 0 8px;">${escapeHtml(template.footerNote || '')}</p>
    ${template.terms ? `<p style="margin:0;">${escapeHtml(template.terms)}</p>` : ''}
  </div>
</body>
</html>`;
};

export const buildInvoiceForOrder = async (
  orderId: string,
  options: { templateId?: string; userId?: string; allowAdmin?: boolean } = {},
) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) throw new BadRequestError('Invalid order id');
  const order: any = await OrderModel.findById(orderId).lean();
  if (!order) throw new NotFoundError('Order not found');
  if (options.userId && order.userId?.toString() !== options.userId && !options.allowAdmin) {
    throw new ForbiddenError('Order access denied');
  }

  await ensureDefaultInvoiceTemplate();
  let template: any = null;
  if (options.templateId) {
    template = await getInvoiceTemplate(options.templateId);
  } else {
    template = await InvoiceTemplateModel.findOne({ isDefault: true, isActive: true }).lean();
    if (!template) template = await InvoiceTemplateModel.findOne({ isActive: true }).lean();
  }
  if (!template) throw new NotFoundError('No invoice template configured');

  const payload = {
    invoiceNumber: `INV-${order.orderNumber}`,
    issuedAt: new Date().toISOString(),
    order: {
      ...order,
      status: normalizeOrderStatus(order.status),
    },
    template,
  };
  return {
    ...payload,
    html: renderInvoiceHtml(payload),
  };
};
