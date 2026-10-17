export const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'];
export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];

export const money = (value) => `৳${Number(value || 0).toLocaleString()}`;

export const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
};

export const formatShortDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString();
};

export const statusBadgeClass = (status) => {
  const map = {
    pending: 'bg-amber-50 text-amber-800',
    processing: 'bg-sky-50 text-sky-800',
    shipped: 'bg-indigo-50 text-indigo-800',
    delivered: 'bg-emerald-50 text-emerald-800',
    completed: 'bg-green-50 text-green-800',
    cancelled: 'bg-red-50 text-red-700',
    paid: 'bg-emerald-50 text-emerald-800',
    failed: 'bg-red-50 text-red-700',
    refunded: 'bg-slate-100 text-slate-700',
  };
  return map[status] || 'bg-slate-100 text-slate-700';
};

export const customerLabel = (order) => {
  const shipping = order?.shippingAddress || {};
  const user = order?.customer || order?.userId || {};
  return {
    name: shipping.fullName || user.name || '—',
    email: shipping.email || user.email || '—',
    phone: shipping.phone || user.phone || '—',
  };
};

export const downloadTextFile = (filename, content, type = 'text/csv;charset=utf-8') => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const fallbackInvoiceHtml = (invoice) => {
  const order = invoice?.order || {};
  const address = order.shippingAddress || {};
  const template = invoice?.template || {};
  const items = order.items || [];
  const symbol = template.currencySymbol || '৳';
  const rows = items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #ddd;">
          ${item.title || ''}${item.variantName ? ` (${item.variantName})` : ''}
        </td>
        <td style="padding:8px;border-bottom:1px solid #ddd;text-align:center;">${item.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #ddd;text-align:right;">${symbol}${item.price}</td>
        <td style="padding:8px;border-bottom:1px solid #ddd;text-align:right;">${symbol}${Number(item.price || 0) * Number(item.quantity || 0)}</td>
      </tr>`,
    )
    .join('');

  return `<!doctype html>
  <html>
  <head>
    <title>${invoice.invoiceNumber || 'Invoice'}</title>
    <style>
      body { font-family: Arial, sans-serif; color: #111; padding: 32px; }
      h1 { margin: 0 0 4px; }
      table { width: 100%; border-collapse: collapse; margin-top: 24px; }
      .muted { color: #666; }
    </style>
  </head>
  <body>
    <h1>${template.companyName || 'GBLrcDrone'} Invoice</h1>
    <p class="muted">${invoice.invoiceNumber || ''} · ${new Date(invoice.issuedAt || Date.now()).toLocaleString()}</p>
    <p><strong>Order:</strong> ${order.orderNumber || ''}<br/>
    <strong>Customer:</strong> ${address.fullName || ''}<br/>
    ${address.email || ''} · ${address.phone || ''}<br/>
    ${address.address || ''}, ${address.city || ''} ${address.postalCode || ''}</p>
    <table>
      <thead>
        <tr>
          <th style="text-align:left;padding:8px;border-bottom:2px solid #111;">Item</th>
          <th style="padding:8px;border-bottom:2px solid #111;">Qty</th>
          <th style="text-align:right;padding:8px;border-bottom:2px solid #111;">Price</th>
          <th style="text-align:right;padding:8px;border-bottom:2px solid #111;">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="text-align:right;margin-top:16px;">
      Subtotal: ${symbol}${order.subtotal || 0}<br/>
      Shipping: ${symbol}${order.shippingFee || 0}<br/>
      <strong>Total: ${symbol}${order.total || 0}</strong>
    </p>
    <p class="muted">Payment: ${order.paymentMethod || '—'} · ${order.paymentStatus || '—'}${order.transactionId ? ` · ${order.transactionId}` : ''}</p>
  </body>
  </html>`;
};

export const getInvoiceHtml = (invoice) => invoice?.html || fallbackInvoiceHtml(invoice);

/** Print via hidden iframe (avoids window.open noopener returning null). */
export const printInvoiceHtml = (invoice) => {
  const html = getInvoiceHtml(invoice);
  const iframe = document.createElement('iframe');
  iframe.setAttribute('title', invoice?.invoiceNumber || 'Invoice');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  document.body.appendChild(iframe);

  const frameWindow = iframe.contentWindow;
  if (!frameWindow) {
    iframe.remove();
    throw new Error('Unable to open invoice printer');
  }

  const doc = frameWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  const cleanup = () => {
    window.setTimeout(() => iframe.remove(), 800);
  };

  frameWindow.focus();
  window.setTimeout(() => {
    try {
      frameWindow.print();
    } finally {
      cleanup();
    }
  }, 250);

  return true;
};

export const downloadInvoiceHtml = (invoice) => {
  const html = getInvoiceHtml(invoice);
  const name = `${invoice?.invoiceNumber || 'invoice'}.html`;
  downloadTextFile(name, html, 'text/html;charset=utf-8');
  return true;
};
