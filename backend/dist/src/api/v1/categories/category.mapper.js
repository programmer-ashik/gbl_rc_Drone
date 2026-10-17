const toId = (value) => {
    if (!value)
        return null;
    return typeof value === 'string' ? value : value.toString();
};
export const toCategoryDto = (doc) => {
    const name = (doc.name || doc.label || '').trim();
    const isActive = doc.isActive ?? doc.active ?? true;
    const displayOrder = doc.displayOrder ?? doc.order ?? 0;
    const parentId = toId(doc.parentId);
    const parentSlug = doc.parentSlug || null;
    const level = doc.level || (parentId || parentSlug ? 2 : 1);
    return {
        _id: toId(doc._id),
        name,
        label: name,
        slug: doc.slug,
        parentId,
        parentSlug,
        level,
        isActive,
        active: isActive,
        displayOrder,
        order: displayOrder,
        icon: doc.icon || '',
        image: doc.image || '',
        metaTitle: doc.metaTitle || '',
        metaDescription: doc.metaDescription || '',
        isNavVisible: doc.isNavVisible ?? true,
        isFooterVisible: doc.isFooterVisible ?? false,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
    };
};
export const buildCategoryTree = (categories, predicate) => {
    const filtered = predicate ? categories.filter(predicate) : categories;
    const nodes = new Map();
    for (const item of filtered) {
        nodes.set(item._id, { ...item, children: [], subcategories: [] });
    }
    const roots = [];
    const sorted = [...filtered].sort((a, b) => {
        if (a.displayOrder !== b.displayOrder)
            return a.displayOrder - b.displayOrder;
        return a.name.localeCompare(b.name);
    });
    for (const item of sorted) {
        const node = nodes.get(item._id);
        if (!node)
            continue;
        const parent = (item.parentId && nodes.get(item.parentId)) ||
            (item.parentSlug ? [...nodes.values()].find((candidate) => candidate.slug === item.parentSlug) : null);
        if (parent && parent._id !== node._id) {
            parent.children.push(node);
            parent.subcategories.push(node);
        }
        else {
            roots.push(node);
        }
    }
    const sortNodes = (list) => {
        list.sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name));
        list.forEach((node) => sortNodes(node.children));
    };
    sortNodes(roots);
    return roots;
};
