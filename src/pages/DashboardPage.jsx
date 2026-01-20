import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Settings, Lock } from 'lucide-react';
import { MONTHLY_GOAL, SHIFT_START_HOUR, SHIFT_HOURS_COUNT } from '../utils/constants';
import { isWithinRange, getComparisonRange } from '../utils/dateHelpers';
import FilterBar from '../components/dashboard/FilterBar';
import TabsNavigation from '../components/dashboard/TabsNavigation';
import OverviewTab from '../components/dashboard/overview/OverviewTab';
import QATrackerReport from '../components/dashboard/QATrackerReport';
import QAAgentList from '../components/dashboard/QAAgentList';
import QAAgentDashboard from '../components/QAAgentDashboard/QAAgentDashboard';
import AssistantManagerDashboard from '../components/dashboard/AssistantManagerDashboard';
import { useAuth } from '../context/AuthContext'; // Updated to use AuthContext
import { useDeviceInfo } from '../hooks/useDeviceInfo';
import { useUserDropdowns } from '../hooks/useUserDropdowns';

// Import the split admin components
import UsersManagement from '../components/dashboard/manage/user/UsersManagement';
import ProjectsManagement from '../components/dashboard/manage/project/ProjectsManagement';
import { fetchUsersList } from '../services/authService';
import { fetchProjectsList } from '../services/projectService';
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
    canViewSalary 
  } = useAuth(); // Using AuthContext instead of UserContext
  const { device_id, device_type } = useDeviceInfo();
  const { dropdowns, loadDropdowns } = useUserDropdowns();
  const [searchParams] = useSearchParams();
  const viewParam = searchParams.get('view');
  
  const [selectedAgent, setSelectedAgent] = useState(null);
  // Default filter is empty (00/00/0000), but we want to show today's data if not set
  const emptyDate = '';
  const todayStr = new Date().toISOString().slice(0, 10);
  const [dateRange, setDateRange] = useState({ start: emptyDate, end: emptyDate });
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
  // role_id: 5 = QA
  // role_id: 4 = Assistant Manager
  // role_id: 3 = Project Manager
  // Ensure admin and super admin detection is robust
  const isAdmin = roleId === 1 || String(role).toLowerCase() === 'admin' || String(userRole).toUpperCase() === 'ADMIN' || String(designation).toLowerCase() === 'admin';
  const isSuperAdmin = String(role).toLowerCase().includes('super') || String(userRole).toUpperCase().includes('SUPER') || String(designation).toLowerCase().includes('super');
  const isAgent = roleId === 6 || String(role).toLowerCase() === 'agent' || String(userRole).toUpperCase() === 'AGENT' || String(designation).toLowerCase() === 'agent';
  const isQA = roleId === 5 || String(currentUser?.user_designation).toLowerCase() === 'qa' || String(designation).toLowerCase() === 'qa' || String(role).toLowerCase().includes('qa');
  const isAssistantManager = roleId === 4 || String(designation).toLowerCase() === 'assistant manager' || String(role).toLowerCase().includes('assistant');
  const isProjectManager = roleId === 3 || String(designation).toLowerCase() === 'project manager' || String(role).toLowerCase().includes('project manager');
  const canViewTrackerReport = isQA || isAssistantManager || isProjectManager;
  
  // Set initial active tab - will be updated when user data loads
  const [activeTab, setActiveTab] = useState('overview');
  
  // State for admin panel
  const [adminRequests, setAdminRequests] = useState([]);
  const [managedUsers, setManagedUsers] = useState([]);
  const [loadingManagedUsers, setLoadingManagedUsers] = useState(false);
  const [managedProjects, setManagedProjects] = useState([]);
  const [loadingManagedProjects, setLoadingManagedProjects] = useState(false);
  const [adminActiveTab, setAdminActiveTab] = useState('users'); // For admin panel tabs

  // Check if user can access Manage tab (AdminPanel) - must be declared before useEffect
  const canAccessManage = canManageUsers || canManageProjects || isSuperAdmin;

  // Set active tab based on user role, route, and query parameter when user data is loaded
  // Note: DashboardPage shows 'overview' for agents when accessed via /dashboard (Analytics)
  // The 'dataentry' tab functionality is handled by AgentDashboard component at /agent route
  useEffect(() => {
    console.log('[DashboardPage useEffect] currentUser:', currentUser, 'isAgent:', isAgent);
    if (currentUser) {
      // Check for tab query parameter (e.g., ?tab=manage)
      const tabParam = searchParams.get('tab');
      if (tabParam === 'manage' && canAccessManage) {
        console.log('[DashboardPage] Setting activeTab to manage from query param');
        setActiveTab('manage');
      } else if (isProjectManager || isAdmin || isSuperAdmin) {
        // Redirect project managers, admins, and superadmins to manage tab by default
        console.log('[DashboardPage] Admin/Project Manager: Setting activeTab to manage');
        setActiveTab('manage');
      } else {
        // Always default to 'overview' tab on DashboardPage
        // Agents accessing /dashboard (via Analytics button) see overview with their analytics
        console.log('[DashboardPage] Setting activeTab to overview');
        setActiveTab('overview');
      }
    }
  }, [currentUser, isAgent, searchParams, canAccessManage]);

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
    managedProjects.forEach(p => p.tasks?.forEach(t => tasks.add(t.name)));
    return Array.from(tasks).sort();
  }, [managedProjects]);

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
      
      if (res.status === 200 || res.status === '200') {
        // fetchUsersList returns response.data which is { data: [...], status: 200, message: '...' }
        // So the actual users array is in res.data
        const usersArray = Array.isArray(res.data) ? res.data : [];
        
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
            user_id: u.user_id,
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
            assistantManager: u.assistant_manager_id || u.asst_manager || '',
            qualityAnalyst: u.qa_id || u.qa || '',
            team: u.team_id || u.team || '',
            team_name: u.team_name || '',
            password: u.user_password || '',
            password_plain: u.user_password || '',
            asst_manager: u.asst_manager || '',
            qa: u.qa || '',
            address: u.user_address || '',
            tenure: u.user_tenure ?? u.tenure ?? '',
            profile_picture: u.profile_picture || null,
            is_active: u.is_active ?? 1
          };
        });
        
        setManagedUsers(formatted);
      } else {
        toast.error(res.message || 'Failed to load users');
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
      console.error('Error response:', err.response?.data);
      
      // For Assistant Managers or users without full permissions, show a softer error
      const isAssistantManager = roleId === 4 || role.includes('ASSISTANT');
      if (isAssistantManager && !canManageUsers) {
        console.log('[DashboardPage] Assistant Manager without user management permission - showing empty list');
        setManagedUsers([]);
        // Don't show error toast for read-only users
      } else {
        toast.error(err.response?.data?.message || 'Failed to load users');
      }
    } finally {
      setLoadingManagedUsers(false);
    }
  }, [currentUser, device_id, device_type, dropdowns.designations, loadDropdowns]);

  useEffect(() => {
    // Load users ONLY when on the Manage tab AND User Management sub-tab is active AND user has permission
    // This prevents unnecessary API calls on other tabs and for users without permission
    if (activeTab === 'manage' && adminActiveTab === 'users' && canManageUsers) {
      loadUsers();
    }
  }, [activeTab, adminActiveTab, canManageUsers, loadUsers]);

  // Load projects for Manage → Projects tab from backend
  const loadProjects = useCallback(async () => {
    try {
      setLoadingManagedProjects(true);
      
      const res = await fetchProjectsList();
      
      if (res.status === 200 || res.status === '200') {
        const projectsArray = Array.isArray(res.data) ? res.data : [];
        
        const formatted = projectsArray.map(p => {
          // Helper to ensure arrays are properly formatted
          const ensureArray = (value) => {
            if (!value) return [];
            if (Array.isArray(value)) return value;
            return [value];
          };
          
          return {
            id: p.project_id,
            name: p.project_name,
            description: p.project_description || '',
            project_manager_id: p.project_manager_id,
            project_manager_name: p.project_manager_name || '',
            asst_project_manager_id: ensureArray(p.asst_project_manager_id),
            asst_project_manager_names: ensureArray(p.asst_project_manager_names),
            project_qa_id: ensureArray(p.project_qa_id),
            project_qa_names: ensureArray(p.project_qa_names),
            project_team_id: ensureArray(p.project_team_id),
            project_team_names: ensureArray(p.project_team_names),
            files: p.files || null,
            tasks: p.tasks || [],
            created_at: p.created_at,
            updated_at: p.updated_at,
          };
        });
        
        setManagedProjects(formatted);
      } else {
        toast.error(res.message || 'Failed to load projects');
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
      toast.error(err.response?.data?.message || 'Failed to load projects');
    } finally {
      setLoadingManagedProjects(false);
    }
  }, []);

  useEffect(() => {
    // Load projects ONLY when on the Manage tab AND Projects sub-tab is active
    if (activeTab === 'manage' && adminActiveTab === 'projects') {
      loadProjects();
    }
  }, [activeTab, adminActiveTab, loadProjects]);

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

  // Check if QA/Assistant Manager/Project Manager is viewing a specific view
  if (canViewTrackerReport && viewParam === 'tracker-report') {
    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-10">
        <QATrackerReport />
      </div>
    );
  }

  // Show agent list for both QA and Assistant Manager
  if ((isQA || isAssistantManager) && viewParam === 'agent-list') {
    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-10">
        <QAAgentList />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Show FilterBar for all tabs except dataentry, manage, and QA special views */}
      {activeTab !== 'dataentry' && activeTab !== 'manage' && !viewParam && !isAssistantManager && (
        <FilterBar
            isAgent={isAgent}
            isQA={isQA}
            selectedTask={selectedTask}
            setSelectedTask={setSelectedTask}
            comparisonMode={comparisonMode}
            setComparisonMode={setComparisonMode}
            dateRange={{
              start: dateRange.start || '',
              end: dateRange.end || ''
            }}
            handleDateRangeChange={handleDateRangeChange}
            allTasks={allTasks}
          />
      )}

      {/* Show TabsNavigation only for admins, hide for agents, QA, assistant manager, and on manage tab */}
      {!isAgent && !isQA && !isAssistantManager && activeTab !== 'manage' && (
        <TabsNavigation
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isAgent={isAgent}
          isQA={isQA}
          isAdmin={isAdmin}
          canViewIncentivesTab={canViewIncentivesTab}
          canViewAdherence={canViewAdherence}
          canAccessManage={canAccessManage}
        />
      )}

      {/* Debug: Show current active tab */}
      {console.log('[DashboardPage Render] activeTab:', activeTab)}

      {activeTab === 'overview' && (() => {
        const isDefault = !dateRange.start && !dateRange.end;
        const dynamicToday = new Date().toISOString().slice(0, 10);
        const rangeToSend = isDefault ? { start: dynamicToday, end: dynamicToday } : dateRange;
        if (isQA) {
          return <QAAgentDashboard embedded={true} />;
        } else if (isAssistantManager) {
          return <AssistantManagerDashboard />;
        } else if (isAgent || isAdmin || isSuperAdmin) {
          return (
            <OverviewTab
              analytics={analytics}
              hourlyChartData={hourlyChartData}
              isAgent={isAgent}
              dateRange={rangeToSend}
            />
          );
        } else {
          // fallback for any other role
          return (
            <OverviewTab
              analytics={analytics}
              hourlyChartData={hourlyChartData}
              isAgent={isAgent}
              dateRange={rangeToSend}
            />
          );
        }
      })()}

      {/* Other tabs would go here - they can be added later as needed */}
      
      {/* User Monthly Target Tab (disabled, component missing) */}
      {/*
      {activeTab === 'bookings' && (
        <div className="my-6">
          <UserMonthlyTargetCard />
        </div>
      )}
      */}
      
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

      {/* Manage Tab (AdminPanel) - Show UI to all who can access, control actions by specific permissions */}
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
              
            {/* Admin Tabs Navigation - Show tabs but they'll display permission messages if no access */}
            <div className="flex border-b border-slate-200 mb-6">
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
            </div>

            {/* Admin Tab Content */}
            {adminActiveTab === 'users' && (
              canManageUsers ? (
                <UsersManagement
                  users={managedUsers}
                  projects={projects}
                  onUpdateUsers={setManagedUsers}
                  pendingRequests={pendingRequests}
                  onResolveRequest={handleResolveRequest}
                  loading={loadingManagedUsers}
                  loadUsers={loadUsers}
                />
              ) : (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8 text-amber-600" />
                  </div>
                  <h3 className="font-bold text-xl mb-2 text-slate-800">View Only Access</h3>
                  <p className="text-slate-600 mb-4">You can view user information but don't have permission to make changes.</p>
                  <p className="text-sm text-slate-500">Contact your administrator if you need edit access.</p>
                  
                  {/* Show read-only view */}
                  <div className="mt-8">
                    <UsersManagement
                      users={managedUsers}
                      projects={projects}
                      onUpdateUsers={setManagedUsers}
                      pendingRequests={pendingRequests}
                      onResolveRequest={handleResolveRequest}
                      loading={loadingManagedUsers}
                      loadUsers={loadUsers}
                      readOnly={true}
                    />
                  </div>
                </div>
              )
            )}
            
            {adminActiveTab === 'projects' && (
              canManageProjects ? (
                <ProjectsManagement
                  projects={managedProjects}
                  onUpdateProjects={setManagedProjects}
                  loading={loadingManagedProjects}
                  loadProjects={loadProjects}
                  potentialOwners={potentialOwners}
                  potentialAPMs={potentialAPMs}
                  potentialQAs={potentialQAs}
                />
              ) : (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8 text-amber-600" />
                  </div>
                  <h3 className="font-bold text-xl mb-2 text-slate-800">View Only Access</h3>
                  <p className="text-slate-600 mb-4">You can view project information but don't have permission to make changes.</p>
                  <p className="text-sm text-slate-500">Contact your administrator if you need edit access.</p>
                  
                  {/* Show read-only view */}
                  <div className="mt-8">
                    <ProjectsManagement
                      projects={managedProjects}
                      onUpdateProjects={setManagedProjects}
                      loading={loadingManagedProjects}
                      loadProjects={loadProjects}
                      potentialOwners={potentialOwners}
                      potentialAPMs={potentialAPMs}
                      potentialQAs={potentialQAs}
                      readOnly={true}
                    />
                  </div>
                </div>
              )
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