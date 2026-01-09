import React from 'react';
import StatCard from './StatCard';
import HourlyChart from './HourlyChart';
import { Activity, Calendar, Target, Users, Clock, CheckCircle, TrendingUp, Award, Briefcase } from 'lucide-react';

const OverviewTab = ({ analytics, hourlyChartData, isAgent }) => {
  // Placeholder data for agent cards (will be replaced with API data)
  const agentStats = {
    totalBillableHours: 0, // TODO: Fetch from API
    qcScore: 0, // TODO: Fetch from API
    placeholder1: 0, // TODO: To be defined
    placeholder2: 0, // TODO: To be defined
  };

  // Placeholder data for agent projects (will be replaced with API data)
  const agentProjects = [
    // TODO: Fetch from API based on date range
    // Example structure:
    // { project_name: 'Project Alpha', billable_hours: 15.5 },
    // { project_name: 'Project Beta', billable_hours: 8.25 },
  ];

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      {/* Grid container with responsive columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {isAgent ? (
          <>
            {/* Agent-specific cards */}
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
              value={agentStats.placeholder1.toLocaleString()}
              subtext="To be defined"
              icon={TrendingUp}
              trend="neutral"
              tooltip="Performance metric (coming soon)."
              className="min-w-0"
            />
            <StatCard
              title="Achievement"
              value={agentStats.placeholder2.toLocaleString()}
              subtext="To be defined"
              icon={Award}
              trend="neutral"
              tooltip="Achievement metric (coming soon)."
              className="min-w-0"
            />
          </>
        ) : (
          <>
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
          </>
        )}
      </div>

      {/* Conditional content based on user role */}
      {isAgent ? (
        /* Agent Project Billable Hours Section */
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <div className="flex items-center gap-3">
              <Briefcase className="w-5 h-5 text-white" />
              <h3 className="text-lg font-semibold text-white">Project Billable Hours</h3>
            </div>
            <p className="text-blue-100 text-sm mt-1">Hours logged per project in selected date range</p>
          </div>

          <div className="p-6">
            {agentProjects.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No project data available</p>
                <p className="text-slate-400 text-sm mt-1">Select a different date range or log your hours</p>
              </div>
            ) : (
              <div className="space-y-3">
                {agentProjects.map((project, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800">{project.project_name}</h4>
                        <p className="text-xs text-slate-500">Project</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {project.billable_hours.toFixed(2)}
                      </div>
                      <p className="text-xs text-slate-500">Hours</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Admin Chart Section */
        <div className="w-full overflow-hidden">
          <HourlyChart data={hourlyChartData} />
        </div>
      )}
    </div>
  );
};

export default OverviewTab;