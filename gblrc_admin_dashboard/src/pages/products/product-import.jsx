import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { ROUTES } from '../../constants/routes';
import { productService } from '../../services';
import { pushToast } from '../../store/slices/toast-slice';
import { IMPORT_HEADERS, csvEscape, parseCsvText } from '../../utils/products';

const readSpreadsheet = async (file) => {
  const name = file.name.toLowerCase();
  if (name.endsWith('.csv')) return parseCsvText(await file.text());
  const XLSX = await import('xlsx');
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  return rows.map((row, index) => {
    const record = { _row: String(index + 2) };
    Object.entries(row).forEach(([key, value]) => {
      record[String(key).trim()] = String(value ?? '').trim();
    });
    return record;
  });
};

export const ProductImportPage = () => {
  const dispatch = useDispatch();
  const [rows, setRows] = useState([]);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState('');

  const onFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    try {
      const parsed = await readSpreadsheet(file);
      setRows(parsed);
      dispatch(pushToast({ type: 'success', message: `${parsed.length} rows loaded from ${file.name}` }));
    } catch (error) {
      dispatch(pushToast({ type: 'error', message: error.message || 'Could not read file' }));
    }
  };

  const validate = async () => {
    setBusy(true);
    try {
      const data = await productService.validateImport({ rows });
      setResult(data);
      dispatch(pushToast({
        type: data.valid ? 'success' : 'error',
        message: data.valid ? 'All rows look valid' : `${data.errors.length} validation issues`,
      }));
    } catch (error) {
      dispatch(pushToast({ type: 'error', message: error.message || 'Validation failed' }));
    } finally {
      setBusy(false);
    }
  };

  const commit = async () => {
    if (result && !result.valid) return;
    setBusy(true);
    try {
      const data = await productService.import({ rows });
      setResult(data);
      if (data.valid) dispatch(pushToast({ type: 'success', message: `Imported ${data.created} products` }));
      else dispatch(pushToast({ type: 'error', message: 'Fix validation errors before importing' }));
    } catch (error) {
      dispatch(pushToast({ type: 'error', message: error.message || 'Import failed' }));
    } finally {
      setBusy(false);
    }
  };

  const downloadTemplate = () => {
    const sample = [IMPORT_HEADERS.join(','), ['Demo Motor', 'demo-motor', 'MOT-001', 'motors', 'brushless', 'single', '1500', '0', '20', '5', 'active', 'false', 'false', 'true', 'Brushless drone motor', 'KV: 2450 | Weight: 32g', 'Demo Motor', 'FPV motor', '', 'fpv|motor'].map(csvEscape).join(',')].join('\n');
    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'product-import-template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className='max-w-5xl'>
      <Link to={ROUTES.PRODUCTS} className='text-sm text-warning'>← Back to products</Link>
      <h1 className='mt-2 text-2xl font-extrabold text-text-primary'>Import products</h1>
      <p className='mt-1 text-sm text-text-muted'>Upload a CSV or Excel file, validate the rows, then import.</p>

      <div className='mt-6 rounded-2xl border border-border bg-background-secondary p-5'>
        <div className='flex flex-wrap gap-2'>
          <input type='file' accept='.csv,.xlsx,.xls' onChange={onFile} className='text-sm' />
          <button type='button' onClick={downloadTemplate} className='rounded-xl border border-border px-3 py-2 text-sm'>Download template</button>
          <button type='button' disabled={!rows.length || busy} onClick={validate} className='rounded-xl border border-border px-3 py-2 text-sm disabled:opacity-40'>Validate</button>
          <button type='button' disabled={!rows.length || busy || (result && !result.valid)} onClick={commit} className='rounded-xl bg-warning px-3 py-2 text-sm font-semibold text-white disabled:opacity-40'>
            {busy ? 'Working...' : 'Import'}
          </button>
        </div>
        {fileName && <p className='mt-3 text-sm text-text-muted'>{fileName} · {rows.length} rows</p>}
      </div>

      {result?.errors?.length > 0 && (
        <div className='mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-danger'>
          <p className='font-semibold'>Validation errors</p>
          <ul className='mt-2 space-y-1'>
            {result.errors.slice(0, 20).map((error, index) => (
              <li key={`${error.row}-${error.field}-${index}`}>Row {error.row}: {error.field} — {error.message}</li>
            ))}
          </ul>
        </div>
      )}

      {result?.created > 0 && (
        <div className='mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-success'>
          Imported {result.created} products.
        </div>
      )}

      {rows.length > 0 && (
        <div className='mt-4 overflow-auto rounded-2xl border border-border bg-background-secondary'>
          <table className='min-w-full text-xs'>
            <thead>
              <tr className='text-left uppercase text-text-muted'>
                {IMPORT_HEADERS.slice(0, 8).map((header) => (
                  <th key={header} className='px-3 py-2'>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 12).map((row, index) => (
                <tr key={index} className='border-t border-border'>
                  {IMPORT_HEADERS.slice(0, 8).map((header) => (
                    <td key={header} className='px-3 py-2'>{row[header]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ProductImportPage;
