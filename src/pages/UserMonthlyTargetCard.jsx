import React, { useState } from "react";
import dayjs from "dayjs";
// import { DatePicker } from "antd";
// import "antd/dist/antd.css";

// Dummy data for multiple months
const monthsData = [
  {
    key: '2025-12',
    label: 'DEC2025',
    range: [dayjs('2025-12-01'), dayjs('2025-12-31')],
    agents: [
      { id: 1, userName: 'John Doe', workingDays: 22, dailyRequiredHours: 8, monthlyTotalTarget: 176, monthlyAchievedTarget: 150 },
      { id: 2, userName: 'Jane Smith', workingDays: 20, dailyRequiredHours: 7, monthlyTotalTarget: 140, monthlyAchievedTarget: 120 },
      { id: 3, userName: 'Alex Johnson', workingDays: 21, dailyRequiredHours: 8, monthlyTotalTarget: 168, monthlyAchievedTarget: 160 },
    ],
  },
  {
    key: '2026-01',
    label: 'JAN2026',
    range: [dayjs('2026-01-01'), dayjs('2026-01-31')],
    agents: [
      { id: 4, userName: 'Emily Clark', workingDays: 21, dailyRequiredHours: 8, monthlyTotalTarget: 168, monthlyAchievedTarget: 140 },
      { id: 5, userName: 'Michael Brown', workingDays: 22, dailyRequiredHours: 7, monthlyTotalTarget: 154, monthlyAchievedTarget: 130 },
    ],
  },
  {
    key: '2026-02',
    label: 'FEB2026',
    range: [dayjs('2026-02-01'), dayjs('2026-02-28')],
    agents: [
      { id: 6, userName: 'Sophia Lee', workingDays: 20, dailyRequiredHours: 8, monthlyTotalTarget: 160, monthlyAchievedTarget: 120 },
      { id: 7, userName: 'David Kim', workingDays: 19, dailyRequiredHours: 7, monthlyTotalTarget: 133, monthlyAchievedTarget: 110 },
    ],
  },
];

