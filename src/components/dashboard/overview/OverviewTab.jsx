import React, { useEffect, useState, lazy, Suspense } from 'react';
import dayjs from 'dayjs';
import StatCard from './StatCard';
import HourlyChart from './HourlyChart';
import { Activity, Calendar, Target, Users, Clock, CheckCircle, TrendingUp, Award, Briefcase } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useDeviceInfo } from '../../../hooks/useDeviceInfo';
import AgentBillableReport from '../../AgentDashboard/AgentBillableReport';
import AgentTabsNavigation from '../../AgentDashboard/AgentTabsNavigation';

// Clear dashboard data when date range changes to force UI refresh
// (must be inside the component, not before imports)
import api from '../../../services/api';
import { toast } from 'react-hot-toast';

const OverviewTab = ({ analytics, hourlyChartData, isAgent, isQA, dateRange: externalDateRange }) => {
  const { user } = useAuth();
  const { device_id, device_type } = useDeviceInfo();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // New state for active tab

  // QA dashboard filter states
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };
  const [qaStartDate, setQaStartDate] = useState(getTodayDate());
  const [qaEndDate, setQaEndDate] = useState(getTodayDate());
  const [qaSummary, setQaSummary] = useState(null);
  const [qaTrackers, setQaTrackers] = useState([]);
  const [qaLoading, setQaLoading] = useState(false);

  // Dynamically import TabsNavigation for agent side to avoid circular dependency and SSR issues
  const TabsNavigation = isAgent ? lazy(() => import('../TabsNavigation')) : null;
  // If no dateRange is provided, default to current month (first to last day)
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const firstDayStr = firstDayOfMonth.toISOString().slice(0, 10);
  const lastDayStr = lastDayOfMonth.toISOString().slice(0, 10);
  const dateRange = React.useMemo(() => {
    // If no externalDateRange or both start/end are empty strings or undefined, use current month
    if (!externalDateRange ||
      (externalDateRange.start === '' && externalDateRange.end === '') ||
      (typeof externalDateRange.start === 'undefined' && typeof externalDateRange.end === 'undefined')) {
      return { start: firstDayStr, end: lastDayStr };
    }
    // If both start and end are set and equal, treat as single day
    if (externalDateRange.start && externalDateRange.end && externalDateRange.start === externalDateRange.end) {
      return { start: externalDateRange.start, end: externalDateRange.end };
    }
    // If only one of start/end is set, fallback to current month
    if ((externalDateRange.start && !externalDateRange.end) || (!externalDateRange.start && externalDateRange.end)) {
      return { start: firstDayStr, end: lastDayStr };
    }
    // Otherwise, use provided range
    return externalDateRange;
  }, [externalDateRange, firstDayStr, lastDayStr]);


  // Fetch dashboard data for agents
  const fetchDashboardData = React.useCallback(async () => {
    try {
      setLoading(true);
      let payload = {
        logged_in_user_id: user.user_id,
        device_id: device_id || 'web123',
        device_type: device_type || 'web',
        date_from: dateRange.start ? dateRange.start.slice(0, 10) : undefined,
        date_to: dateRange.end ? dateRange.end.slice(0, 10) : undefined
      };
      const response = await api.post('/dashboard/filter', payload);
      if (response.data?.status === 200) {
        setDashboardData(response.data.data);
      } else {
        toast.error('Failed to load dashboard data');
      }
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [user.user_id, device_id, device_type, dateRange]);

  // Fetch QA dashboard data (trackers + summary) with date range filter
  const fetchQADashboardData = React.useCallback(async () => {
    try {
      setQaLoading(true);
      const payload = {
        logged_in_user_id: user.user_id,
        date_from: qaStartDate,
        date_to: qaEndDate
      };
      const response = await api.post('/tracker/view', payload);
      if (response.data?.status === 200) {
        setQaSummary(response.data.data?.month_summary || []);
        setQaTrackers(response.data.data?.trackers || []);
      } else {
        toast.error('Failed to load QA dashboard data');
        setQaSummary([]);
        setQaTrackers([]);
      }
    } catch (error) {
      toast.error('Failed to load QA dashboard data');
      setQaSummary([]);
      setQaTrackers([]);
    } finally {
      setQaLoading(false);
    }
  }, [user.user_id, qaStartDate, qaEndDate]);

  useEffect(() => {
    if (isAgent && user?.user_id) {
      fetchDashboardData();
    }
  }, [isAgent, user?.user_id, device_id, device_type, dateRange, fetchDashboardData]);

  useEffect(() => {
    if (isQA && user?.user_id) {
      fetchQADashboardData();
    }
  }, [isQA, user?.user_id, qaStartDate, qaEndDate, fetchQADashboardData]);

  // Extract agent stats from API response
  // Note: API returns only the logged-in agent's data based on logged_in_user_id
  const agentStats = {
    totalBillableHours: parseFloat(dashboardData?.summary?.total_billable_hours ?? dashboardData?.summary?.total_production ?? 0),
    qcScore: parseFloat(dashboardData?.summary?.qc_score || 0),
    taskCount: parseInt(dashboardData?.summary?.task_count || 0),
    projectCount: parseInt(dashboardData?.summary?.project_count || 0),
  };

  // Extract agent projects from API response
  // API already filters to return only projects this agent worked on
  // Show all projects the agent worked on (remove the billable hours filter)
  const agentProjects = dashboardData?.projects || [];

  // Log detailed summary data for debugging
  if (dashboardData) {
    console.log('═══════════════════════════════════════════════');
    console.log('[OverviewTab] 📊 AGENT DASHBOARD SUMMARY DATA');
    console.log('═══════════════════════════════════════════════');
    console.log(' Summary Counts from API:');
    console.log('  • Total Production (Billable Hours):', dashboardData?.summary?.total_production);
    console.log('  • Task Count:', dashboardData?.summary?.task_count);
    console.log('  • Project Count:', dashboardData?.summary?.project_count);
    console.log('  • Tracker Rows:', dashboardData?.summary?.tracker_rows);
    console.log('  • User Count:', dashboardData?.summary?.user_count);
    console.log('  • QC Score:', dashboardData?.summary?.qc_score);
    console.log('');
    console.log(' Projects Data from API:');
    console.log('  • Total Projects Returned:', dashboardData?.projects?.length || 0);
    console.log('  • All Projects:', dashboardData?.projects);
    console.log('');
    console.log(' Tasks Data from API:');
    console.log('  • Total Tasks:', dashboardData?.tasks?.length || 0);
    console.log('  • Tasks:', dashboardData?.tasks);
    console.log('');
    console.log('👤 Users Data from API:');
    console.log('  • Users:', dashboardData?.users);
    console.log('');
    console.log(' Calculated Stats Being Displayed:');
    console.log('  • Total Billable Hours:', agentStats.totalBillableHours.toFixed(2));
    console.log('  • QC Score:', agentStats.qcScore + '%');
    console.log('  • Task Count:', agentStats.taskCount);
    console.log('  • Project Count:', agentStats.projectCount);
    console.log('');
    console.log(' Projects Being Displayed:');
    agentProjects.forEach((project, index) => {
      const billableHours = project.billable_hours || project.total_billable_hours || 0;
      console.log(`  ${index + 1}. ${project.project_name || 'Unnamed Project'}`);
      console.log(`     - Project ID: ${project.project_id}`);
      console.log(`     - Billable Hours: ${parseFloat(billableHours).toFixed(2)} hours`);
      console.log(`     - Project Code: ${project.project_code || 'N/A'}`);
    });
    console.log('');
    console.log('  NOTE: If billable hours show 0.00 for projects, the backend');
    console.log('    needs to include billable_hours field in each project object.');
    console.log('═══════════════════════════════════════════════');
  }

    return (
      <div className="space-y-4 md:space-y-6 animate-fade-in">
        {/* Agent tab navigation above counting cards */}
        {isAgent && (
          <AgentTabsNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
        )}

        {/* QA DASHBOARD FILTERS & ANALYTICS */}
        {isQA && (
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-end gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                <input type="date" value={qaStartDate} onChange={e => setQaStartDate(e.target.value)} className="border rounded px-2 py-1 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                <input type="date" value={qaEndDate} onChange={e => setQaEndDate(e.target.value)} className="border rounded px-2 py-1 text-sm" />
              </div>
              <button onClick={() => { setQaStartDate(getTodayDate()); setQaEndDate(getTodayDate()); }} className="px-3 py-1.5 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md font-medium transition">Today</button>
            </div>
            {/* QA Analytics Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-4">
              <StatCard title="Total Agents" value={qaSummary ? qaSummary.length : 0} subtext="In range" icon={Users} trend="neutral" tooltip="Total agents in summary." className="min-w-0" />
              <StatCard title="Total Billable Hours" value={qaSummary ? qaSummary.reduce((sum, s) => sum + (parseFloat(s.total_billable_hours_month) || 0), 0).toFixed(2) : '0.00'} subtext="All agents" icon={Clock} trend="neutral" tooltip="Sum of billable hours for all agents." className="min-w-0" />
              <StatCard title="Month" value={qaSummary && qaSummary[0] ? qaSummary[0].month_year : '-'} subtext="Current" icon={Calendar} trend="neutral" tooltip="Month-Year of summary." className="min-w-0" />
              <StatCard title="Pending Days" value={qaSummary && qaSummary[0] ? (qaSummary[0].pending_days ?? '-') : '-'} subtext="Current" icon={Award} trend="neutral" tooltip="Pending days for first agent." className="min-w-0" />
            </div>
            {/* QA Trackers Table */}
            <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200 shadow-sm">
              {qaLoading ? (
                <div className="py-8 text-center text-blue-700 font-semibold">Loading QA dashboard...</div>
              ) : qaTrackers.length === 0 ? (
                <div className="py-8 text-center text-gray-500">No tracker data found for this range.</div>
              ) : (
                <table className="min-w-full divide-y divide-blue-100 text-sm">
                  <thead>
                    <tr className="bg-blue-50">
                      <th className="px-6 py-3 text-left font-semibold text-blue-700 uppercase tracking-wider">Date-Time</th>
                      <th className="px-6 py-3 text-left font-semibold text-blue-700 uppercase tracking-wider">Agent</th>
                      <th className="px-6 py-3 text-left font-semibold text-blue-700 uppercase tracking-wider">Project</th>
                      <th className="px-6 py-3 text-left font-semibold text-blue-700 uppercase tracking-wider">Task</th>
                      <th className="px-6 py-3 text-center font-semibold text-blue-700 uppercase tracking-wider">Billable Hours</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-blue-50">
                    {qaTrackers.map((row, idx) => (
                      <tr key={row.tracker_id || idx} className="hover:bg-blue-50 transition group">
                        <td className="px-6 py-3 text-black font-medium whitespace-nowrap">{row.date_time ? row.date_time : '-'}</td>
                        <td className="px-6 py-3 text-black">{row.user_name || '-'}</td>
                        <td className="px-6 py-3 text-black">{row.project_name || '-'}</td>
                        <td className="px-6 py-3 text-black">{row.task_name || '-'}</td>
                        <td className="px-6 py-3 text-center text-black">{row.billable_hours ? Number(row.billable_hours).toFixed(2) : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Show Billable Report tab content for agents */}
        {isAgent && activeTab === 'billable_report' ? (
          <AgentBillableReport />
        ) : isAgent && activeTab === 'overview' ? (
          <>
            {/* Counting cards for agent */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <StatCard
                title="Total Billable Hours"
                value={agentStats.totalBillableHours.toFixed(2)}
                subtext="Hours logged"
                icon={Clock}
                trend="neutral"
                tooltip="Total billable hours tracked."
                className="min-w-0"
              />
              <StatCard
                title="QC Score"
                value={`${agentStats.qcScore}%`}
                subtext="Quality rating"
                icon={CheckCircle}
                trend="neutral"
                tooltip="Quality control score."
                className="min-w-0"
              />
              <StatCard
                title="Performance"
                value={agentStats.taskCount.toLocaleString()}
                subtext="Tasks assigned"
                icon={TrendingUp}
                trend="neutral"
                tooltip="Total tasks assigned to you."
                className="min-w-0"
              />
              <StatCard
                title="Projects"
                value={agentStats.projectCount.toLocaleString()}
                subtext="Active projects"
                icon={Award}
                trend="neutral"
                tooltip="Number of projects you're working on."
                className="min-w-0"
              />
            </div>

            {/* Project Billable Hours Card for agent overview (dynamic, per project) */}
            <div className="w-full mt-8 px-0">
              <div className="bg-linear-to-r from-blue-600 to-blue-700 px-10 py-6">
                <div className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-briefcase w-5 h-5 text-white" aria-hidden="true"><path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path><rect width="20" height="14" x="2" y="6" rx="2"></rect></svg>
                  <h3 className="text-lg font-semibold text-white">Project Billable Hours</h3>
                </div>
                <p className="text-blue-100 text-sm mt-1">Hours logged per project in selected date range</p>
              </div>
              <div className="p-10">
                <div className="space-y-3">
                  {agentProjects.length === 0 ? (
                    <div className="text-center text-slate-500">No project data available for this date range.</div>
                  ) : (
                    agentProjects.map((project, idx) => (
                      <div key={project.project_id || idx} className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-briefcase w-5 h-5 text-blue-600" aria-hidden="true"><path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path><rect width="20" height="14" x="2" y="6" rx="2"></rect></svg>
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-800">{project.project_name || 'Unnamed Project'}</h4>
                            <p className="text-xs text-slate-500">{project.project_code || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">{parseFloat(project.billable_hours ?? project.total_billable_hours ?? 0).toFixed(2)}</div>
                          <p className="text-xs text-slate-500">Hours</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {/* Admin cards */}
            <StatCard
              title="Production (Selected)"
              value={analytics.prodCurrent.toLocaleString()}
              subtext={analytics.trendText}
              icon={Activity}
              trend={analytics.trendDir}
              tooltip="Total production volume in range."
              className="min-w-0"
            />
            <StatCard
              title={`Production (${analytics.prevRange.label})`}
              value={analytics.prodPrevious.toLocaleString()}
              subtext="Vs Previous"
              icon={Calendar}
              trend="neutral"
              tooltip="Comparison period volume."
              className="min-w-0"
            />
            <StatCard
              title="MTD Progress"
              value={`${analytics.goalProgress.toFixed(1)}%`}
              subtext={`Target: ${analytics.effectiveGoal.toLocaleString()}`}
              icon={Target}
              trend="neutral"
              tooltip="% of Monthly Target achieved."
              className="min-w-0"
            />
            <StatCard
              title="Active Agents"
              value={analytics.agentStats.length}
              subtext="In range"
              icon={Users}
              trend="neutral"
              tooltip="Agent Activity count."
              className="min-w-0"
            />
          </div>
        )}

        {/* Project Billable Hours section removed for agents */}

        {/* Conditional content based on user role */}
      </div>
    );
};

export default OverviewTab;