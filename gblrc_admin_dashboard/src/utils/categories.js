export const makeSlug = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

export const ICON_OPTIONS = [
  'drone',
  'rocket',
  'car',
  'battery',
  'motor',
  'radio',
  'tool',
  'grid',
  'star',
  'tag',
];

export const resolveAssetUrl = (value) => {
  if (!value) return '';
  if (/^https?:\/\//i.test(value) || value.startsWith('blob:')) return value;
  const base = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  return `${base}${value.startsWith('/') ? value : `/${value}`}`;
};

export const parentName = (categories, parentId) => {
  if (!parentId) return '—';
  const parent = categories.find((item) => item._id === parentId);
  return parent?.name || parent?.label || '—';
};

export const descendantIds = (categories, id) => {
  const ids = new Set();
  const walk = (parentId) => {
    categories
      .filter((item) => item.parentId === parentId)
      .forEach((child) => {
        ids.add(child._id);
        walk(child._id);
      });
  };
  walk(id);
  return ids;
};

export const buildTree = (categories = []) => {
  const nodes = new Map(
    categories.map((item) => [item._id, { ...item, children: [] }]),
  );
  const roots = [];
  [...categories]
    .sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name))
    .forEach((item) => {
      const node = nodes.get(item._id);
      const parent = item.parentId ? nodes.get(item.parentId) : null;
      if (parent) parent.children.push(node);
      else roots.push(node);
    });
  return roots;
};

export const collectExpandableIds = (nodes = []) => {
  const ids = [];
  const walk = (list) => {
    list.forEach((node) => {
      if (node.children?.length) {
        ids.push(node._id);
        walk(node.children);
      }
    });
  };
  walk(nodes);
  return ids;
};
