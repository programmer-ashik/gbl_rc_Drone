import React, { useMemo, useRef } from 'react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { resolveAssetUrl } from '../utils/products';

const SortablePhoto = ({ photo, index, onPrimary, onRemove }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: photo.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} className='relative overflow-hidden rounded-xl border border-border bg-background'>
      <img src={resolveAssetUrl(photo.url)} alt='' className='h-28 w-full cursor-grab object-cover' {...attributes} {...listeners} />
      <div className='flex items-center justify-between px-2 py-1 text-[11px]'>
        <button type='button' className={photo.isPrimary ? 'font-semibold text-warning' : 'text-text-muted'} onClick={() => onPrimary(index)}>
          {photo.isPrimary ? 'Primary' : 'Make primary'}
        </button>
        <button type='button' className='text-danger' onClick={() => onRemove(index)}>
          Delete
        </button>
      </div>
    </div>
  );
};

export const ProductImages = ({ photos, onChange, onUpload, uploading }) => {
  const inputRef = useRef(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const items = useMemo(
    () => photos.map((photo, index) => ({ ...photo, id: photo.id || photo.url || `photo-${index}` })),
    [photos],
  );

  const onDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = items.findIndex((item) => item.id === active.id);
    const to = items.findIndex((item) => item.id === over.id);
    if (from < 0 || to < 0) return;
    onChange(arrayMove(items, from, to).map((item, index) => ({ ...item, isPrimary: index === 0 ? item.isPrimary : item.isPrimary })));
  };

  const setPrimary = (index) => {
    onChange(items.map((item, current) => ({ ...item, isPrimary: current === index })));
  };

  const remove = (index) => {
    const next = items.filter((_, current) => current !== index);
    if (next.length && !next.some((item) => item.isPrimary)) next[0].isPrimary = true;
    onChange(next);
  };

  const onDrop = (event) => {
    event.preventDefault();
    const files = [...(event.dataTransfer?.files || [])].filter((file) => file.type.startsWith('image/'));
    if (files.length) onUpload(files);
  };

  return (
    <div>
      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className='mb-3 cursor-pointer rounded-xl border border-dashed border-border bg-background px-4 py-6 text-center text-sm text-text-muted'
      >
        {uploading ? 'Uploading...' : 'Drag and drop images, or click to upload'}
        <input
          ref={inputRef}
          type='file'
          accept='image/png,image/jpeg,image/webp,image/gif'
          multiple
          className='hidden'
          onChange={(event) => {
            const files = [...(event.target.files || [])];
            event.target.value = '';
            if (files.length) onUpload(files);
          }}
        />
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items.map((item) => item.id)} strategy={rectSortingStrategy}>
          <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
            {items.map((photo, index) => (
              <SortablePhoto key={photo.id} photo={photo} index={index} onPrimary={setPrimary} onRemove={remove} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default ProductImages;
