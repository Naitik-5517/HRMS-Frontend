import React from 'react';
import { Filter } from 'lucide-react';

const QAFilterBar = ({ dateRange, handleDateRangeChange, handleClear }) => {
  return (
    <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-2 text-slate-700 font-semibold">
        <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
        <span className="text-sm sm:text-base">Organization Analytics</span>
      </div>
      <div className="w-full grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-2 lg:flex lg:flex-row lg:gap-4 lg:w-auto">
        <div className="col-span-2 sm:col-span-1 bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-row items-center gap-3">
          <label className="text-xs text-slate-500 uppercase font-bold">FROM</label>
          <input
            className="flex-1 bg-white border border-slate-300 text-slate-700 text-sm rounded px-2 py-1.5 outline-none"
            type="date"
            value={dateRange.start}
            onChange={e => handleDateRangeChange('start', e.target.value)}
          />
        </div>
        <div className="col-span-2 sm:col-span-1 bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-row items-center gap-3">
          <label className="text-xs text-slate-500 uppercase font-bold">TO</label>
          <input
            className="flex-1 bg-white border border-slate-300 text-slate-700 text-sm rounded px-2 py-1.5 outline-none"
            type="date"
            value={dateRange.end}
            onChange={e => handleDateRangeChange('end', e.target.value)}
          />
        </div>
        <button
          className="col-span-2 sm:col-span-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg px-4 py-2 transition-colors"
          onClick={handleClear}
        >
          Clear
        </button>
      </div>
    </div>
  );
};

export default QAFilterBar;
