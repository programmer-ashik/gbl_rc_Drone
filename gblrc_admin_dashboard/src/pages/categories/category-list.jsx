import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ROUTES } from '../../constants/routes';
import { parentName } from '../../utils/categories';
import {
  bulkUpdateCategoryItems,
  fetchCategories,
  fetchCategoryUsage,
  removeCategory,
  reorderCategoryItems,
  selectCategories,
} from '../../store/slices/category-slice';
import { pushToast } from '../../store/slices/toast-slice';

const PAGE_SIZE = 10;

const VisibilityPills = ({ item }) => (
  <div className='flex flex-wrap gap-1'>
    <span className={`rounded-full px-2 py-0.5 text-[11px] ${item.isActive ? 'bg-emerald-50 text-success' : 'bg-slate-100 text-text-muted'}`}>
      {item.isActive ? 'Active' : 'Hidden'}
    </span>
    <span className={`rounded-full px-2 py-0.5 text-[11px] ${item.isNavVisible ? 'bg-amber-50 text-warning' : 'bg-slate-100 text-text-muted'}`}>
      {item.isNavVisible ? 'Nav' : 'No nav'}
    </span>
    {item.isFooterVisible && (
      <span className='rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-text-muted'>Footer</span>
    )}
  </div>
);

const SortableRow = ({ item, categories, selected, onSelect, onEdit, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item._id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <tr ref={setNodeRef} style={style} className='border-t border-border bg-background-secondary'>
      <td className='px-3 py-3'>
        <input type='checkbox' checked={selected} onChange={onSelect} />
      </td>
      <td className='px-3 py-3 text-text-muted cursor-grab' {...attributes} {...listeners}>
        ⋮⋮
      </td>
      <td className='px-3 py-3'>
        <div className='font-semibold text-text-primary'>{item.name}</div>
        <div className='text-xs text-text-muted'>{item.productCount || 0} products</div>
      </td>
      <td className='px-3 py-3 text-xs'>{item.slug}</td>
      <td className='px-3 py-3'>L{item.level}</td>
      <td className='px-3 py-3'>{parentName(categories, item.parentId)}</td>
      <td className='px-3 py-3'>
        <VisibilityPills item={item} />
      </td>
      <td className='px-3 py-3'>{item.displayOrder}</td>
      <td className='px-3 py-3'>
        <div className='flex gap-2 text-xs font-semibold'>
          <button type='button' className='text-warning' onClick={onEdit}>
            Edit
          </button>
          <button type='button' className='text-danger' onClick={onDelete}>
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
};

export const CategoryListPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, loading, saving } = useSelector(selectCategories);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [pendingBulkDelete, setPendingBulkDelete] = useState(null);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...items]
      .filter((item) => !query || item.name?.toLowerCase().includes(query) || item.slug?.includes(query))
      .sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name));
  }, [items, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const onDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const dragged = items.find((item) => item._id === active.id);
    if (!dragged) return;
    const siblings = items
      .filter((item) => (item.parentId || '') === (dragged.parentId || ''))
      .sort((a, b) => a.displayOrder - b.displayOrder);
    const from = siblings.findIndex((item) => item._id === active.id);
    const to = siblings.findIndex((item) => item._id === over.id);
    if (from < 0 || to < 0) return;
    const next = arrayMove(siblings, from, to).map((item, index) => ({
      id: item._id,
      displayOrder: index,
      parentId: item.parentId || null,
    }));
    dispatch(reorderCategoryItems(next));
  };

  const toggleSelect = (id) => {
    setSelected((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));
  };

  const usageFromResult = (item, result) => {
    const payload = result.meta.requestStatus === 'fulfilled' ? result.payload : {};
    return {
      ...item,
      productCount: payload.productCount ?? item.productCount ?? 0,
      childCount: payload.childCount ?? item.childCount ?? 0,
      canDelete: payload.canDelete ?? ((payload.productCount ?? item.productCount ?? 0) === 0 && (payload.childCount ?? item.childCount ?? 0) === 0),
    };
  };

  const requestDelete = async (item) => {
    const result = await dispatch(fetchCategoryUsage(item._id));
    setPendingDelete(usageFromResult(item, result));
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    if (pendingDelete.productCount > 0 || pendingDelete.childCount > 0) {
      dispatch(
        pushToast({
          type: 'error',
          message: `Cannot delete "${pendingDelete.name}". It has ${pendingDelete.productCount || 0} products and ${pendingDelete.childCount || 0} subcategories.`,
        }),
      );
      setPendingDelete(null);
      return;
    }
    await dispatch(removeCategory(pendingDelete._id || pendingDelete.id));
    setPendingDelete(null);
    setSelected((current) => current.filter((id) => id !== pendingDelete._id));
  };

  const confirmBulkDelete = async () => {
    if (!pendingBulkDelete?.length) return;
    const blocked = pendingBulkDelete.filter((item) => item.productCount > 0 || item.childCount > 0);
    const removable = pendingBulkDelete.filter((item) => item.productCount === 0 && item.childCount === 0);
    if (blocked.length) {
      dispatch(
        pushToast({
          type: 'error',
          message: `Cannot delete ${blocked.map((item) => `${item.name} (${item.productCount} products)`).join(', ')}.`,
        }),
      );
    }
    for (const item of removable) {
      await dispatch(removeCategory(item._id));
    }
    setPendingBulkDelete(null);
    setSelected([]);
  };

  const runBulk = async (action) => {
    if (!selected.length) return;
    if (action === 'delete') {
      const usages = await Promise.all(
        selected.map(async (id) => {
          const item = items.find((entry) => entry._id === id);
          const result = await dispatch(fetchCategoryUsage(id));
          return usageFromResult(item || { _id: id, name: id }, result);
        }),
      );
      setPendingBulkDelete(usages);
      return;
    }
    const value = action === 'activate';
    dispatch(bulkUpdateCategoryItems(selected.map((id) => ({ id, isActive: value }))));
    setSelected([]);
  };

  return (
    <div>
      <div className='mb-6 flex flex-wrap items-end justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-extrabold text-text-primary'>Categories</h1>
          <p className='mt-1 text-sm text-text-muted'>Drag rows to reorder siblings. Changes sync to storefront navigation.</p>
        </div>
        <div className='flex gap-2'>
          <Link to={ROUTES.CATEGORIES_TREE} className='rounded-xl border border-border px-4 py-2 text-sm font-semibold'>
            Tree view
          </Link>
          <Link to={ROUTES.CATEGORIES_NEW} className='rounded-xl bg-warning px-4 py-2 text-sm font-semibold text-white'>
            Add category
          </Link>
        </div>
      </div>

      <div className='mb-4 flex flex-wrap items-center gap-3'>
        <input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder='Search by name or slug'
          className='w-full max-w-sm rounded-xl border border-border px-3 py-2 text-sm'
        />
        {selected.length > 0 && (
          <div className='flex flex-wrap gap-2 text-xs'>
            <button type='button' className='rounded-lg border border-border px-3 py-1.5' onClick={() => runBulk('activate')}>
              Activate
            </button>
            <button type='button' className='rounded-lg border border-border px-3 py-1.5' onClick={() => runBulk('deactivate')}>
              Deactivate
            </button>
            <button type='button' className='rounded-lg border border-danger px-3 py-1.5 text-danger' onClick={() => runBulk('delete')}>
              Delete
            </button>
          </div>
        )}
      </div>

      <div className='overflow-hidden rounded-2xl border border-border bg-background-secondary'>
        {loading ? (
          <div className='p-6 text-sm text-text-muted'>Loading categories...</div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <table className='w-full text-sm'>
              <thead>
                <tr className='text-left text-xs uppercase tracking-wide text-text-muted'>
                  <th className='px-3 py-3'>
                    <input
                      type='checkbox'
                      checked={pageItems.length > 0 && pageItems.every((item) => selected.includes(item._id))}
                      onChange={(event) => {
                        const ids = pageItems.map((item) => item._id);
                        setSelected(event.target.checked ? [...new Set([...selected, ...ids])] : selected.filter((id) => !ids.includes(id)));
                      }}
                    />
                  </th>
                  <th className='px-3 py-3'></th>
                  <th className='px-3 py-3'>Name</th>
                  <th className='px-3 py-3'>Slug</th>
                  <th className='px-3 py-3'>Level</th>
                  <th className='px-3 py-3'>Parent</th>
                  <th className='px-3 py-3'>Visibility</th>
                  <th className='px-3 py-3'>Order</th>
                  <th className='px-3 py-3'>Actions</th>
                </tr>
              </thead>
              <SortableContext items={pageItems.map((item) => item._id)} strategy={verticalListSortingStrategy}>
                <tbody>
                  {pageItems.length === 0 ? (
                    <tr>
                      <td colSpan='9' className='px-3 py-8 text-center text-sm text-text-muted'>
                        No categories match this search.
                      </td>
                    </tr>
                  ) : (
                    pageItems.map((item) => (
                      <SortableRow
                        key={item._id}
                        item={item}
                        categories={items}
                        selected={selected.includes(item._id)}
                        onSelect={() => toggleSelect(item._id)}
                        onEdit={() => navigate(`/categories/${item._id}/edit`)}
                        onDelete={() => requestDelete(item)}
                      />
                    ))
                  )}
                </tbody>
              </SortableContext>
            </table>
          </DndContext>
        )}
      </div>

      <div className='mt-4 flex items-center justify-between text-sm'>
        <p className='text-text-muted'>
          {filtered.length} categories · page {currentPage} of {pageCount}
          {saving ? ' · Saving...' : ''}
        </p>
        <div className='flex gap-2'>
          <button type='button' disabled={currentPage <= 1} className='rounded-lg border border-border px-3 py-1.5 disabled:opacity-40' onClick={() => setPage((value) => value - 1)}>
            Previous
          </button>
          <button type='button' disabled={currentPage >= pageCount} className='rounded-lg border border-border px-3 py-1.5 disabled:opacity-40' onClick={() => setPage((value) => value + 1)}>
            Next
          </button>
        </div>
      </div>

      {pendingDelete && (
        <div className='fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4'>
          <div className='w-full max-w-md rounded-2xl bg-background-secondary p-6 shadow-xl'>
            <h2 className='text-lg font-bold text-text-primary'>Disable {pendingDelete.name}?</h2>
            <p className='mt-2 text-sm text-text-muted'>
              This category has <strong>{pendingDelete.productCount || 0}</strong> products
              and <strong>{pendingDelete.childCount || 0}</strong> subcategories.
            </p>
            {(pendingDelete.productCount > 0 || pendingDelete.childCount > 0) && (
              <p className='mt-2 text-sm text-danger'>Move or archive linked products and children before deleting.</p>
            )}
            <div className='mt-5 flex justify-end gap-2'>
              <button type='button' className='rounded-xl border border-border px-4 py-2 text-sm' onClick={() => setPendingDelete(null)}>
                Cancel
              </button>
              <button
                type='button'
                disabled={saving || pendingDelete.productCount > 0 || pendingDelete.childCount > 0}
                className='rounded-xl bg-danger px-4 py-2 text-sm font-semibold text-white disabled:opacity-40'
                onClick={confirmDelete}
              >
                Disable
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingBulkDelete && (
        <div className='fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4'>
          <div className='w-full max-w-md rounded-2xl bg-background-secondary p-6 shadow-xl'>
            <h2 className='text-lg font-bold text-text-primary'>Disable {pendingBulkDelete.length} categories?</h2>
            <ul className='mt-3 max-h-56 space-y-2 overflow-auto text-sm'>
              {pendingBulkDelete.map((item) => (
                <li key={item._id} className='rounded-lg border border-border px-3 py-2'>
                  <p className='font-semibold'>{item.name}</p>
                  <p className={item.productCount > 0 || item.childCount > 0 ? 'text-danger' : 'text-text-muted'}>
                    {item.productCount || 0} products · {item.childCount || 0} subcategories
                  </p>
                </li>
              ))}
            </ul>
            <div className='mt-5 flex justify-end gap-2'>
              <button type='button' className='rounded-xl border border-border px-4 py-2 text-sm' onClick={() => setPendingBulkDelete(null)}>
                Cancel
              </button>
              <button
                type='button'
                disabled={saving || pendingBulkDelete.every((item) => item.productCount > 0 || item.childCount > 0)}
                className='rounded-xl bg-danger px-4 py-2 text-sm font-semibold text-white disabled:opacity-40'
                onClick={confirmBulkDelete}
              >
                Disable eligible
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryListPage;
