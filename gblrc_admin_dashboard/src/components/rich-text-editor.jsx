import React, { useEffect, useRef } from 'react';
import { productService } from '../services';
import { pushToast } from '../store/slices/toast-slice';
import { useDispatch } from 'react-redux';
import { resolveAssetUrl } from '../utils/products';

const FONT_OPTIONS = [
  { value: '', label: 'Font' },
  { value: 'Inter, system-ui, sans-serif', label: 'Inter' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: '"Times New Roman", Times, serif', label: 'Times' },
  { value: 'Arial, Helvetica, sans-serif', label: 'Arial' },
  { value: '"Courier New", Courier, monospace', label: 'Courier' },
  { value: 'Verdana, Geneva, sans-serif', label: 'Verdana' },
];

const WEIGHT_OPTIONS = [
  { value: '', label: 'Weight' },
  { value: '300', label: 'Light' },
  { value: '400', label: 'Normal' },
  { value: '500', label: 'Medium' },
  { value: '600', label: 'Semibold' },
  { value: '700', label: 'Bold' },
  { value: '800', label: 'Extra bold' },
];

const TOOLS = [
  { cmd: 'bold', label: 'B', title: 'Bold' },
  { cmd: 'italic', label: 'I', title: 'Italic' },
  { cmd: 'underline', label: 'U', title: 'Underline' },
];

const embedFromUrl = (url) => {
  const youtube = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/i);
  if (youtube) {
    return `<p><iframe src="https://www.youtube.com/embed/${youtube[1]}" title="YouTube video" width="100%" height="280" frameborder="0" allowfullscreen></iframe></p>`;
  }
  const vimeo = url.match(/vimeo\.com\/(\d+)/i);
  if (vimeo) {
    return `<p><iframe src="https://player.vimeo.com/video/${vimeo[1]}" title="Vimeo video" width="100%" height="280" frameborder="0" allowfullscreen></iframe></p>`;
  }
  return '';
};

const wrapSelection = (style) => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return false;
  const range = selection.getRangeAt(0);
  const span = document.createElement('span');
  Object.assign(span.style, style);
  span.appendChild(range.extractContents());
  range.insertNode(span);
  selection.removeAllRanges();
  const next = document.createRange();
  next.selectNodeContents(span);
  selection.addRange(next);
  return true;
};

