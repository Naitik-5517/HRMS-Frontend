/**
 * File: QCFormReportView.jsx
 * Author: Naitik Maisuriya
 * Description: QC Form Report View - Displays QC evaluation records with detailed metrics
 */
import React, { useState, useMemo } from "react";
import { FileCheck, Calendar, Users, Award, AlertCircle, CheckCircle2, Download, Search, X, Filter, RotateCcw } from "lucide-react";
import { DateRangePicker } from "../common/CustomCalendar";
import SearchableSelect from "../common/SearchableSelect";

// Dummy data for demonstration
const dummyQCReports = [
  {
    id: 1,
    evaluation_datetime: "2026-02-27T10:30:00",
    work_date: "2026-02-26",
    assistant_manager: "Sarah Johnson",
    qa_agent: "Michael Chen",
    agent: "John Doe",
    project_name: "Customer Support Portal",
    task_name: "Data Entry",
    total_record: 150,
    qc_record: 145,
    error_count: 5,
    error_list: ["Missing Field", "Incorrect Format", "Duplicate Entry"],
    status: "Regular",
    qc_score: 96.67
  },
  {
    id: 2,
    evaluation_datetime: "2026-02-27T09:15:00",
    work_date: "2026-02-26",
    assistant_manager: "David Wilson",
    qa_agent: "Emily Rodriguez",
    agent: "Jane Smith",
    project_name: "Invoice Processing",
    task_name: "Invoice Verification",
    total_record: 200,
    qc_record: 180,
    error_count: 20,
    error_list: ["Calculation Error", "Missing Signature", "Wrong Date", "Invalid Amount"],
    status: "Rework",
    qc_score: 90.00
  },
  {
    id: 3,
    evaluation_datetime: "2026-02-27T11:45:00",
    work_date: "2026-02-27",
    assistant_manager: "Sarah Johnson",
    qa_agent: "Michael Chen",
    agent: "Robert Brown",
    project_name: "Customer Support Portal",
    task_name: "Ticket Resolution",
    total_record: 100,
    qc_record: 98,
    error_count: 2,
    error_list: ["Incomplete Response"],
    status: "Regular",
    qc_score: 98.00
  },
  {
    id: 4,
    evaluation_datetime: "2026-02-27T08:20:00",
    work_date: "2026-02-26",
    assistant_manager: "David Wilson",
    qa_agent: "Emily Rodriguez",
    agent: "Alice Johnson",
    project_name: "Medical Records",
    task_name: "Data Validation",
    total_record: 180,
    qc_record: 165,
    error_count: 15,
    error_list: ["Missing Information", "Incorrect Code", "Data Mismatch", "Format Error"],
    status: "Rework",
    qc_score: 91.67
  },
  {
    id: 5,
    evaluation_datetime: "2026-02-26T16:30:00",
    work_date: "2026-02-25",
    assistant_manager: "Sarah Johnson",
    qa_agent: "Michael Chen",
    agent: "Tom Wilson",
    project_name: "E-commerce Platform",
    task_name: "Product Cataloging",
    total_record: 220,
    qc_record: 218,
    error_count: 2,
    error_list: ["Missing Image", "Incorrect Price"],
    status: "Regular",
    qc_score: 99.09
  },
  {
    id: 6,
    evaluation_datetime: "2026-02-26T14:15:00",
    work_date: "2026-02-25",
    assistant_manager: "David Wilson",
    qa_agent: "Emily Rodriguez",
    agent: "Lisa Anderson",
    project_name: "Legal Documents",
    task_name: "Document Review",
    total_record: 80,
    qc_record: 70,
    error_count: 10,
    error_list: ["Missing Clause", "Incorrect Date", "Wrong Template", "Signature Issue"],
    status: "Rework",
    qc_score: 87.50
  },
];

