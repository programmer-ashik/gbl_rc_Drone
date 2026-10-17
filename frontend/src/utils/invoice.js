export const downloadTextFile = (filename, content, type = 'text/html;charset=utf-8') => {
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

export const printInvoiceHtml = (invoice) => {
  const html = invoice?.html;
  if (!html) throw new Error('Invoice HTML missing');

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

  frameWindow.focus();
  window.setTimeout(() => {
    try {
      frameWindow.print();
    } finally {
      window.setTimeout(() => iframe.remove(), 800);
    }
  }, 250);

  return true;
};

export const downloadInvoiceHtml = (invoice) => {
  const html = invoice?.html;
  if (!html) throw new Error('Invoice HTML missing');
  downloadTextFile(`${invoice?.invoiceNumber || 'invoice'}.html`, html, 'text/html;charset=utf-8');
  return true;
};
