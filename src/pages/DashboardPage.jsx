import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { MONTHLY_GOAL, SHIFT_START_HOUR, SHIFT_HOURS_COUNT } from '../utils/constants';
import { isWithinRange, getComparisonRange } from '../utils/dateHelpers';
import FilterBar from '../components/dashboard/FilterBar';
import TabsNavigation from '../components/dashboard/TabsNavigation';
import OverviewTab from '../components/dashboard/overview/OverviewTab';
import { useAuth } from '../context/AuthContext'; // Updated to use AuthContext
import { useDeviceInfo } from '../hooks/useDeviceInfo';
import { useUserDropdowns } from '../hooks/useUserDropdowns';

// Import the split admin components
import UsersManagement from '../components/dashboard/manage/user/UsersManagement';
import ProjectsManagement from '../components/dashboard/manage/project/ProjectsManagement';
import { fetchUsersList } from '../services/authService';
import { toast } from 'react-hot-toast';

// Import db if needed for admin operations
import db from '../utils/db';

const DashboardPage = ({ 
  logs = [], 
  projects = [], 
  users = [],
  qcRecords = [], // Add if needed for other tabs
  onUpdateUsers, 
  onUpdateProjects
}) => {
  const { 
    user: currentUser, 
    canManageUsers, 
    canManageProjects, 
    isSuperAdmin, 
    canViewSalary 
  } = useAuth(); // Using AuthContext instead of UserContext
  const { device_id, device_type } = useDeviceInfo();
  const { dropdowns, loadDropdowns } = useUserDropdowns();
  
  const [selectedAgent, setSelectedAgent] = useState(null);
  const todayStr = new Date().toISOString().split('T')[0];
  const [dateRange, setDateRange] = useState({ start: todayStr, end: todayStr });
  const [selectedTask, setSelectedTask] = useState('All');
  const [comparisonMode, setComparisonMode] = useState('previous_period');
  
  // Define role-based variables first (before state that depends on them)
  const role = currentUser?.role_name || '';
  const userRole = currentUser?.user_role || '';
  const designation = currentUser?.designation || currentUser?.user_designation || '';
  const roleId = currentUser?.role_id;
  const designationId = currentUser?.designation_id;
  
  // Role ID mapping (based on database):
  // role_id: 6 = Agent
  // role_id: 1 = Admin/Super Admin
  const isAdmin = role === 'admin' || userRole === 'ADMIN' || designation === 'Admin' || roleId === 1;
  const isAgent = role === 'agent' || userRole === 'AGENT' || designation === 'Agent' || designation === 'AGENT' || roleId === 6;
  const isQA = currentUser?.user_designation === 'QA' || designation === 'QA';
  
  console.log('[DashboardPage] role_id:', roleId, 'designation_id:', designationId);
  console.log('[DashboardPage] isAgent:', isAgent, 'isAdmin:', isAdmin);
  
  // Set initial active tab - will be updated when user data loads
  const [activeTab, setActiveTab] = useState('overview');
  
  // State for admin panel
  const [adminRequests, setAdminRequests] = useState([]);
  const [managedUsers, setManagedUsers] = useState([]);
  const [loadingManagedUsers, setLoadingManagedUsers] = useState(false);
  const [adminActiveTab, setAdminActiveTab] = useState('users'); // For admin panel tabs

  // Set active tab based on user role and route when user data is loaded
  // Note: DashboardPage shows 'overview' for agents when accessed via /dashboard (Analytics)
  // The 'dataentry' tab functionality is handled by AgentDashboard component at /agent route
  useEffect(() => {
    console.log('[DashboardPage useEffect] currentUser:', currentUser, 'isAgent:', isAgent);
    if (currentUser) {
      // Always default to 'overview' tab on DashboardPage
      // Agents accessing /dashboard (via Analytics button) see overview with their analytics
      console.log('[DashboardPage] Setting activeTab to overview');
      setActiveTab('overview');
    }
  }, [currentUser, isAgent]);

  // Check if user can access Manage tab (AdminPanel)
  const canAccessManage = canManageUsers || canManageProjects || isSuperAdmin;

  const canViewIncentivesTab = isAdmin || userRole === 'FINANCE_HR' || userRole === 'PROJECT_MANAGER' || isSuperAdmin;
  const canViewAdherence = isAdmin || userRole === 'PROJECT_MANAGER' || isQA || isSuperAdmin;

  // Initialize admin data when Manage tab is active
  useEffect(() => {
    if (activeTab === 'manage') {
      const passwordRequests = db.getPasswordRequests() || [];
      setAdminRequests(passwordRequests);
    }
  }, [activeTab]);

  const allTasks = useMemo(() => {
    const tasks = new Set();
    projects.forEach(p => p.tasks?.forEach(t => tasks.add(t.name)));
    return Array.from(tasks).sort();
  }, [projects]);

  // Load users for Manage → Users tab from backend
  const loadUsers = useCallback(async () => {
    try {
      setLoadingManagedUsers(true);
      const userId = currentUser?.user_id || currentUser?.id;
      
      if (!userId) {
        console.warn('No user_id found in current user');
        toast.error('User session invalid. Please log in again.');
        return;
      }
      
      // Load designations if not already loaded
      if (!dropdowns.designations || dropdowns.designations.length === 0) {
        await loadDropdowns();
      }
      
      const res = await fetchUsersList(userId, device_id, device_type);
      
      console.log('[DashboardPage] Full response from fetchUsersList:', res);
      
      if (res.status === 200) {
        // fetchUsersList returns response.data which is { data: [...], status: 200, message: '...' }
        // So the actual users array is in res.data
        const usersArray = Array.isArray(res.data) ? res.data : [];
        console.log('[DashboardPage] Extracted users array:', usersArray);
        console.log('[DashboardPage] First user raw data:', usersArray[0]);
        console.log('[DashboardPage] Available designations:', dropdowns.designations);
        
        const formatted = usersArray.map(u => {
          // Map designation_id to designation name
          let designationName = u.designation || u.designation_name || '';
          
          // If no designation name but has designation_id, look it up
          if (!designationName && u.designation_id && dropdowns.designations) {
            const designationObj = dropdowns.designations.find(
              d => d.designation_id === u.designation_id || d.id === u.designation_id
            );
            if (designationObj) {
              designationName = designationObj.designation_name || designationObj.name || '';
            }
          }
          
          // Log each user's designation field to debug
          if (!designationName && u.designation_id) {
            console.log('[DashboardPage] User missing designation:', u.user_name, 'designation_id:', u.designation_id, 'Available fields:', Object.keys(u));
          }
          
          return {
            id: u.user_id,
            name: u.user_name,
            email: u.user_email,
            phone: u.user_number,
            role: (u.role || u.role_name || '').toUpperCase().replace(/\s+/g, '_'),
            role_id: u.role_id ?? null,
            designation: designationName,
            designation_id: u.designation_id ?? null,
          reportingManager: u.project_manager || '',
          project_manager_name: u.project_manager || '',
          project_manager_id: u.project_manager_id ?? null,
          assistantManager: u.assistant_manager_id ?? u.asst_manager ?? '',
          qualityAnalyst: u.qa_id ?? u.qa ?? '',
          team: u.team_id ?? u.team ?? '',
          password: u.user_password || '',
          asst_manager: u.asst_manager || '',
          qa: u.qa || '',
          address: u.user_address || '',
          tenure: u.user_tenure ?? u.tenure ?? '',
          profile_picture: u.profile_picture || null,
          };
        });
        
        console.log('[DashboardPage] Formatted users with designations:', formatted.map(u => ({ name: u.name, designation: u.designation })));
        setManagedUsers(formatted);
      } else {
        toast.error(res.message || 'Failed to load users');
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
      console.error('Error response:', err.response?.data);
      toast.error(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoadingManagedUsers(false);
    }
  }, [currentUser, device_id, device_type, dropdowns.designations, loadDropdowns]);

  useEffect(() => {
    if (adminActiveTab === 'users' && canManageUsers) {
      loadUsers();
    }
  }, [adminActiveTab, canManageUsers, loadUsers]);

  const analytics = useMemo(() => {
    const prevRange = getComparisonRange(dateRange.start, dateRange.end, comparisonMode);

    const filterLogs = (s, e) =>
      logs.filter(l =>
        (isAgent ? l.agentName === currentUser?.user_name : true) &&
        isWithinRange(l.date, s, e) &&
        (selectedTask === 'All' || l.taskName === selectedTask)
      );

    const currentLogs = filterLogs(dateRange.start, dateRange.end);
    const prevLogs = filterLogs(prevRange.start, prevRange.end);

    const prodCurrent = currentLogs.reduce((acc, curr) => acc + (curr.totalProduction || 0), 0);
    const prodPrevious = prevLogs.reduce((acc, curr) => acc + (curr.totalProduction || 0), 0);
    const diff = prodCurrent - prodPrevious;

    // Agent Stats
    const agentMap = new Map();
    currentLogs.forEach(l => {
      if (!l?.agentName) return;

      if (!agentMap.has(l.agentName)) {
        agentMap.set(l.agentName, {
          name: l.agentName,
          total: 0,
          totalTarget: 0,
          projects: new Set(),
          dates: new Set(),
          timestamps: []
        });
      }

      const e = agentMap.get(l.agentName);
      e.total += (l.totalProduction || 0);
      e.totalTarget += (SHIFT_HOURS_COUNT * (l.targetPerHour || 0));
      if (l.projectName) e.projects.add(l.projectName);
      if (l.date) e.dates.add(l.date);
      if (l.timestamp) e.timestamps.push(l.timestamp);
    });

    const agentStats = Array.from(agentMap.values()).map((a) => ({
      ...a,
      dailyAvg: a.dates.size > 0 ? a.total / a.dates.size : 0,
      adherence: a.totalTarget > 0 ? (a.total / a.totalTarget) * 100 : 0,
      isOnline: a.timestamps.length > 0 && (Date.now() - Math.max(...a.timestamps)) < 3600000
    })).sort((a, b) => b.total - a.total);

    const endMonthStart = dateRange.end.substring(0, 7) + '-01';
    const monthLogs = logs.filter(l =>
      (isAgent ? l.agentName === currentUser?.user_name : true) &&
      isWithinRange(l.date, endMonthStart, dateRange.end) &&
      (selectedTask === 'All' || l.taskName === selectedTask)
    );

    const monthTotal = monthLogs.reduce((acc, curr) => acc + (curr.totalProduction || 0), 0);
    const effectiveGoal = isAgent ?
      (selectedTask === 'All' ? MONTHLY_GOAL / 5 : MONTHLY_GOAL / 15) :
      (selectedTask === 'All' ? MONTHLY_GOAL : MONTHLY_GOAL / 3);

    const goalProgress = effectiveGoal > 0 ? Math.min((monthTotal / effectiveGoal) * 100, 100) : 0;

    return {
      prodCurrent,
      prodPrevious,
      trendText: `${diff > 0 ? '+' : ''}${(prodPrevious > 0 ? ((diff / prodPrevious) * 100) : 0).toFixed(1)}%`,
      trendDir: diff >= 0 ? 'up' : 'down',
      monthTotal,
      goalProgress,
      effectiveGoal,
      agentStats,
      prevRange,
      agentComplianceAlerts: 0
    };
  }, [logs, dateRange, selectedTask, isAgent, currentUser, comparisonMode]);

  const hourlyChartData = useMemo(() => {
    const data = Array.from({ length: SHIFT_HOURS_COUNT }, (_, i) => ({
      hour: SHIFT_START_HOUR + i,
      label: (SHIFT_START_HOUR + i) > 12 ?
        `${(SHIFT_START_HOUR + i) - 12} PM` :
        `${SHIFT_START_HOUR + i} AM`,
      production: 0,
      target: 0
    }));

    const filtered = logs.filter(l =>
      l?.date &&
      isWithinRange(l.date, dateRange.start, dateRange.end) &&
      (isAgent ? l.agentName === currentUser?.user_name : true) &&
      (selectedTask === 'All' || l.taskName === selectedTask)
    );

    filtered.forEach(log => {
      log.entries?.forEach(entry => {
        const hourIdx = entry.hour - SHIFT_START_HOUR;
        if (hourIdx >= 0 && hourIdx < SHIFT_HOURS_COUNT) {
          data[hourIdx].production += (entry.count || 0);
          data[hourIdx].target += (log.targetPerHour || 0);
        }
      });
    });

    return data;
  }, [logs, dateRange, isAgent, currentUser, selectedTask]);

  // Admin panel functions
  const handleUpdateUsers = (updatedUsers) => {
    if (onUpdateUsers) {
      onUpdateUsers(updatedUsers);
    }
    db.setUsers(updatedUsers);
  };

  const handleUpdateProjects = (updatedProjects) => {
    if (onUpdateProjects) {
      onUpdateProjects(updatedProjects);
    }
    db.setProjects(updatedProjects);
  };

  const handleResolveRequest = (req) => {
    if (window.confirm(`Reset password for ${req.username} and send notification to ${req.email}?`)) {
      const updatedUsers = users.map(u => 
        u.id === req.userId ? { ...u, password: '123' } : u
      );
      handleUpdateUsers(updatedUsers);
      
      db.resolvePasswordRequest(req.id);
      setAdminRequests(db.getPasswordRequests() || []);
      
      alert(`Password reset to '123'. Notification sent to ${req.email}`);
    }
  };

  const handleFactoryReset = () => {
    if (window.confirm("WARNING: This will wipe ALL data and restore the default seed values. This cannot be undone. Are you sure?")) {
      db.reset();
      window.location.reload();
    }
  };

  const handleAgentSelect = useCallback((agentName) => {
    setSelectedAgent(agentName);
  }, []);

  const handleDateRangeChange = useCallback((field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  }, []);

  // Derived data for admin panel
  const pendingRequests = useMemo(() => 
    adminRequests
      .filter(r => r.status === 'PENDING')
      .sort((a, b) => b.timestamp - a.timestamp), 
    [adminRequests]
  );

  const potentialOwners = useMemo(() => 
    users.filter(u => u.role === 'ADMIN' || u.role === 'PROJECT_MANAGER'), 
    [users]
  );
  
  const potentialAPMs = useMemo(() => 
    users.filter(u => u.designation === 'Asst. Project Manager'), 
    [users]
  );
  
  const potentialQAs = useMemo(() => 
    users.filter(u => u.designation === 'QA'), 
    [users]
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Show FilterBar for all tabs except dataentry */}
      {activeTab !== 'dataentry' && (
        <FilterBar
          isAgent={isAgent}
          selectedTask={selectedTask}
          setSelectedTask={setSelectedTask}
          comparisonMode={comparisonMode}
          setComparisonMode={setComparisonMode}
          dateRange={dateRange}
          handleDateRangeChange={handleDateRangeChange}
          allTasks={allTasks}
        />
      )}

      {/* Show TabsNavigation only for admins, hide for agents */}
      {!isAgent && (
        <TabsNavigation
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isAgent={isAgent}
          isAdmin={isAdmin}
          canViewIncentivesTab={canViewIncentivesTab}
          canViewAdherence={canViewAdherence}
          canAccessManage={canAccessManage}
        />
      )}

      {/* Debug: Show current active tab */}
      {console.log('[DashboardPage Render] activeTab:', activeTab)}

      {activeTab === 'overview' && (
        <OverviewTab
          analytics={analytics}
          hourlyChartData={hourlyChartData}
          isAgent={isAgent}
        />
      )}

      {/* Other tabs would go here - they can be added later as needed */}
      
      {/* Project Bookings Tab */}
      {activeTab === 'bookings' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Project Bookings</h2>
          <p className="text-slate-600">Project bookings content will go here.</p>
        </div>
      )}
      
      {/* Agent Performance Tab */}
      {activeTab === 'agents' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Agent Performance</h2>
          <p className="text-slate-600">Agent performance content will go here.</p>
        </div>
      )}
      
      {/* Reporting Adherence Tab */}
      {activeTab === 'adherence' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Reporting Adherence</h2>
          <p className="text-slate-600">Reporting adherence content will go here.</p>
        </div>
      )}
      
      {/* Agent Incentives Tab */}
      {activeTab === 'incentives' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Agent Incentives</h2>
          <p className="text-slate-600">Agent incentives content will go here.</p>
        </div>
      )}
      
      {/* Management Incentives Tab */}
      {activeTab === 'mgmt_incentives' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Management Incentives</h2>
          <p className="text-slate-600">Management incentives content will go here.</p>
        </div>
      )}

      {/* Manage Tab (AdminPanel) - Only show if user has access */}
      {activeTab === 'manage' && canAccessManage && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                  <Settings className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Administration & Management</h2>
                  <p className="text-sm text-slate-500">Manage organization resources, users, and targets.</p>
                </div>
              </div>
            </div>
              
            {/* Admin Tabs Navigation */}
            {(canManageUsers || canManageProjects) && (
              <div className="flex border-b border-slate-200 mb-6">
                  {canManageUsers && (
                    <button 
                      onClick={() => setAdminActiveTab('users')}
                      className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
                        adminActiveTab === 'users' 
                          ? 'border-blue-600 text-blue-700' 
                          : 'border-transparent text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      User Management
                      {pendingRequests.length > 0 && isSuperAdmin && (
                        <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                          {pendingRequests.length}
                        </span>
                      )}
                    </button>
                  )}
                  {canManageProjects && (
                    <button 
                      onClick={() => setAdminActiveTab('projects')}
                      className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
                        adminActiveTab === 'projects' 
                          ? 'border-blue-600 text-blue-700' 
                          : 'border-transparent text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Projects & Targets
                    </button>
                  )}
                </div>
              )}

            {/* Admin Tab Content */}
            {adminActiveTab === 'users' && canManageUsers && (
              <UsersManagement
                users={managedUsers}
                projects={projects}
                onUpdateUsers={setManagedUsers}
                pendingRequests={pendingRequests}
                onResolveRequest={handleResolveRequest}
                loading={loadingManagedUsers}
                loadUsers={loadUsers}
              />
            )}
            
            {adminActiveTab === 'projects' && canManageProjects && (
              <ProjectsManagement
                projects={projects}
                onUpdateProjects={handleUpdateProjects}
                potentialOwners={potentialOwners}
                potentialAPMs={potentialAPMs}
                potentialQAs={potentialQAs}
              />
            )}

            {/* Show message if no permission for active admin tab */}
            {adminActiveTab === 'users' && !canManageUsers && (
              <div className="p-8 text-center text-slate-500">
                <Lock className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <h3 className="font-bold text-lg mb-2">Access Denied</h3>
                <p>You don't have permission to manage users.</p>
              </div>
            )}

            {adminActiveTab === 'projects' && !canManageProjects && (
              <div className="p-8 text-center text-slate-500">
                <Lock className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <h3 className="font-bold text-lg mb-2">Access Denied</h3>
                <p>You don't have permission to manage projects.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Show message if user tries to access Manage tab without permission */}
      {activeTab === 'manage' && !canAccessManage && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4 text-red-600">Access Denied</h2>
          <p className="text-slate-600">
            You don't have permission to access the Manage tab. 
            Only users with user creation or project creation permissions can access this section.
          </p>
        </div>
      )}

      {selectedAgent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{selectedAgent} Details</h2>
              <button
                onClick={() => setSelectedAgent(null)}
                className="bg-slate-200 hover:bg-slate-300 px-4 py-2 rounded transition-colors"
              >
                Close
              </button>
            </div>
            <p className="text-slate-600">
              Detailed view for {selectedAgent}. Add more information here as needed.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;