const UserMonthlyTargetCard = () => {

  // Expanded state for each month
  const [expanded, setExpanded] = useState(() => {
    const state = {};
    monthsData.forEach(m => { state[m.key] = true; });
    return state;
  });

  // Date range for each month
  const [dateRanges, setDateRanges] = useState(() => {
    const obj = {};
    monthsData.forEach(m => { obj[m.key] = m.range; });
    return obj;
  });

  // Editable state for each agent cell: { [monthKey]: { [agentId]: { field: value } } }
  const [editState, setEditState] = useState({});
  const [editingCell, setEditingCell] = useState({ monthKey: null, agentId: null, field: null });

  // Handle double click to edit
  const handleCellDoubleClick = (monthKey, agentId, field, value) => {
    setEditingCell({ monthKey, agentId, field });
    setEditState(prev => ({
      ...prev,
      [monthKey]: {
        ...(prev[monthKey] || {}),
        [agentId]: {
          ...(prev[monthKey]?.[agentId] || {}),
          [field]: value,
        },
      },
    }));
  };

  // Handle input change
  const handleEditChange = (e, monthKey, agentId, field) => {
    const value = e.target.value;
    setEditState(prev => ({
      ...prev,
      [monthKey]: {
        ...(prev[monthKey] || {}),
        [agentId]: {
          ...(prev[monthKey]?.[agentId] || {}),
          [field]: value,
        },
      },
    }));
  };

  // Save edit on blur or Enter
  const handleEditSave = (monthKey, agentId, field) => {
    // Here you would update your data source or make an API call
    setEditingCell({ monthKey: null, agentId: null, field: null });
  };

  // Handle delete row
  const handleDeleteAgent = (monthKey, agentId) => {
    // Here you would update your data source or make an API call
    // For demo, just alert
    alert(`Delete agent with id ${agentId} from ${monthKey}`);
  };

  const handleToggle = (key) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleRangeChange = (key, range) => {
    setDateRanges(prev => ({ ...prev, [key]: range }));
  };

  return (
    <div className="w-full mt-10 space-y-10">
      {monthsData.map(month => (
        <div key={month.key} className="border border-blue-100 rounded-2xl bg-gradient-to-br from-white via-blue-50 to-blue-100 shadow-lg w-full transition-all duration-300">
          <div className="flex items-center justify-between px-10 py-6 border-b border-blue-100">
            <span className="font-bold text-xl text-blue-700 tracking-wide">{month.label}</span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {/* Date Range Filter - Tailwind styled */}
                <div className="flex gap-2 items-center bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <label className="text-xs text-slate-500 uppercase font-bold">FROM</label>
                  <input
                    className="flex-1 bg-white border border-slate-300 text-slate-700 text-sm rounded px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    type="date"
                    value={dateRanges[month.key][0].format('YYYY-MM-DD')}
                    min={month.range[0].format('YYYY-MM-DD')}
                    max={month.range[1].format('YYYY-MM-DD')}
                    onChange={e => handleRangeChange(month.key, [dayjs(e.target.value), dateRanges[month.key][1]])}
                  />
                </div>
                <div className="flex gap-2 items-center bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <label className="text-xs text-slate-500 uppercase font-bold">TO</label>
                  <input
                    className="flex-1 bg-white border border-slate-300 text-slate-700 text-sm rounded px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    type="date"
                    value={dateRanges[month.key][1].format('YYYY-MM-DD')}
                    min={month.range[0].format('YYYY-MM-DD')}
                    max={month.range[1].format('YYYY-MM-DD')}
                    onChange={e => handleRangeChange(month.key, [dateRanges[month.key][0], dayjs(e.target.value)])}
                  />
                </div>
                {/* Export to Excel Button - TrackerTable style */}
                <button
                  className="ml-2 flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold text-sm border border-green-700 shadow-sm transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                  title="Export filtered data to Excel"
                  aria-label="Export to Excel"
                  // onClick={handleExportExcel} // Add export logic here
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M16 16v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><polyline points="8 12 12 16 16 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="8" x2="12" y2="16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span>Export to Excel</span>
                </button>
              </div>
              <button
                onClick={() => handleToggle(month.key)}
                className="ml-2 p-2 rounded-full bg-blue-50 hover:bg-blue-200 transition flex items-center justify-center shadow-sm border border-blue-200"
                title={expanded[month.key] ? 'Collapse' : 'Expand'}
                aria-label={expanded[month.key] ? 'Collapse' : 'Expand'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`lucide lucide-chevron-down w-5 h-5 transition-transform ${expanded[month.key] ? '' : 'rotate-180'}`}> <path d="m6 9 6 6 6-6"></path></svg>
              </button>
            </div>
          </div>
          {expanded[month.key] && (
            <div className="p-8 overflow-x-auto bg-white rounded-b-2xl">
              <table className="min-w-full divide-y divide-blue-100 text-sm">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="px-6 py-3 text-left font-semibold text-blue-700 uppercase tracking-wider">User Name</th>
                    <th className="px-6 py-3 text-center font-semibold text-blue-700 uppercase tracking-wider">Working Days</th>
                    <th className="px-6 py-3 text-center font-semibold text-blue-700 uppercase tracking-wider">Daily Required Hours</th>
                      <th className="px-6 py-3 text-center font-semibold text-blue-700 uppercase tracking-wider">
                        <div className="flex flex-col items-center">
                          <span>Achieved Target</span>
                          <span className="flex items-center gap-1 text-blue-700 font-normal text-xs mt-0.5">
                            <span className="text-xs text-blue-700">/</span>
                            <span>Total Target</span>
                          </span>
                        </div>
                      </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-blue-50">
                  {month.agents.map((agent) => (
                    <tr key={agent.id} className="hover:bg-blue-50 transition group">
                      {/* User Name (read-only) */}
                      <td
                        className="px-6 py-3 text-black font-medium whitespace-nowrap"
                      >
                        {agent.userName}
                      </td>
                      {/* Working Days (editable) */}
                      <td
                        className="px-6 py-3 text-center text-black cursor-pointer"
                        onDoubleClick={() => handleCellDoubleClick(month.key, agent.id, 'workingDays', agent.workingDays)}
                      >
                        {editingCell.monthKey === month.key && editingCell.agentId === agent.id && editingCell.field === 'workingDays' ? (
                          <input
                            type="number"
                            className="border border-blue-300 rounded px-2 py-1 w-16 text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 text-center"
                            value={editState[month.key]?.[agent.id]?.workingDays ?? agent.workingDays}
                            autoFocus
                            onChange={e => handleEditChange(e, month.key, agent.id, 'workingDays')}
                            onBlur={() => handleEditSave(month.key, agent.id, 'workingDays')}
                            onKeyDown={e => { if (e.key === 'Enter') handleEditSave(month.key, agent.id, 'workingDays'); }}
                          />
                        ) : (
                          agent.workingDays
                        )}
                      </td>
                      {/* Daily Required Hours (read-only) */}
                      <td
                        className="px-6 py-3 text-center text-black"
                      >
                        {agent.dailyRequiredHours}
                      </td>
                      {/* Achieved / Total Target (read-only) */}
                      <td className="px-6 py-3 text-center">
                        <span>
                          <span className="font-semibold text-black">{agent.monthlyAchievedTarget}</span>
                          <span className="mx-1 text-black">/</span>
                          <span className="font-semibold text-black">{agent.monthlyTotalTarget}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default UserMonthlyTargetCard;