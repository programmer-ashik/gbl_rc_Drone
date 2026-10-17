import React from "react";
import Icon from "../common/Icon/Icon";

export const MetricCard = ({ label, value, icon = "chart", hint = "" }) => {
  return (
    <div className='bg-background-secondary border border-border rounded-2xl p-4'>
      <div className='flex items-center justify-between'>
        <span className='text-xs font-semibold uppercase tracking-wide text-text-muted'>
          {label}
        </span>
        <div className='bg-warning/10 text-warning p-2 rounded-lg'>
          <Icon name={icon} size={4} className='cursor-default' />
        </div>
      </div>
      <div className='mt-3 text-2xl font-extrabold text-text'>{value}</div>
      {hint ? <p className='text-xs text-text-muted mt-1'>{hint}</p> : null}
    </div>
  );
};

export default MetricCard;