export const RichTextEditor = ({ value, onChange, minHeightClass = 'min-h-40' }) => {
  const dispatch = useDispatch();
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== (value || '')) {
      ref.current.innerHTML = value || '';
    }
  }, [value]);

  const emit = () => onChange(ref.current?.innerHTML || '');

  const run = (command, arg) => {
    ref.current?.focus();
    document.execCommand('styleWithCSS', false, true);
    document.execCommand(command, false, arg);
    emit();
  };

  const insertHtml = (html) => {
    ref.current?.focus();
    document.execCommand('insertHTML', false, html);
    emit();
  };

  const applyFont = (fontFamily) => {
    if (!fontFamily) return;
    ref.current?.focus();
    document.execCommand('styleWithCSS', false, true);
    document.execCommand('fontName', false, fontFamily);
    emit();
  };

  const applyWeight = (weight) => {
    if (!weight) return;
    ref.current?.focus();
    if (!wrapSelection({ fontWeight: weight })) {
      insertHtml(`<span style="font-weight:${weight}">&#8203;</span>`);
      return;
    }
    emit();
  };

  const onImage = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const result = await productService.uploadImages([file]);
      const url = resolveAssetUrl(result.url);
      insertHtml(`<p><img src="${url}" alt="" style="max-width:100%;border-radius:12px" /></p>`);
    } catch (error) {
      dispatch(pushToast({ type: 'error', message: error.message || 'Image insert failed' }));
    }
  };

  const onPdf = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const result = await productService.uploadFile(file);
      const url = resolveAssetUrl(result.url);
      insertHtml(`<p><a href="${url}" target="_blank" rel="noreferrer">${result.filename || 'Download PDF'}</a></p>`);
    } catch (error) {
      dispatch(pushToast({ type: 'error', message: error.message || 'PDF insert failed' }));
    }
  };

  const onVideo = () => {
    const url = window.prompt('YouTube or Vimeo URL');
    if (!url) return;
    const embed = embedFromUrl(url.trim());
    if (!embed) {
      dispatch(pushToast({ type: 'error', message: 'Use a YouTube or Vimeo link' }));
      return;
    }
    insertHtml(embed);
  };

  return (
    <div className='overflow-hidden rounded-xl border border-border bg-background-secondary'>
      <div className='flex flex-wrap items-center gap-1 border-b border-border bg-background px-2 py-1.5'>
        {TOOLS.map((tool) => (
          <button
            key={tool.cmd}
            type='button'
            title={tool.title}
            onMouseDown={(event) => {
              event.preventDefault();
              run(tool.cmd);
            }}
            className='h-8 min-w-8 rounded-lg px-2 text-sm font-bold hover:bg-amber-50'
          >
            {tool.label}
          </button>
        ))}
        <button
          type='button'
          title='Heading 1'
          className='h-8 rounded-lg px-2 text-xs font-semibold hover:bg-amber-50'
          onMouseDown={(event) => {
            event.preventDefault();
            run('formatBlock', 'h1');
          }}
        >
          H1
        </button>
        <button
          type='button'
          title='Heading 2'
          className='h-8 rounded-lg px-2 text-xs font-semibold hover:bg-amber-50'
          onMouseDown={(event) => {
            event.preventDefault();
            run('formatBlock', 'h2');
          }}
        >
          H2
        </button>
        <button
          type='button'
          title='Heading 3'
          className='h-8 rounded-lg px-2 text-xs font-semibold hover:bg-amber-50'
          onMouseDown={(event) => {
            event.preventDefault();
            run('formatBlock', 'h3');
          }}
        >
          H3
        </button>
        <button
          type='button'
          title='Paragraph'
          className='h-8 rounded-lg px-2 text-xs font-semibold hover:bg-amber-50'
          onMouseDown={(event) => {
            event.preventDefault();
            run('formatBlock', 'p');
          }}
        >
          P
        </button>
        <label className='flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-semibold hover:bg-amber-50' title='Text color'>
          Color
          <input
            type='color'
            defaultValue='#0f172a'
            className='h-5 w-5 cursor-pointer border-0 bg-transparent'
            onMouseDown={(event) => event.preventDefault()}
            onChange={(event) => run('foreColor', event.target.value)}
          />
        </label>
        <select
          aria-label='Font family'
          defaultValue=''
          className='h-8 max-w-[7.5rem] rounded-lg border border-border bg-background px-2 text-xs font-semibold'
          onMouseDown={(event) => event.stopPropagation()}
          onChange={(event) => {
            applyFont(event.target.value);
            event.target.value = '';
          }}
        >
          {FONT_OPTIONS.map((option) => (
            <option key={option.label} value={option.value} disabled={!option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          aria-label='Font weight'
          defaultValue=''
          className='h-8 max-w-[7rem] rounded-lg border border-border bg-background px-2 text-xs font-semibold'
          onMouseDown={(event) => event.stopPropagation()}
          onChange={(event) => {
            applyWeight(event.target.value);
            event.target.value = '';
          }}
        >
          {WEIGHT_OPTIONS.map((option) => (
            <option key={option.label} value={option.value} disabled={!option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <label className='h-8 cursor-pointer rounded-lg px-2 text-xs font-semibold hover:bg-amber-50'>
          Image
          <input type='file' accept='image/*' className='hidden' onChange={onImage} />
        </label>
        <button type='button' className='h-8 rounded-lg px-2 text-xs font-semibold hover:bg-amber-50' onClick={onVideo}>
          Video
        </button>
        <label className='h-8 cursor-pointer rounded-lg px-2 text-xs font-semibold hover:bg-amber-50'>
          PDF
          <input type='file' accept='application/pdf' className='hidden' onChange={onPdf} />
        </label>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        className={`product-editor px-3 py-2 text-sm outline-none ${minHeightClass}`}
      />
    </div>
  );
};

export default RichTextEditor;
