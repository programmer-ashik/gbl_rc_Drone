import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ROUTES } from '../../constants/routes';
import { buildTree, collectExpandableIds } from '../../utils/categories';
import {
  fetchCategories,
  fetchCategoryUsage,
  removeCategory,
  selectCategories,
} from '../../store/slices/category-slice';
import { pushToast } from '../../store/slices/toast-slice';

const TreeNode = ({ node, expanded, onToggle, onAdd, onEdit, onDelete }) => {
  const isOpen = expanded.includes(node._id);
  const hasChildren = node.children?.length > 0;

  return (
    <div className='ml-2'>
      <div className='mb-1 flex items-center gap-2 rounded-xl border border-border bg-background-secondary px-3 py-2'>
        <button
          type='button'
          className='h-6 w-6 rounded-md text-xs text-text-muted'
          onClick={() => hasChildren && onToggle(node._id)}
        >
          {hasChildren ? (isOpen ? '▾' : '▸') : '•'}
        </button>
        <div className='min-w-0 flex-1'>
          <p className='truncate text-sm font-semibold text-text-primary'>{node.name}</p>
          <p className='text-xs text-text-muted'>
            {node.slug} · L{node.level} · {node.isActive ? 'Active' : 'Hidden'}
          </p>
        </div>
        <div className='flex gap-2 text-xs font-semibold'>
          {node.level < 3 && (
            <button type='button' className='text-warning' onClick={() => onAdd(node._id)}>
              Add sub
            </button>
          )}
          <button type='button' className='text-warning' onClick={() => onEdit(node._id)}>
            Edit
          </button>
          <button type='button' className='text-danger' onClick={() => onDelete(node)}>
            Delete
          </button>
        </div>
      </div>
      {isOpen && hasChildren && (
        <div className='ml-5 border-l border-border pl-3'>
          {node.children.map((child) => (
            <TreeNode
              key={child._id}
              node={child}
              expanded={expanded}
              onToggle={onToggle}
              onAdd={onAdd}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const CategoryTreePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, loading } = useSelector(selectCategories);
  const [expanded, setExpanded] = useState([]);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const tree = useMemo(() => buildTree(items), [items]);
  const expandableIds = useMemo(() => collectExpandableIds(tree), [tree]);

  useEffect(() => {
    if (!expandableIds.length) return;
    setExpanded((current) => (current.length ? current : expandableIds));
  }, [expandableIds]);

  const toggle = (id) => {
    setExpanded((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));
  };

  const onDelete = async (node) => {
    const usage = await dispatch(fetchCategoryUsage(node._id));
    const payload = usage.meta.requestStatus === 'fulfilled' ? usage.payload : {};
    const productCount = payload.productCount ?? node.productCount ?? 0;
    const childCount = payload.childCount ?? node.childCount ?? 0;
    if (productCount > 0 || childCount > 0) {
      dispatch(
        pushToast({
          type: 'error',
          message: `Cannot delete ${node.name}. Linked products: ${productCount}, children: ${childCount}.`,
        }),
      );
      return;
    }
    if (window.confirm(`Disable ${node.name}?`)) {
      dispatch(removeCategory(node._id));
    }
  };

  return (
    <div>
      <div className='mb-6 flex flex-wrap items-end justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-extrabold text-text-primary'>Category tree</h1>
          <p className='mt-1 text-sm text-text-muted'>Expand parents to manage nested navigation.</p>
        </div>
        <div className='flex gap-2'>
          <button type='button' className='rounded-xl border border-border px-4 py-2 text-sm font-semibold' onClick={() => setExpanded(expandableIds)}>
            Expand all
          </button>
          <button type='button' className='rounded-xl border border-border px-4 py-2 text-sm font-semibold' onClick={() => setExpanded([])}>
            Collapse all
          </button>
          <Link to={ROUTES.CATEGORIES} className='rounded-xl border border-border px-4 py-2 text-sm font-semibold'>
            Table view
          </Link>
          <Link to={ROUTES.CATEGORIES_NEW} className='rounded-xl bg-warning px-4 py-2 text-sm font-semibold text-white'>
            Add category
          </Link>
        </div>
      </div>

      {loading ? (
        <p className='text-sm text-text-muted'>Loading tree...</p>
      ) : tree.length === 0 ? (
        <p className='text-sm text-text-muted'>No categories yet.</p>
      ) : (
        <div className='space-y-2'>
          {tree.map((node) => (
            <TreeNode
              key={node._id}
              node={node}
              expanded={expanded}
              onToggle={toggle}
              onAdd={(parentId) => navigate(`${ROUTES.CATEGORIES_NEW}?parentId=${parentId}`)}
              onEdit={(id) => navigate(`/categories/${id}/edit`)}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryTreePage;
