
import * as XLSX from 'xlsx';
import { toast } from "react-hot-toast";
import React, { useState, useEffect } from "react";
// import dayjs from "dayjs"; // Not used
import "antd/dist/antd.css";
import { fetchDailyBillableReport } from "../../services/billableReportService";


import { fetchMonthlyBillableReport } from "../../services/billableReportService";

const BillableReport = () => {
          // Export to Excel for a single monthly summary row
          const handleExportMonthlyExcelRow = (row) => {
            try {
              const exportData = [{
                'Year & Month': row.month,
                'Billable Hours Delivered': row.delivered,
                'Monthly Goal': row.goal,
                'Pending Target': row.pending,
                'Avg. QC Score': row.qc,
              }];
              const worksheet = XLSX.utils.json_to_sheet(exportData);
              worksheet['!cols'] = [
                { wch: 16 },
                { wch: 24 },
                { wch: 16 },
                { wch: 16 },
                { wch: 16 },
              ];
              const workbook = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(workbook, worksheet, row.month);
              const filename = `Monthly_Summary_${row.month}.xlsx`;
              XLSX.writeFile(workbook, filename);
              toast.success(`Exported ${row.month} summary!`);
            } catch {
              toast.error('Failed to export monthly summary');
            }
          };

    // State for tab toggle (must be first hook)
    const [activeToggle, setActiveToggle] = useState('daily');
    // State for date range filter
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // State for API data, loading, and error
    const [dailyData, setDailyData] = useState([]);
    const [loadingDaily, setLoadingDaily] = useState(false);
    const [errorDaily, setErrorDaily] = useState(null);



    // Fetch daily report data from API on mount or when date range changes
    useEffect(() => {
      const fetchData = async () => {
        setLoadingDaily(true);
        setErrorDaily(null);
        try {
          // You can add filters like startDate/endDate if API supports
          const payload = {};
          if (startDate) payload.date_from = startDate;
          if (endDate) payload.date_to = endDate;
          const res = await fetchDailyBillableReport(payload);
          // API response: { data: { trackers: [...] } }
          setDailyData(Array.isArray(res.data?.trackers) ? res.data.trackers : []);
        } catch {
          setErrorDaily("Failed to fetch daily report data");
        } finally {
          setLoadingDaily(false);
        }
      };
      fetchData();
    }, [startDate, endDate]);

    // Fetch monthly report data from API when monthly tab is active
    useEffect(() => {
      if (activeToggle !== 'monthly') return;
      const fetchData = async () => {
        setLoadingMonthly(true);
        setErrorMonthly(null);
        try {
          // You can add filters like month/year if needed
          const payload = {};
          const res = await fetchMonthlyBillableReport(payload);
          // API response: { data: [...] } for monthly, but daily is { data: { trackers: [...] } }
          setMonthlySummaryData(Array.isArray(res.data) ? res.data : []);
        } catch {
          setErrorMonthly("Failed to fetch monthly report data");
        } finally {
          setLoadingMonthly(false);
        }
      };
      fetchData();
    }, [activeToggle]);

    // No need to filter here, as API returns filtered data
    const filteredDailyData = dailyData;

        // Export filtered daily data to Excel
        const handleExportDailyExcel = () => {
          try {
            const exportData = filteredDailyData.map(row => ({
              'Date': row.date,
              'Assign Hours': row.assignHours ?? row.assign_hours,
              'Worked Hours': row.workedHours ?? row.worked_hours,
              'QC score': row.qcScore ?? row.qc_score,
              'Daily Required Hours': row.dailyRequiredHours ?? row.daily_required_hours,
            }));
            const worksheet = XLSX.utils.json_to_sheet(exportData);
            worksheet['!cols'] = [
              { wch: 12 },
              { wch: 14 },
              { wch: 14 },
              { wch: 10 },
              { wch: 20 },
            ];
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Daily Report');
            const filename = `Daily_Report_${startDate || 'all'}_${endDate || 'all'}.xlsx`;
            XLSX.writeFile(workbook, filename);
            toast.success('Daily report exported!');
          } catch {
            toast.error('Failed to export daily report');
          }
        };

    // State for monthly report API data, loading, and error
    const [monthlySummaryData, setMonthlySummaryData] = useState([]);
    const [loadingMonthly, setLoadingMonthly] = useState(false);
    const [errorMonthly, setErrorMonthly] = useState(null);

    // Fetch monthly report data from API when monthly tab is active
    useEffect(() => {
      if (activeToggle !== 'monthly') return;
      const fetchData = async () => {
        setLoadingMonthly(true);
        setErrorMonthly(null);
        try {
          // You can add filters like month/year if needed
          const payload = {};
          const res = await fetchMonthlyBillableReport(payload);
          setMonthlySummaryData(Array.isArray(res.data) ? res.data : []);
        } catch {
          setErrorMonthly("Failed to fetch monthly report data");
        } finally {
          setLoadingMonthly(false);
        }
      };
      fetchData();
    }, [activeToggle]);

    // Export to Excel for monthly summary
    // Export all monthly summary data to Excel
    // Removed unused handleExportMonthlyExcel function


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
      {/* Daily Report view (table, filter, export) */}
      {activeToggle === 'daily' && (
        <div className="w-full max-w-5xl mx-auto mt-8">
          {/* Date Range Filter and Export Button */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <label className="font-semibold text-blue-700">Date Range:</label>
              <input type="date" className="border rounded px-2 py-1" value={startDate} onChange={e => setStartDate(e.target.value)} />
              <span className="mx-2">to</span>
              <input type="date" className="border rounded px-2 py-1" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
            <button
              onClick={handleExportDailyExcel}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold text-sm border border-green-700 shadow-sm transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              title="Export filtered data to Excel"
              aria-label="Export to Excel"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M16 16v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><polyline points="8 12 12 16 16 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="8" x2="12" y2="16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span>Export to Excel</span>
            </button>
          </div>
          {/* Daily Report Table */}
          <div className="overflow-x-auto bg-white rounded-2xl">
            {loadingDaily ? (
              <div className="py-8 text-center text-blue-700 font-semibold">Loading daily report...</div>
            ) : errorDaily ? (
              <div className="py-8 text-center text-red-600 font-semibold">{errorDaily}</div>
            ) : (
              <table className="min-w-full divide-y divide-blue-100 text-sm">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="px-6 py-3 text-left font-semibold text-blue-700 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-center font-semibold text-blue-700 uppercase tracking-wider">Assign Hours</th>
                    <th className="px-6 py-3 text-center font-semibold text-blue-700 uppercase tracking-wider">Worked Hours</th>
                    <th className="px-6 py-3 text-center font-semibold text-blue-700 uppercase tracking-wider">QC score</th>
                    <th className="px-6 py-3 text-center font-semibold text-blue-700 uppercase tracking-wider">Daily Required Hours</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-blue-50">
                  {filteredDailyData.length > 0 ? (
                    filteredDailyData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-blue-50 transition group">
                        <td className="px-6 py-3 text-black font-medium whitespace-nowrap">{row.date_time}</td>
                        <td className="px-6 py-3 text-center text-black">{row.actual_target ? Number(row.actual_target).toFixed(2) : '-'}</td>
                        <td className="px-6 py-3 text-center text-black">{row.billable_hours ? Number(row.billable_hours).toFixed(2) : '-'}</td>
                        <td className="px-6 py-3 text-center text-black">{'qc_score' in row ? (row.qc_score !== null ? Number(row.qc_score).toFixed(2) : '-') : '-'}</td>
                        <td className="px-6 py-3 text-center text-black">{row.tenure_target ? Number(row.tenure_target).toFixed(2) : '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-3 text-center text-gray-400">No data available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Monthly Report view (summary table, per-row export) */}
      {activeToggle === 'monthly' && (
        <div className="w-full max-w-7xl mx-auto mt-4">
          <div className="p-6 overflow-x-auto bg-white rounded-2xl shadow-lg w-full">
            {loadingMonthly ? (
              <div className="py-8 text-center text-blue-700 font-semibold">Loading monthly report...</div>
            ) : errorMonthly ? (
              <div className="py-8 text-center text-red-600 font-semibold">{errorMonthly}</div>
            ) : (
              <table className="min-w-full divide-y divide-blue-100 text-sm">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="px-6 py-3 text-left font-semibold text-blue-700 uppercase tracking-wider">Year & Month</th>
                    <th className="px-6 py-3 text-center font-semibold text-blue-700 uppercase tracking-wider">Billable Hours Delivered</th>
                    <th className="px-6 py-3 text-center font-semibold text-blue-700 uppercase tracking-wider">Monthly Goal</th>
                    <th className="px-6 py-3 text-center font-semibold text-blue-700 uppercase tracking-wider">Pending Target</th>
                    <th className="px-6 py-3 text-center font-semibold text-blue-700 uppercase tracking-wider">Avg. QC Score</th>
                    <th className="px-6 py-3 text-center font-semibold text-blue-700 uppercase tracking-wider">Export</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-blue-50">
                  {monthlySummaryData.length > 0 ? (
                    monthlySummaryData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-blue-50 transition group">
                        <td className="px-6 py-3 text-black font-medium whitespace-nowrap">{row.month_year}</td>
                        <td className="px-6 py-3 text-center text-black">{row.total_billable_hours ? Number(row.total_billable_hours).toFixed(2) : (row.total_billable_hours_month ? Number(row.total_billable_hours_month).toFixed(2) : '-')}</td>
                        <td className="px-6 py-3 text-center text-black">{row.monthly_target ?? row.monthly_goal}</td>
                        <td className="px-6 py-3 text-center text-black">{row.pending_target ? Number(row.pending_target).toFixed(2) : '-'}</td>
                        <td className="px-6 py-3 text-center text-black">{row.avg_qc_score ?? '-'}</td>
                        <td className="px-6 py-3 text-center">
                          <button
                            onClick={() => handleExportMonthlyExcelRow(row)}
                            className="flex items-center gap-2 px-3 py-1 rounded bg-green-600 hover:bg-green-700 text-white text-xs font-semibold border border-green-700 shadow-sm transition"
                            title={`Export ${row.month_year} to Excel`}
                            aria-label={`Export ${row.month_year} to Excel`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M16 16v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><polyline points="8 12 12 16 16 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="8" x2="12" y2="16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            <span>Excel</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-3 text-center text-gray-400">No data available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BillableReport;
