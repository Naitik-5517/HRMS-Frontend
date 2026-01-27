import * as XLSX from 'xlsx';
import { toast } from "react-hot-toast";
import React, { useState, useEffect } from "react";
import MonthCard from "./MonthCard";
import UserCard from "./UserCard";
import { fetchDailyBillableReport, fetchMonthlyBillableReport } from "../../services/billableReportService";

const BillableReport = ({ userId }) => {

  // Team filter state (must be before any usage)
  const [teamFilter, setTeamFilter] = useState('');

  // Export all users' daily data (filtered by team if set)
  function handleExportAllUsers() {
    try {
      // Group by user_id, filter by team if set
      const grouped = filteredDailyData.reduce((acc, row) => {
        if (teamFilter && row.team_name !== teamFilter) return acc;
        const key = row.user_id || 'unknown';
        if (!acc[key]) acc[key] = { user: row, rows: [] };
        acc[key].rows.push(row);
        return acc;
      }, {});
      // Combine all users' data into a single array for one worksheet
      let allExportData = [];
      Object.entries(grouped).forEach(([userId, { user, rows }]) => {
        let userExportData = rows.map(row => ({
          'User Name': row.user_name || user.user_name || '-',
          'Team': row.team_name || user.team_name || '-',
          'Date-Time': formatDateTime(row.date_time ?? row.date),
          'Assign Hours': '-',
          'Worked Hours': row.billable_hours !== undefined ? Number(row.billable_hours).toFixed(2) : (row.workedHours ?? row.worked_hours ?? '-'),
          'QC Score': 'qc_score' in row ? (row.qc_score !== null && row.qc_score !== undefined ? Number(row.qc_score).toFixed(2) : '-') : (row.qcScore ?? row.qc_score ?? '-'),
          'Daily Required Hours': row.tenure_target !== undefined ? Number(row.tenure_target).toFixed(2) : (row.dailyRequiredHours ?? row.daily_required_hours ?? '-')
        }));
        // Add total row for countable columns
        if (userExportData.length > 0) {
          const totalWorked = userExportData.reduce((sum, r) => sum + (parseFloat(r['Worked Hours']) || 0), 0);
          const totalQC = userExportData.reduce((sum, r) => sum + (parseFloat(r['QC Score']) || 0), 0);
          const totalRequired = userExportData.reduce((sum, r) => sum + (parseFloat(r['Daily Required Hours']) || 0), 0);
          userExportData.push({
            'User Name': 'Total',
            'Team': '',
            'Date-Time': '',
            'Assign Hours': '',
            'Worked Hours': totalWorked.toFixed(2),
            'QC Score': totalQC.toFixed(2),
            'Daily Required Hours': totalRequired.toFixed(2)
          });
        }
        allExportData = allExportData.concat(userExportData);
      });
      const worksheet = XLSX.utils.json_to_sheet(allExportData);
      worksheet['!cols'] = [
        { wch: 18 }, // User Name
        { wch: 16 }, // Team
        { wch: 24 }, // Date-Time
        { wch: 16 }, // Assign Hours
        { wch: 16 }, // Worked Hours
        { wch: 12 }, // QC Score
        { wch: 20 }, // Daily Required Hours
      ];
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'All Users');
      XLSX.writeFile(workbook, 'All_Users_Daily_Report.xlsx');
      toast.success('All users daily report exported!');
    } catch {
      toast.error('Failed to export all users daily data');
    }
  }

  // Helper to format date-time as 'dd/mm/yyyy hh:mm AM/PM'
  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const dateObj = new Date(dateString);
    if (isNaN(dateObj)) return '-';
    const pad = (n) => n < 10 ? '0' + n : n;
    const day = pad(dateObj.getDate());
    const month = pad(dateObj.getMonth() + 1);
    const year = dateObj.getFullYear();
    let hours = dateObj.getHours();
    const minutes = pad(dateObj.getMinutes());
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    return `${day}/${month}/${year} ${pad(hours)}:${minutes} ${ampm}`;
  };


  // State for tab toggle (must be first hook)
  const [activeToggle, setActiveToggle] = useState('daily');
  // (Date range filter removed)
  // State for month filter (monthly)
  const [monthlyMonth, setMonthlyMonth] = useState('');
  // State for month filter (daily report)
  const [dailyMonth, setDailyMonth] = useState('');

  // State for API data, loading, and error
  const [dailyData, setDailyData] = useState([]);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const [errorDaily, setErrorDaily] = useState(null);

  // Helper to get YYYY-MM-DD string
  const getDateString = (date) => date.toISOString().slice(0, 10);

  // Default daily: current month only, unless filter set
  useEffect(() => {
    const fetchData = async () => {
      setLoadingDaily(true);
      setErrorDaily(null);
      try {
        const payload = {};
        // If a month is selected, use that month for filtering
        if (dailyMonth) {
          const [year, month] = dailyMonth.split('-');
          const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
          const monthLabel = monthNames[Number(month) - 1];
          payload.month_year = `${monthLabel}${year}`;
        } else {
          // Default: current month using date_from/date_to
          const now = new Date();
          const firstDay = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
          const lastDay = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999));
          payload.date_from = firstDay.toISOString().slice(0, 10);
          payload.date_to = lastDay.toISOString().slice(0, 10);
        }
        if (userId) payload.user_id = userId;
        const res = await fetchDailyBillableReport(payload);
        setDailyData(Array.isArray(res.data?.trackers) ? res.data.trackers : []);
      } catch {
        setErrorDaily("Failed to fetch daily report data");
      } finally {
        setLoadingDaily(false);
      }
    };
    fetchData();
  }, [userId, dailyMonth]);

  // Fetch monthly report data from API when monthly tab is active
  const [monthlySummaryData, setMonthlySummaryData] = useState([]);
  const [loadingMonthly, setLoadingMonthly] = useState(false);
  const [errorMonthly, setErrorMonthly] = useState(null);
  useEffect(() => {
    if (activeToggle !== 'monthly') return;
    const fetchData = async () => {
      setLoadingMonthly(true);
      setErrorMonthly(null);
      try {
        let payload = {};
        if (monthlyMonth) {
          // monthlyMonth is in format YYYY-MM
          const [year, month] = monthlyMonth.split('-');
          const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
          const monthLabel = monthNames[Number(month) - 1];
          payload = { month_year: `${monthLabel}${year}` };
        } else {
          // Default: last 3 months (fallback, not using month_year)
          const now = new Date();
          const firstMonth = new Date(now.getFullYear(), now.getMonth() - 2, 1);
          const lastMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          payload = {
            date_from: getDateString(firstMonth),
            date_to: getDateString(lastMonth)
          };
        }
        const res = await fetchMonthlyBillableReport(payload);
        setMonthlySummaryData(Array.isArray(res.data) ? res.data : []);
      } catch {
        setErrorMonthly("Failed to fetch monthly report data");
      } finally {
        setLoadingMonthly(false);
      }
    };
    fetchData();
  }, [activeToggle, userId, monthlyMonth]);

  // Filter daily data by selected month if set
  const filteredDailyData = dailyData.filter(row => {
    if (!dailyMonth) return true;
    // dailyMonth is in 'YYYY-MM' format
    const rowDate = row.date_time || row.date;
    if (!rowDate) return false;
    const d = new Date(rowDate);
    if (isNaN(d)) return false;
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return monthStr === dailyMonth;
  });

  // Export all daily data for a given user and month (from monthly report)
  const handleExportMonthDailyData = async (user, monthObj) => {
    try {
      const month_year = user.month_year || monthObj?.label + monthObj?.year;
      let payload = { month_year };
      if (user.user_id) {
        payload.user_id = user.user_id;
      }
      const res = await fetchDailyBillableReport(payload);
      const dailyRows = Array.isArray(res.data?.trackers) ? res.data.trackers : [];
      if (!dailyRows.length) {
        toast.error('No daily data found for this user/month');
        return;
      }
      let exportData = dailyRows.map(row => ({
        'Date-Time': formatDateTime(row.date_time ?? row.date),
        'Assign Hours': '-',
        'Worked Hours': row.billable_hours !== undefined ? Number(row.billable_hours).toFixed(2) : (row.workedHours ?? row.worked_hours ?? '-'),
        'QC Score': 'qc_score' in row ? (row.qc_score !== null && row.qc_score !== undefined ? Number(row.qc_score).toFixed(2) : '-') : (row.qcScore ?? row.qc_score ?? '-'),
        'Daily Required Hours': row.tenure_target !== undefined ? Number(row.tenure_target).toFixed(2) : (row.dailyRequiredHours ?? row.daily_required_hours ?? '-')
      }));
      // Add total row for countable columns
      if (exportData.length > 0) {
        const totalWorked = exportData.reduce((sum, r) => sum + (parseFloat(r['Worked Hours']) || 0), 0);
        const totalQC = exportData.reduce((sum, r) => sum + (parseFloat(r['QC Score']) || 0), 0);
        const totalRequired = exportData.reduce((sum, r) => sum + (parseFloat(r['Daily Required Hours']) || 0), 0);
        exportData.push({
          'Date-Time': 'Total',
          'Assign Hours': '',
          'Worked Hours': totalWorked.toFixed(2),
          'QC Score': totalQC.toFixed(2),
          'Daily Required Hours': totalRequired.toFixed(2)
        });
      }
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      worksheet['!cols'] = [
        { wch: 24 }, // Date-Time
        { wch: 16 }, // Assign Hours
        { wch: 16 }, // Worked Hours
        { wch: 12 }, // QC Score
        { wch: 20 }, // Daily Required Hours
      ];
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, `${user.user_name || month_year}`);
      const filename = `Daily_Report_${user.user_name || 'User'}_${month_year}.xlsx`;
      XLSX.writeFile(workbook, filename);
      toast.success(`Exported daily data for ${user.user_name || 'User'} (${month_year})!`);
    } catch {
      toast.error('Failed to export daily data for this user/month');
    }
  };

  // Removed unused handleExportDailyExcel and related code

  return (
    <div className="max-w-7xl mx-auto py-8 px-2 sm:px-4">
      <div className="w-full flex flex-col items-center">
        <div className="w-full max-w-7xl flex items-center gap-4 mb-8">
          <button
            className={`px-6 py-2 rounded-lg font-semibold text-blue-700 border-2 border-blue-700 transition-all duration-150 focus:outline-none ${activeToggle === 'daily' ? 'bg-blue-700 text-white' : 'bg-white'}`}
            onClick={() => setActiveToggle('daily')}
          >
            Daily Report
          </button>
          <button
            className={`px-6 py-2 rounded-lg font-semibold text-blue-700 border-2 border-blue-700 transition-all duration-150 focus:outline-none ${activeToggle === 'monthly' ? 'bg-blue-700 text-white' : 'bg-white'}`}
            onClick={() => setActiveToggle('monthly')}
          >
            Monthly Report
          </button>
        </div>
      </div>
      {/* Daily Report view (user cards, QA agent side only) */}
      {activeToggle === 'daily' && (
        <div className="w-full max-w-7xl mx-auto mt-4 px-6">
          {/* Team-wise filter, Month filter, and Export All button */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            {/* Team Filter Dropdown */}
            <label className="font-semibold text-blue-700 mr-2">Team:</label>
            <select
              className="border border-blue-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-500 bg-white shadow-sm transition min-w-[120px]"
              value={teamFilter || ''}
              onChange={e => setTeamFilter(e.target.value)}
              style={{ minWidth: 120 }}
            >
              <option value="">All</option>
              {Array.from(new Set(dailyData.map(row => row.team_name).filter(Boolean))).map(team => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
            {/* Date Range Filter removed */}
            {/* Month Filter Dropdown */}
            <label className="font-semibold text-blue-700 mr-2">Month:</label>
            <input
              type="month"
              className="border border-blue-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-500 bg-white shadow-sm transition min-w-[120px]"
              value={dailyMonth}
              onChange={e => setDailyMonth(e.target.value)}
              style={{ minWidth: 120 }}
            />
            {/* Export All Button */}
            <button
              className="px-3 py-1 rounded bg-linear-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white text-xs font-semibold border border-green-700 shadow-sm transition"
              onClick={handleExportAllUsers}
            >
              Export All
            </button>
          </div>
          {/* User Cards for QA agent daily data, each with its own date range and export */}
          <div className="space-y-6">
            {loadingDaily ? (
              <div className="py-8 text-center text-blue-700 font-semibold">Loading daily report...</div>
            ) : errorDaily ? (
              <div className="py-8 text-center text-red-600 font-semibold">{errorDaily}</div>
            ) : filteredDailyData.length > 0 ? (
              // Group daily data by user_id, filter by team if set
              Object.entries(filteredDailyData.reduce((acc, row) => {
                if (teamFilter && row.team_name !== teamFilter) return acc;
                const key = row.user_id || 'unknown';
                if (!acc[key]) acc[key] = { user: row, rows: [] };
                acc[key].rows.push(row);
                return acc;
              }, {})).map(([userId, { user, rows }]) => (
                <UserCard
                  key={userId}
                  user={user}
                  dailyData={rows}
                  defaultCollapsed={true}
                  formatDateTime={formatDateTime}
                />
              ))
            ) : (
              <div className="py-8 text-center text-gray-400">No data available</div>
            )}
          </div>
        </div>
      )}




      {/* Monthly Report view (month cards with user-wise table) */}
      {activeToggle === 'monthly' && (
        <div className="w-full max-w-7xl mx-auto mt-4">
          {/* Month/Year Filter and Export All */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <label className="font-semibold text-blue-700">Month:</label>
            <input
              type="month"
              className="border border-blue-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-500 bg-white shadow-sm transition"
              value={monthlyMonth}
              onChange={e => setMonthlyMonth(e.target.value)}
              style={{ minWidth: 120 }}
            />
          </div>
          {loadingMonthly ? (
            <div className="py-8 text-center text-blue-700 font-semibold">Loading monthly report...</div>
          ) : errorMonthly ? (
            <div className="py-8 text-center text-red-600 font-semibold">{errorMonthly}</div>
          ) : monthlySummaryData.length > 0 ? (
            <div className="space-y-6">
              {Object.entries(groupByMonthYear(monthlySummaryData)).map(([month, users]) => (
                <MonthCard
                  key={month}
                  month={parseMonthYear(month)}
                  users={users}
                  onExport={(user) => handleExportMonthDailyData(user, parseMonthYear(month))}
                  onExportMonth={async (monthObj, usersArr) => {
                    try {
                      // Only export the visible (filtered) table data, not all users for the month
                      if (!usersArr || usersArr.length === 0) {
                        toast.error('No data to export for this table.');
                        return;
                      }
                      let exportData = usersArr.map(user => ({
                        'User Name': user.user_name || '-',
                        'Team': user.team_name || '-',
                        'Billable Hour Delivered': user.total_billable_hours ? Number(user.total_billable_hours).toFixed(2) : '-',
                        'Monthly Goal': user.monthly_target ?? '-',
                        'Pending Target': user.pending_target ? Number(user.pending_target).toFixed(2) : '-',
                        'Avg. QC Score': user.avg_qc_score ? Number(user.avg_qc_score).toFixed(2) : '-',
                      }));
                      // Add totals row for numeric columns
                      if (exportData.length > 0) {
                        const totalBillable = exportData.reduce((sum, r) => sum + (parseFloat(r['Billable Hour Delivered']) || 0), 0);
                        const totalGoal = exportData.reduce((sum, r) => sum + (parseFloat(r['Monthly Goal']) || 0), 0);
                        const totalPending = exportData.reduce((sum, r) => sum + (parseFloat(r['Pending Target']) || 0), 0);
                        // For Avg. QC Score, show average if all are numbers
                        const qcScores = exportData.map(r => Number(r['Avg. QC Score'])).filter(v => !isNaN(v));
                        const avgQC = qcScores.length > 0 ? (qcScores.reduce((a, b) => a + b, 0) / qcScores.length).toFixed(2) : '-';
                        exportData.push({
                          'User Name': 'Total',
                          'Team': '',
                          'Billable Hour Delivered': totalBillable.toFixed(2),
                          'Monthly Goal': totalGoal.toFixed(2),
                          'Pending Target': totalPending.toFixed(2),
                          'Avg. QC Score': avgQC,
                        });
                      }
                      const worksheet = XLSX.utils.json_to_sheet(exportData);
                      worksheet['!cols'] = [
                        { wch: 18 }, // User Name
                        { wch: 16 }, // Team
                        { wch: 24 }, // Billable Hour Delivered
                        { wch: 16 }, // Monthly Goal
                        { wch: 16 }, // Pending Target
                        { wch: 16 }, // Avg. QC Score
                      ];
                      const workbook = XLSX.utils.book_new();
                      XLSX.utils.book_append_sheet(workbook, worksheet, `${monthObj.label}_${monthObj.year}`);
                      XLSX.writeFile(workbook, `Monthly_Table_${monthObj.label}_${monthObj.year}.xlsx`);
                      toast.success('Table exported!');
                    } catch {
                      toast.error('Failed to export table');
                    }
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-400">No monthly data available</div>
          )}
        </div>
      )}
    </div>
  );
};

// Helper to group data by month_year (robust, with fallback)
function groupByMonthYear(data) {
  return data.reduce((acc, item) => {
    let key = item.month_year;
    if (!key || typeof key !== 'string' || !/^[A-Z]+\d{4}$/.test(key)) {
      // fallback: try to build from item.month and item.year, or use 'Unknown'
      key = (item.month && item.year) ? `${item.month.toUpperCase()}${item.year}` : 'Unknown';
    }
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
}

// Helper to parse month label and year from month_year string (e.g., JAN2026)
function parseMonthYear(monthYear) {
  if (!monthYear) return { label: '-', year: '-' };
  const match = monthYear.match(/^([A-Z]+)(\d{4})$/);
  if (match) {
    return { label: match[1], year: match[2] };
  }
  return { label: monthYear, year: '' };
}

export default BillableReport;