const QCFormReportView = () => {
  // Helper to get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all, Regular, Rework
  const [selectedErrors, setSelectedErrors] = useState(null);
  const [startDate, setStartDate] = useState(getTodayDate());
  const [endDate, setEndDate] = useState(getTodayDate());

  // Filter and search logic
  const filteredReports = useMemo(() => {
    let filtered = dummyQCReports;

    // Filter by date range (evaluation_datetime)
    if (startDate && endDate) {
      filtered = filtered.filter(report => {
        const evalDate = new Date(report.evaluation_datetime).toISOString().split('T')[0];
        return evalDate >= startDate && evalDate <= endDate;
      });
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(report => report.status === statusFilter);
    }

    // Search across multiple fields
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(report =>
        report.agent.toLowerCase().includes(query) ||
        report.qa_agent.toLowerCase().includes(query) ||
        report.assistant_manager.toLowerCase().includes(query) ||
        report.project_name.toLowerCase().includes(query) ||
        report.task_name.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [searchQuery, statusFilter, startDate, endDate]);

  // Calculate summary stats
  const stats = useMemo(() => {
    return {
      total: filteredReports.length,
      regular: filteredReports.filter(r => r.status === "Regular").length,
      rework: filteredReports.filter(r => r.status === "Rework").length,
      avgScore: filteredReports.length > 0 
        ? (filteredReports.reduce((sum, r) => sum + r.qc_score, 0) / filteredReports.length).toFixed(2)
        : 0
    };
  }, [filteredReports]);

  // Format date for display
  const formatDateTime = (dateTimeStr) => {
    const dt = new Date(dateTimeStr);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = dt.getDate();
    const month = monthNames[dt.getMonth()];
    const year = dt.getFullYear();
    let hours = dt.getHours();
    const minutes = String(dt.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return {
      date: `${day}/${month}/${year}`,
      time: `${hours}:${minutes} ${ampm}`
    };
  };

  const formatDate = (dateStr) => {
    const dt = new Date(dateStr);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = dt.getDate();
    const month = monthNames[dt.getMonth()];
    const year = dt.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setStartDate(getTodayDate());
    setEndDate(getTodayDate());
  };

  const getScoreColor = (score) => {
    if (score > 98) return "text-green-700 bg-green-50 border-green-200";
    if (score >= 95) return "text-yellow-700 bg-yellow-50 border-yellow-200";
    return "text-red-700 bg-red-50 border-red-200";
  };

  const renderErrorListModal = () => {
    if (!selectedErrors) return null;
    
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-bold text-slate-800 text-lg">Error List</h3>
            </div>
            <button
              onClick={() => setSelectedErrors(null)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="px-6 py-4 max-h-[calc(80vh-80px)] overflow-y-auto">
            <ul className="space-y-3">
              {dummyQCReports.find(r => r.id === selectedErrors)?.error_list.map((error, idx) => (
                <li key={idx} className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                  <span className="text-sm text-slate-700 font-medium">{error}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
            <button
              onClick={() => setSelectedErrors(null)}
              className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* All Filters Section */}
      <div className="bg-white rounded-2xl shadow-lg p-5 border-2 border-slate-200">
        <div className="space-y-4">
          {/* Date Range Filter */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
            <div className="flex-1 w-full">
              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                label="Evaluation Date Range"
                description="Filter QC reports by evaluation date"
                showClearButton={false}
              />
            </div>
          </div>

          {/* Search and Status Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-600 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by agent, QA, manager, project..."
                className="w-full pl-12 pr-12 py-3 text-sm font-medium border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 hover:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-200 hover:bg-red-100 text-slate-600 hover:text-red-600 rounded-lg transition-all flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div className="w-full md:w-64">
              <SearchableSelect
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: "all", label: "All Status" },
                  { value: "Regular", label: "Regular" },
                  { value: "Rework", label: "Rework" }
                ]}
                icon={Filter}
                placeholder="Select Status"
                isClearable={false}
              />
            </div>

            {/* Export Button */}
            <button 
              className="inline-flex items-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200" 
              title="Export filtered data to Excel"
            >
              <Download className="w-4 h-4" />
              Export
            </button>

            {/* Clear Filters */}
            {(searchQuery || statusFilter !== "all" || startDate !== getTodayDate() || endDate !== getTodayDate()) && (
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                Clear All
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-blue-600 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-4 font-bold text-white text-xs uppercase tracking-wider text-left">
                  Evaluation Date & Time
                </th>
                <th className="px-4 py-4 font-bold text-white text-xs uppercase tracking-wider text-left">
                  Work Date
                </th>
                <th className="px-4 py-4 font-bold text-white text-xs uppercase tracking-wider text-left">
                  Assistant Manager
                </th>
                <th className="px-4 py-4 font-bold text-white text-xs uppercase tracking-wider text-left">
                  QA Agent
                </th>
                <th className="px-4 py-4 font-bold text-white text-xs uppercase tracking-wider text-left">
                  Agent
                </th>
                <th className="px-4 py-4 font-bold text-white text-xs uppercase tracking-wider text-left">
                  Project / Task
                </th>
                <th className="px-4 py-4 font-bold text-white text-xs uppercase tracking-wider text-center">
                  Total Record
                </th>
                <th className="px-4 py-4 font-bold text-white text-xs uppercase tracking-wider text-center">
                  QC Record
                </th>
                <th className="px-4 py-4 font-bold text-white text-xs uppercase tracking-wider text-center">
                  Errors
                </th>
                <th className="px-4 py-4 font-bold text-white text-xs uppercase tracking-wider text-left">
                  Error List
                </th>
                <th className="px-4 py-4 font-bold text-white text-xs uppercase tracking-wider text-center">
                  Status
                </th>
                <th className="px-4 py-4 font-bold text-white text-xs uppercase tracking-wider text-center">
                  QC Score
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan="12" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                        <FileCheck className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-slate-600 font-bold text-lg">No reports found</p>
                      <p className="text-slate-500 text-sm">Try adjusting your filters or search query</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredReports.map((report, index) => {
                  const evalDateTime = formatDateTime(report.evaluation_datetime);
                  const workDate = formatDate(report.work_date);
                  
                  return (
                    <tr
                      key={report.id}
                      className={`transition-all duration-200 group ${
                        index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                      } hover:bg-slate-50`}
                    >
                      {/* Evaluation Date & Time */}
                      <td className="px-4 py-4 align-middle whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{evalDateTime.date}</div>
                            <div className="text-xs text-slate-500 font-medium mt-0.5">
                              <span className="bg-slate-100 px-2 py-0.5 rounded">{evalDateTime.time}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Work Date */}
                      <td className="px-4 py-4 align-middle whitespace-nowrap">
                        <div className="font-semibold text-slate-700 text-sm">{workDate}</div>
                      </td>

                      {/* Assistant Manager */}
                      <td className="px-4 py-4 align-middle">
                        <div className="flex items-center gap-2 max-w-[140px]">
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-xs shrink-0">
                            {report.assistant_manager.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="font-medium text-slate-800 text-sm break-words">{report.assistant_manager}</span>
                        </div>
                      </td>

                      {/* QA Agent */}
                      <td className="px-4 py-4 align-middle">
                        <div className="flex items-center gap-2 max-w-[140px]">
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-xs shrink-0">
                            {report.qa_agent.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="font-medium text-slate-800 text-sm break-words">{report.qa_agent}</span>
                        </div>
                      </td>

                      {/* Agent */}
                      <td className="px-4 py-4 align-middle">
                        <div className="flex items-center gap-2 max-w-[140px]">
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-xs shrink-0">
                            {report.agent.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="font-medium text-slate-800 text-sm break-words">{report.agent}</span>
                        </div>
                      </td>

                      {/* Project / Task */}
                      <td className="px-4 py-4 align-middle">
                        <div className="max-w-[180px]">
                          <div className="font-bold text-slate-900 text-sm mb-1 break-words">{report.project_name}</div>
                          <div className="text-xs text-slate-600 font-medium bg-slate-100 px-2 py-1 rounded inline-block break-words">
                            {report.task_name}
                          </div>
                        </div>
                      </td>

                      {/* Total Record */}
                      <td className="px-4 py-4 align-middle text-center">
                        <div className="inline-flex items-center justify-center">
                          <span className="font-bold text-slate-800 text-sm">{report.total_record}</span>
                        </div>
                      </td>

                      {/* QC Record */}
                      <td className="px-4 py-4 align-middle text-center">
                        <div className="inline-flex items-center justify-center">
                          <span className="font-bold text-slate-800 text-sm">{report.qc_record}</span>
                        </div>
                      </td>

                      {/* Errors */}
                      <td className="px-4 py-4 align-middle text-center">
                        <div className="inline-flex items-center justify-center">
                          <span className="font-bold text-slate-800 text-sm">{report.error_count}</span>
                        </div>
                      </td>

                      {/* Error List */}
                      <td className="px-4 py-4 align-middle">
                        <button
                          onClick={() => setSelectedErrors(selectedErrors === report.id ? null : report.id)}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-blue-100 border border-slate-200 hover:border-blue-300 rounded-lg text-slate-700 hover:text-blue-700 text-xs font-bold transition-all"
                        >
                          <AlertCircle className="w-3 h-3" />
                          View ({report.error_list.length})
                        </button>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4 align-middle text-center">
                        {report.status === "Regular" ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 text-green-700 font-medium text-xs border border-green-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Regular
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-100 text-orange-700 font-medium text-xs border border-orange-200">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Rework
                          </span>
                        )}
                      </td>

                      {/* QC Score */}
                      <td className="px-4 py-4 align-middle text-center">
                        <div className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 font-bold text-sm shadow-sm ${getScoreColor(report.qc_score)}`}>
                          <Award className="w-4 h-4" />
                          {report.qc_score.toFixed(2)}%
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-slate-200">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-slate-800">Statistics Summary</h3>
          <p className="text-slate-600 text-sm font-medium mt-1">Overview of evaluation metrics</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Total Reports Card */}
          <div className="relative overflow-hidden rounded-xl shadow-md hover:shadow-lg transition-all duration-300 min-w-0 group/card transform hover:-translate-y-1 bg-white border-2 border-slate-200 hover:border-blue-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -translate-y-12 translate-x-12"></div>
            <div className="relative p-5 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0 z-10">
                <div className="flex items-center gap-1.5 mb-2">
                  <p className="text-xs font-bold uppercase tracking-wide truncate text-slate-600">Total Reports</p>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold truncate text-slate-900">{stats.total}</h3>
              </div>
              <div className="p-3 rounded-xl shadow-sm shrink-0 z-10 bg-blue-100">
                <FileCheck className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          {/* Regular Card */}
          <div className="relative overflow-hidden rounded-xl shadow-md hover:shadow-lg transition-all duration-300 min-w-0 group/card transform hover:-translate-y-1 bg-white border-2 border-slate-200 hover:border-blue-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full -translate-y-12 translate-x-12"></div>
            <div className="relative p-5 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0 z-10">
                <div className="flex items-center gap-1.5 mb-2">
                  <p className="text-xs font-bold uppercase tracking-wide truncate text-slate-600">Regular</p>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold truncate text-slate-900">{stats.regular}</h3>
              </div>
              <div className="p-3 rounded-xl shadow-sm shrink-0 z-10 bg-green-100">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Rework Card */}
          <div className="relative overflow-hidden rounded-xl shadow-md hover:shadow-lg transition-all duration-300 min-w-0 group/card transform hover:-translate-y-1 bg-white border-2 border-slate-200 hover:border-blue-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full -translate-y-12 translate-x-12"></div>
            <div className="relative p-5 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0 z-10">
                <div className="flex items-center gap-1.5 mb-2">
                  <p className="text-xs font-bold uppercase tracking-wide truncate text-slate-600">Rework</p>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold truncate text-slate-900">{stats.rework}</h3>
              </div>
              <div className="p-3 rounded-xl shadow-sm shrink-0 z-10 bg-orange-100">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Avg Score Card */}
          <div className="relative overflow-hidden rounded-xl shadow-md hover:shadow-lg transition-all duration-300 min-w-0 group/card transform hover:-translate-y-1 bg-white border-2 border-slate-200 hover:border-blue-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full -translate-y-12 translate-x-12"></div>
            <div className="relative p-5 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0 z-10">
                <div className="flex items-center gap-1.5 mb-2">
                  <p className="text-xs font-bold uppercase tracking-wide truncate text-slate-600">Avg Score</p>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold truncate text-slate-900">{stats.avgScore}%</h3>
              </div>
              <div className="p-3 rounded-xl shadow-sm shrink-0 z-10 bg-purple-100">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {renderErrorListModal()}
    </div>
  );
};

export default QCFormReportView;
