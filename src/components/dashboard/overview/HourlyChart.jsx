import React from 'react';
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Clock } from 'lucide-react';

const HourlyChart = ({ data }) => {
  return (
    <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-100 w-full">
      {/* Header with responsive flex layout */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4 mb-4 md:mb-6">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
          <h3 className="font-bold text-slate-800 text-base sm:text-lg">
            Hourly Production vs Target
          </h3>
        </div>
        <div className="text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded border border-slate-200 w-full sm:w-auto text-center sm:text-left">
          Aggregated for selected range
        </div>
      </div>
      
      {/* Chart container with responsive height */}
      <div className="h-64 sm:h-72 md:h-80 lg:h-96 min-w-[200px] min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
          <ComposedChart
            data={data}
            margin={{ 
              top: 10, 
              right: window.innerWidth < 640 ? 10 : 30, 
              left: window.innerWidth < 640 ? -20 : 0, 
              bottom: window.innerWidth < 640 ? 20 : 0 
            }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false} 
              stroke="#e2e8f0" 
            />
            <XAxis
              dataKey="label"
              tick={{ 
                fontSize: window.innerWidth < 640 ? 10 : 12, 
                fill: '#64748b' 
              }}
              axisLine={false}
              tickLine={false}
              interval={window.innerWidth < 640 ? 1 : 0}
              minTickGap={window.innerWidth < 640 ? 2 : 5}
            />
            <YAxis
              tick={{ 
                fontSize: window.innerWidth < 640 ? 10 : 12, 
                fill: '#64748b' 
              }}
              axisLine={false}
              tickLine={false}
              width={window.innerWidth < 640 ? 30 : 40}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: window.innerWidth < 640 ? '12px' : '14px',
                padding: window.innerWidth < 640 ? '8px 12px' : '10px 16px'
              }}
              itemStyle={{ color: '#fff' }}
            />
            <Legend 
              wrapperStyle={{
                paddingTop: window.innerWidth < 640 ? '10px' : '0',
                fontSize: window.innerWidth < 640 ? '11px' : '12px'
              }}
              verticalAlign={window.innerWidth < 640 ? 'bottom' : 'top'}
              height={window.innerWidth < 640 ? 40 : 36}
            />
            <Bar
              dataKey="production"
              name="Actual Production"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
              barSize={window.innerWidth < 640 ? 12 : 20}
            />
            <Bar
              dataKey="target"
              name="Target"
              fill="#94a3b8"
              radius={[4, 4, 0, 0]}
              barSize={window.innerWidth < 640 ? 12 : 20}
              opacity={0.5}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default HourlyChart;