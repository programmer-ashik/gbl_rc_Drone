export const makeSlug = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

export const resolveAssetUrl = (value) => {
  if (!value) return '';
  if (/^https?:\/\//i.test(value) || value.startsWith('blob:')) return value;
  const base = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  return `${base}${value.startsWith('/') ? value : `/${value}`}`;
};

export const stripHtml = (value) =>
  String(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const calculateFinalPrice = (basePrice, discount) => {
  const base = Math.max(0, Number(basePrice) || 0);
  const percent = Math.min(100, Math.max(0, Number(discount) || 0));
  return Math.round(base * (1 - percent / 100) * 100) / 100;
};

export const productTypeOf = (product) =>
  product?.productType || (product?.isCombo ? 'combo' : product?.variants?.length ? 'variable' : 'single');

export const stockLabel = (status) => {
  if (status === 'out_of_stock') return 'Out of stock';
  if (status === 'low_stock') return 'Low stock';
  return 'In stock';
};

export const SPEC_TEMPLATES = {
  drones: ['Camera', 'Flight time', 'Range', 'Weight'],
  'fpv-racing': ['Frame size', 'Material', 'Camera', 'VTX'],
  motors: ['KV', 'Shaft', 'Weight', 'Cells'],
  batteries: ['Capacity', 'Voltage', 'C-rating', 'Connector'],
  transmitters: ['Channels', 'Protocol', 'Frequency', 'Range'],
  accessories: ['Material', 'Compatibility', 'Size', 'Weight'],
  default: ['Origin', 'Warranty', 'Weight', 'Material'],
};

export const specsFromPairs = (pairs = []) =>
  pairs
    .filter((item) => item.key?.trim() && item.value?.trim())
    .map((item) => `${item.key.trim()}: ${item.value.trim()}`);

export const pairsFromSpecs = (specifications = []) =>
  (specifications.length ? specifications : ['']).map((entry) => {
    const text = String(entry || '');
    const separator = text.indexOf(':');
    if (separator <= 0) return { key: text, value: '' };
    return { key: text.slice(0, separator).trim(), value: text.slice(separator + 1).trim() };
  });

export const csvEscape = (value) => {
  const text = value == null ? '' : String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
};

export const parseCsvText = (text) => {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;
  const input = String(text || '').replace(/^\uFEFF/, '');
  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (inQuotes) {
      if (char === '"') {
        if (input[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else inQuotes = false;
      } else cell += char;
    } else if (char === '"') inQuotes = true;
    else if (char === ',') {
      row.push(cell);
      cell = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && input[index + 1] === '\n') index += 1;
      row.push(cell);
      cell = '';
      if (row.some((value) => String(value).trim())) rows.push(row);
      row = [];
    } else cell += char;
  }
  if (cell.length || row.length) {
    row.push(cell);
    if (row.some((value) => String(value).trim())) rows.push(row);
  }
  if (rows.length < 2) return [];
  const headers = rows[0].map((header) => header.trim());
  return rows.slice(1).map((values, rowIndex) => {
    const record = { _row: String(rowIndex + 2) };
    headers.forEach((header, index) => {
      if (header) record[header] = String(values[index] || '').trim();
    });
    return record;
  });
};

export const IMPORT_HEADERS = [
  'name',
  'slug',
  'sku',
  'category',
  'subcategory',
  'productType',
  'basePrice',
  'discount',
  'stock',
  'stockAlertThreshold',
  'status',
  'isFeatured',
  'isBestSeller',
  'isNewArrival',
  'description',
  'specifications',
  'seoTitle',
  'seoDescription',
  'image',
  'tags',
];

export const downloadTextFile = (filename, content, type = 'text/csv;charset=utf-8') => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export const COMPATIBLE_TYPES = ['motor', 'esc', 'propeller', 'battery', 'frame'];
