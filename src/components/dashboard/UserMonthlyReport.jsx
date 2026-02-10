import React, { useState } from 'react';

// Dummy user data
const dummyUsers = [
  { id: 1, userName: 'John Doe' },
  { id: 2, userName: 'Jane Smith' },
  { id: 3, userName: 'Alex Johnson' },
];

// Helper to get current month in format JAN2026
const getCurrentMonthYear = () => {
  const date = new Date();
  const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const year = date.getFullYear();
  return `${month}${year}`;
};

const UserMonthlyReport = () => {
  const [monthYear, setMonthYear] = useState(getCurrentMonthYear());
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState(
    dummyUsers.map(user => ({
      ...user,
      monthYear: getCurrentMonthYear(),
      monthlyTarget: '',
      extraAssignHours: '',
      workingDays: '',
      submitted: false,
    }))
  );

  // Filtered users by search
  const filteredData = formData.filter(row =>
    row.userName.toLowerCase().includes(search.toLowerCase())
  );

  // Handle input change
  const handleInputChange = (id, field, value) => {
    setFormData(prev =>
      prev.map(row =>
        row.id === id ? { ...row, [field]: value } : row
      )
    );
  };



  // Handle common submit for all users (only submit rows with complete data)
  const handleSubmitAll = () => {
    setFormData(prev => prev.map(row => {
      const isComplete = row.monthlyTarget && row.extraAssignHours && row.workingDays;
      return isComplete ? { ...row, submitted: true } : row;
    }));
  };

  // Handle delete for individual user
  const handleDelete = (id) => {
    setFormData(prev =>
      prev.map(row =>
        row.id === id
          ? { ...row, monthlyTarget: '', extraAssignHours: '', workingDays: '', submitted: false, editing: false }
          : row
      )
    );
  };

  // Handle submit for individual user (when editing)
  // Removed unused handler functions per linter warning

  
  // ...existing code...

  // Handle month change
  const handleMonthChange = e => {
    setMonthYear(e.target.value);
    // Reset form for new month
    setFormData(
      dummyUsers.map(user => {
        return {
          ...user,
          monthYear: e.target.value,
          monthlyTarget: '',
          extraAssignHours: '',
          workingDays: '',
          submitted: false,
          editing: false,
        };
      })
    );
  };

  // Determine if form is fresh (no data submitted)
  const isFreshForm = formData.every(row => !row.submitted);

  return (
    <div className="max-w-7xl mx-auto py-8 px-2 sm:px-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="relative flex-1 min-w-[250px]">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            Search User
          </label>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by user name..."
            className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 transition-all hover:border-blue-400"
          />
        </div>
        <div className="relative">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            Month
          </label>
          <input
            type="month"
            className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 transition-all hover:border-blue-400 min-w-[160px] cursor-pointer"
            value={monthYear.length === 7 ? monthYear : new Date().toISOString().slice(0, 7)}
            onChange={e => {
              const [year, month] = e.target.value.split('-');
              const date = new Date(year, month - 1);
              const formatted = date.toLocaleString('en-US', { month: 'short' }).toUpperCase() + year;
              handleMonthChange({ target: { value: formatted } });
            }}
          />
        </div>
      </div>
      <div className="w-full max-w-7xl mx-auto mt-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-fixed rounded-lg overflow-hidden border border-slate-200 shadow-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white">
                <th className="text-left py-4 px-4 text-sm font-bold uppercase tracking-wide">User Name</th>
                <th className="text-left py-4 px-4 text-sm font-bold uppercase tracking-wide">Month Year</th>
                <th className="text-left py-4 px-4 text-sm font-bold uppercase tracking-wide">Monthly Target</th>
                <th className="text-left py-4 px-4 text-sm font-bold uppercase tracking-wide">Extra Assign Hours</th>
                <th className="text-left py-4 px-4 text-sm font-bold uppercase tracking-wide">Working Days</th>
                {!isFreshForm && <th className="text-center py-4 px-4 text-sm font-bold uppercase tracking-wide">Action</th>}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={isFreshForm ? 5 : 6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8 text-slate-400">
                          <circle cx="12" cy="12" r="10" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6M12 9v6" />
                        </svg>
                      </div>
                      <p className="text-slate-600 font-medium mb-1">No users found</p>
                      <p className="text-sm text-slate-400">Add a new user to get started</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map(row => (
                  <tr key={row.id} className="border-t border-slate-100 hover:bg-blue-50/40 transition">
                    <td className="px-6 py-3 font-semibold text-slate-800">{row.userName}</td>
                    <td className="px-6 py-3 text-slate-700">{row.monthYear}</td>
                    <td className="px-6 py-3">
                      {row.submitted && !row.editing ? (
                        <span className="inline-block px-3 py-1 rounded bg-blue-100 text-blue-700 font-medium">{row.monthlyTarget || '-'}</span>
                      ) : (
                        <input
                          type="number"
                          className="border border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded px-3 py-1 w-24 text-center transition"
                          value={row.monthlyTarget}
                          onChange={e => handleInputChange(row.id, 'monthlyTarget', e.target.value)}
                          min={0}
                        />
                      )}
                    </td>
                    <td className="px-6 py-3">
                      {row.submitted && !row.editing ? (
                        <span className="inline-block px-3 py-1 rounded bg-blue-100 text-blue-700 font-medium">{row.extraAssignHours || '-'}</span>
                      ) : (
                        <input
                          type="number"
                          className="border border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded px-3 py-1 w-24 text-center transition"
                          value={row.extraAssignHours}
                          onChange={e => handleInputChange(row.id, 'extraAssignHours', e.target.value)}
                          min={0}
                        />
                      )}
                    </td>
                    <td className="px-6 py-3">
                      {row.submitted && !row.editing ? (
                        <span className="inline-block px-3 py-1 rounded bg-blue-100 text-blue-700 font-medium">{row.workingDays || '-'}</span>
                      ) : (
                        <input
                          type="number"
                          className="border border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded px-3 py-1 w-24 text-center transition"
                          value={row.workingDays}
                          onChange={e => handleInputChange(row.id, 'workingDays', e.target.value)}
                          min={0}
                        />
                      )}
                    </td>
                    {!isFreshForm && (
                      <td className="px-6 py-3">
                        {row.submitted && !row.editing ? (
                          <div className="flex gap-2 justify-center">
                            <button
                              className="bg-yellow-50 text-yellow-700 border border-yellow-200 px-4 py-1 rounded-lg font-medium hover:bg-yellow-100 transition"
                              onClick={() => setFormData(prev => prev.map(r => r.id === row.id ? { ...r, editing: true } : r))}
                            >Edit</button>
                            <button
                              className="bg-red-50 text-red-700 border border-red-200 px-4 py-1 rounded-lg font-medium hover:bg-red-100 transition"
                              onClick={() => handleDelete(row.id)}
                            >Delete</button>
                          </div>
                        ) : row.editing ? (
                          <div className="flex gap-2 justify-center">
                            <button
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-1 rounded-lg shadow transition disabled:opacity-60 disabled:cursor-not-allowed"
                              onClick={() => { setFormData(prev => prev.map(r => r.id === row.id ? { ...r, submitted: true, editing: false } : r)); }}
                              disabled={!row.monthlyTarget || !row.extraAssignHours || !row.workingDays}
                            >Submit</button>
                            <button
                              className="bg-slate-100 text-slate-600 border border-slate-200 px-4 py-1 rounded-lg font-medium hover:bg-slate-200 transition"
                              onClick={() => setFormData(prev => prev.map(r => r.id === row.id ? { ...r, editing: false } : r))}
                            >Cancel</button>
                          </div>
                        ) : null}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Show Submit All button below table only for fresh form */}
        {isFreshForm && (
          <div className="flex justify-end mt-6">
            <button
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-lg px-6 py-2.5 transition-all shadow-sm hover:shadow-md group"
              onClick={handleSubmitAll}
              disabled={!filteredData.some(row => row.monthlyTarget && row.extraAssignHours && row.workingDays)}
              type="button"
            >
              Submit All
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserMonthlyReport;
