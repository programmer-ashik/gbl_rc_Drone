import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DayPicker } from 'react-day-picker';
import { format, isValid } from 'date-fns';
import 'react-day-picker/style.css';
import { adminService } from '../services';
import { ROUTES } from '../constants/routes';
import { formatDate, money, statusBadgeClass } from '../utils/orders';

const panelClass = 'rounded-2xl border border-border bg-background-secondary p-5';
const PIE_COLORS = ['#f59e0b', '#0ea5e9', '#6366f1', '#10b981', '#22c55e', '#ef4444', '#94a3b8'];

const ChartIcon = ({ className = 'h-4 w-4' }) => (
  <svg className={className} viewBox='0 0 24 24' fill='none' aria-hidden='true'>
    <path d='M4 19V5' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' />
    <path d='M4 19h16' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' />
    <path
      d='M8 15v-3M12 15V8M16 15v-6M20 15v-9'
      stroke='currentColor'
      strokeWidth='1.8'
      strokeLinecap='round'
    />
  </svg>
);

const RevenueChart = ({ points = [] }) => {
  const width = 560;
  const height = 180;
  const padding = 24;
  const max = Math.max(...points.map((point) => point.revenue), 1);
  const coords = points.map((point, index) => {
    const x = padding + (index / Math.max(points.length - 1, 1)) * (width - padding * 2);
    const y = height - padding - (point.revenue / max) * (height - padding * 2);
    return { x, y, ...point };
  });
  const path = coords.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`).join(' ');
  const area = coords.length
    ? `${path} L${coords[coords.length - 1].x},${height - padding} L${coords[0].x},${height - padding} Z`
    : '';

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className='h-48 w-full'>
      <path d={area} fill='rgba(245, 158, 11, 0.15)' />
      <path d={path} fill='none' stroke='#f59e0b' strokeWidth='3' />
      {coords.map((point) => (
        <g key={point._id}>
          <circle cx={point.x} cy={point.y} r='4' fill='#f59e0b' />
          <text x={point.x} y={height - 6} textAnchor='middle' style={{ fill: '#64748b', fontSize: 10 }}>
            {String(point._id).slice(5)}
          </text>
        </g>
      ))}
    </svg>
  );
};

const UsersChart = ({ points = [] }) => {
  const width = 560;
  const height = 180;
  const padding = 24;
  if (!points.length) {
    return <p className='py-10 text-center text-sm text-text-muted'>No new users</p>;
  }
  const max = Math.max(...points.map((point) => Number(point.count) || 0), 1);
  const coords = points.map((point, index) => {
    const x = padding + (index / Math.max(points.length - 1, 1)) * (width - padding * 2);
    const y = height - padding - ((Number(point.count) || 0) / max) * (height - padding * 2);
    return { x, y, ...point };
  });
  const path = coords.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`).join(' ');
  const area = `${path} L${coords[coords.length - 1].x},${height - padding} L${coords[0].x},${height - padding} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className='h-48 w-full'>
      <defs>
        <linearGradient id='usersFill' x1='0' y1='0' x2='0' y2='1'>
          <stop offset='0%' stopColor='#0ea5e9' stopOpacity='0.35' />
          <stop offset='100%' stopColor='#0ea5e9' stopOpacity='0.02' />
        </linearGradient>
      </defs>
      <path d={area} fill='url(#usersFill)' />
      <path d={path} fill='none' stroke='#0ea5e9' strokeWidth='3' />
      {coords.map((point) => (
        <g key={point._id}>
          <circle cx={point.x} cy={point.y} r='4' fill='#0ea5e9' />
          <title>{`${point._id}: ${point.count}`}</title>
          <text x={point.x} y={height - 6} textAnchor='middle' style={{ fill: '#64748b', fontSize: 10 }}>
            {String(point._id).slice(5)}
          </text>
        </g>
      ))}
    </svg>
  );
};

const BarChart = ({ points = [], valueKey = 'quantity' }) => {
  const max = Math.max(...points.map((point) => Number(point[valueKey] || 0)), 1);
  return (
    <div className='space-y-2'>
      {points.map((point) => (
        <div key={String(point._id || point.title)} className='grid grid-cols-[1fr_120px] items-center gap-3 text-sm'>
          <div>
            <p className='truncate font-medium'>{point.title || 'Product'}</p>
            <div className='mt-1 h-2 rounded-full bg-background'>
              <div className='h-2 rounded-full bg-warning' style={{ width: `${(Number(point[valueKey] || 0) / max) * 100}%` }} />
            </div>
          </div>
          <p className='text-right text-xs text-text-muted'>
            {point.quantity || 0} sold · {money(point.revenue)}
          </p>
        </div>
      ))}
      {!points.length && <p className='py-8 text-center text-sm text-text-muted'>No sales data yet</p>}
    </div>
  );
};

const StatusPie = ({ rows = [] }) => {
  const total = rows.reduce((sum, row) => sum + row.count, 0) || 1;
  let angle = -90;
  const slices = rows.map((row, index) => {
    const sweep = (row.count / total) * 360;
    const start = angle;
    angle += sweep;
    const large = sweep > 180 ? 1 : 0;
    const rad = Math.PI / 180;
    const x1 = 80 + 70 * Math.cos(start * rad);
    const y1 = 80 + 70 * Math.sin(start * rad);
    const x2 = 80 + 70 * Math.cos((start + sweep) * rad);
    const y2 = 80 + 70 * Math.sin((start + sweep) * rad);
    return {
      ...row,
      color: PIE_COLORS[index % PIE_COLORS.length],
      d: `M80,80 L${x1},${y1} A70,70 0 ${large} 1 ${x2},${y2} Z`,
    };
  });

  return (
    <div className='flex flex-wrap items-center gap-4'>
      <svg viewBox='0 0 160 160' className='h-40 w-40'>
        {slices.map((slice) => (
          <path key={slice.status} d={slice.d} fill={slice.color} />
        ))}
        <circle cx='80' cy='80' r='36' fill='white' />
      </svg>
      <ul className='space-y-1 text-sm'>
        {slices.map((slice) => (
          <li key={slice.status} className='flex items-center gap-2 capitalize'>
            <span className='inline-block h-2.5 w-2.5 rounded-full' style={{ background: slice.color }} />
            {slice.status}: {slice.count}
          </li>
        ))}
      </ul>
    </div>
  );
};

const toQueryDate = (date) => (date && isValid(date) ? format(date, 'yyyy-MM-dd') : undefined);

export const Dashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [liveNote, setLiveNote] = useState('');
  const [range, setRange] = useState('daily');
  const [dateRange, setDateRange] = useState({ from: undefined, to: undefined });
  const [pickerOpen, setPickerOpen] = useState(false);

  const query = useMemo(() => {
    if (range === 'custom' && dateRange.from && dateRange.to) {
      return {
        range: 'custom',
        from: toQueryDate(dateRange.from),
        to: toQueryDate(dateRange.to),
      };
    }
    return { range };
  }, [range, dateRange]);

  const refresh = React.useCallback(() => {
    if (range === 'custom' && (!dateRange.from || !dateRange.to)) return;
    Promise.all([adminService.getDashboard(query), adminService.getStats(query)])
      .then(([nextDashboard, nextStats]) => {
        setDashboard(nextDashboard);
        setStats(nextStats);
        setError('');
      })
      .catch((requestError) => setError(requestError.message));
  }, [query, range, dateRange.from, dateRange.to]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const onRealtime = (event) => {
      const type = event.detail?.type;
      if (['order', 'stock', 'low-stock', 'stats', 'products'].includes(type)) {
        refresh();
        setLiveNote(`Live update · ${type}`);
        window.setTimeout(() => setLiveNote(''), 2500);
      }
    };
    window.addEventListener('admin:realtime', onRealtime);
    return () => window.removeEventListener('admin:realtime', onRealtime);
  }, [refresh]);

  const analytics = useMemo(() => dashboard?.analytics || stats?.analytics || null, [dashboard, stats]);

  const cards = [
    { label: 'Revenue today', value: analytics ? money(analytics.realtime.today.revenue) : '—' },
    { label: 'Revenue week', value: analytics ? money(analytics.realtime.week.revenue) : '—' },
    { label: 'Revenue month', value: analytics ? money(analytics.realtime.month.revenue) : '—' },
    { label: 'Orders', value: dashboard?.orders ?? '—' },
    { label: 'Products', value: dashboard?.products ?? '—' },
    { label: 'Users', value: dashboard?.users ?? '—' },
  ];

  const rangeLabel =
    range === 'custom' && dateRange.from && dateRange.to
      ? `${format(dateRange.from, 'MMM d')} – ${format(dateRange.to, 'MMM d')}`
      : range;

  return (
    <div>
      <div className='mb-6 flex flex-wrap items-end justify-between gap-3'>
        <div>
          <h1 className='text-2xl font-extrabold text-text-primary'>Dashboard</h1>
          <p className='mt-1 flex items-center gap-2 text-sm text-text-muted'>
            <span className='inline-flex items-center gap-1.5'>
              <ChartIcon className='h-4 w-4 text-warning' />
              Store overview
            </span>
            {liveNote ? <span className='text-warning'>{liveNote}</span> : null}
          </p>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          {['daily', 'weekly', 'monthly'].map((value) => (
            <button
              key={value}
              type='button'
              onClick={() => {
                setRange(value);
                setPickerOpen(false);
              }}
              className={`rounded-xl px-3 py-1.5 text-sm font-semibold capitalize ${
                range === value ? 'bg-warning text-white' : 'border border-border'
              }`}
            >
              {value}
            </button>
          ))}
          <div className='relative'>
            <button
              type='button'
              onClick={() => setPickerOpen((open) => !open)}
              className={`rounded-xl px-3 py-1.5 text-sm font-semibold ${
                range === 'custom' ? 'bg-warning text-white' : 'border border-border'
              }`}
            >
              {range === 'custom' && dateRange.from && dateRange.to
                ? `${format(dateRange.from, 'MMM d')} – ${format(dateRange.to, 'MMM d, yyyy')}`
                : 'Custom range'}
            </button>
            {pickerOpen ? (
              <div className='absolute right-0 z-20 mt-2 rounded-2xl border border-border bg-background p-3 shadow-lg'>
                <DayPicker
                  mode='range'
                  selected={dateRange}
                  onSelect={(next) => {
                    setDateRange(next || { from: undefined, to: undefined });
                    if (next?.from && next?.to) {
                      setRange('custom');
                      setPickerOpen(false);
                    }
                  }}
                  numberOfMonths={1}
                  disabled={{ after: new Date() }}
                />
              </div>
            ) : null}
          </div>
          <Link to={ROUTES.ORDERS} className='rounded-xl border border-border px-4 py-2 text-sm font-semibold'>
            Orders
          </Link>
          <Link to={ROUTES.SETTINGS} className='rounded-xl bg-warning px-4 py-2 text-sm font-semibold text-white'>
            Settings
          </Link>
        </div>
      </div>

      {error && <div className='mb-4 rounded-xl bg-red-50 p-3 text-sm text-danger'>{error}</div>}

      <div className='mb-6 grid grid-cols-2 gap-4 xl:grid-cols-6'>
        {cards.map((card) => (
          <div key={card.label} className={panelClass}>
            <p className='text-xs uppercase tracking-wide text-text-muted'>{card.label}</p>
            <p className='mt-2 text-xl font-bold text-text-primary'>{card.value}</p>
          </div>
        ))}
      </div>

      <div className='mb-6 grid grid-cols-1 gap-4 xl:grid-cols-2'>
        <section className={panelClass}>
          <h2 className='mb-2 text-sm font-bold uppercase tracking-wide text-text-muted'>Revenue ({rangeLabel})</h2>
          {analytics?.revenueByDay?.length ? <RevenueChart points={analytics.revenueByDay} /> : (
            <p className='py-10 text-center text-sm text-text-muted'>No revenue data yet</p>
          )}
        </section>
        <section className={panelClass}>
          <h2 className='mb-2 text-sm font-bold uppercase tracking-wide text-text-muted'>Order status</h2>
          {analytics?.statusBreakdown?.length ? <StatusPie rows={analytics.statusBreakdown} /> : (
            <p className='py-10 text-center text-sm text-text-muted'>No orders yet</p>
          )}
        </section>
      </div>

      <div className='mb-6 grid grid-cols-1 gap-4 xl:grid-cols-2'>
        <section className={panelClass}>
          <div className='mb-3 flex items-center justify-between'>
            <h2 className='text-sm font-bold uppercase tracking-wide text-text-muted'>Recent orders</h2>
            <Link to={ROUTES.ORDERS} className='text-sm font-semibold text-warning'>
              View all
            </Link>
          </div>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='text-left text-xs uppercase text-text-muted'>
                  <th className='py-2'>Order</th>
                  <th className='py-2'>Customer</th>
                  <th className='py-2'>Total</th>
                  <th className='py-2'>Status</th>
                </tr>
              </thead>
              <tbody>
                {(analytics?.recentOrders || []).map((order) => (
                  <tr key={order._id} className='border-t border-border'>
                    <td className='py-2'>
                      <Link to={ROUTES.ORDERS_DETAIL.replace(':id', order._id)} className='font-semibold text-warning'>
                        {order.orderNumber}
                      </Link>
                      <div className='text-xs text-text-muted'>{formatDate(order.createdAt)}</div>
                    </td>
                    <td className='py-2'>{order.customer}</td>
                    <td className='py-2'>{money(order.total)}</td>
                    <td className='py-2'>
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold capitalize ${statusBadgeClass(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {!(analytics?.recentOrders || []).length && (
                  <tr>
                    <td colSpan={4} className='py-8 text-center text-text-muted'>
                      No recent orders
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className={panelClass}>
          <h2 className='mb-3 text-sm font-bold uppercase tracking-wide text-text-muted'>Low stock alerts</h2>
          <div className='space-y-2'>
            {(dashboard?.lowStockProducts || []).slice(0, 8).map((product) => (
              <div key={product._id} className='flex items-center justify-between gap-3 border-b border-border pb-2 last:border-0'>
                <span className='truncate text-sm'>{product.name || product.title}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadgeClass('pending')}`}>
                  stock {product.stock}
                </span>
              </div>
            ))}
            {!(dashboard?.lowStockProducts || []).length && (
              <p className='py-8 text-center text-sm text-text-muted'>No low stock items</p>
            )}
          </div>
        </section>
      </div>

      <div className='grid grid-cols-1 gap-4 xl:grid-cols-2'>
        <section className={panelClass}>
          <h2 className='mb-3 text-sm font-bold uppercase tracking-wide text-text-muted'>Top selling products</h2>
          <BarChart points={analytics?.topProducts || []} />
        </section>
        <section className={panelClass}>
          <h2 className='mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-text-muted'>
            <ChartIcon className='h-3.5 w-3.5 text-sky-500' />
            New users · {analytics?.newUsers?.total || 0}
          </h2>
          <UsersChart points={analytics?.newUsers?.byDay || []} />
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
