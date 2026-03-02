/**
 * File: QAAgentList.jsx
 * Author: Naitik Maisuriya
 * Description: QA Agent List - Shows assigned agents with their tracker data (files only)
 */
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ChevronDown, ChevronUp, Download, FileText, FileCheck, Users as UsersIcon, Search, X, RefreshCw, RotateCcw, Check, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { log, logError } from "../../config/environment";
import { DateRangePicker } from "../common/CustomCalendar";
import QCFormReportView from "./QCFormReportView";

// Helper to get today's date in YYYY-MM-DD format
const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

const QAAgentList = () => {
  const { user } = useAuth();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [agentLoading, setAgentLoading] = useState(false);
  const [expandedAgents, setExpandedAgents] = useState({});
  const [agentTrackers, setAgentTrackers] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  
  // Tab state
  const [activeTab, setActiveTab] = useState('agent_files');
  
  // Selected agent for split view
  const [selectedAgentId, setSelectedAgentId] = useState(null);
  
  // Per-agent date filter states
  const [agentDateFilters, setAgentDateFilters] = useState({});

  // Project/task name mapping state
  const [projectNameMap, setProjectNameMap] = useState({});
  const [taskNameMap, setTaskNameMap] = useState({});


  // Fetch project/task mapping, then tracker data
  useEffect(() => {
    const fetchAllData = async () => {
      if (!user?.user_id) return;
      setLoading(true);
      try {
        // 1. Fetch mapping
        const dropdownRes = await api.post("/dropdown/get", {
          dropdown_type: "projects with tasks",
          logged_in_user_id: user?.user_id
        });
        const projectsWithTasks = dropdownRes.data?.data || [];
        const pMap = {};
        const tMap = {};
        projectsWithTasks.forEach(project => {
          pMap[String(project.project_id)] = project.project_name;
          (project.tasks || []).forEach(task => {
            tMap[String(task.task_id)] = task.task_name || task.label;
          });
        });
        setProjectNameMap(pMap);
        setTaskNameMap(tMap);

        // 2. Fetch ALL tracker data (no date filter) to get all agents assigned to this QA
        const allTrackersRes = await api.post("/tracker/view", {
          logged_in_user_id: user?.user_id
        });
        const allTrackerData = allTrackersRes.data?.data || {};
        const allTrackers = allTrackerData.trackers || [];
        let myTrackers = allTrackers;
        if (myTrackers.some(t => t.qa_agent_id !== undefined)) {
          myTrackers = myTrackers.filter(t => String(t.qa_agent_id) === String(user?.user_id));
        }
        
        // Build agents list from ALL tracker data (to get all agents ever assigned)
        const agentsMap = {};
        myTrackers.forEach(tracker => {
          if (!agentsMap[String(tracker.user_id)]) {
            agentsMap[String(tracker.user_id)] = {
              user_id: tracker.user_id,
              user_name: tracker.user_name || '-',
            };
          }
        });
        const allAgents = Object.values(agentsMap);
        
        // 3. Fetch today's tracker data to get initial file counts
        const today = getTodayDate();
        const todayTrackersRes = await api.post("/tracker/view", {
          logged_in_user_id: user?.user_id,
          date_from: today,
          date_to: today
        });
        const todayTrackerData = todayTrackersRes.data?.data || {};
        const todayTrackers = todayTrackerData.trackers || [];
        let myTodayTrackers = todayTrackers;
        if (myTodayTrackers.some(t => t.qa_agent_id !== undefined)) {
          myTodayTrackers = myTodayTrackers.filter(t => String(t.qa_agent_id) === String(user?.user_id));
        }
        
        // Build initial trackers by agent for today (for file counts)
        const initialTrackersByAgent = {};
        allAgents.forEach(agent => {
          initialTrackersByAgent[agent.user_id] = myTodayTrackers
            .filter(t => String(t.user_id) === String(agent.user_id) && t.tracker_file)
            .map(tracker => ({
              ...tracker,
              user_name: tracker.user_name || agent.user_name || '-',
              project_name: tracker.project_name || pMap[String(tracker.project_id)] || '-',
              task_name: tracker.task_name || tMap[String(tracker.task_id)] || '-',
            }));
        });
        
        setAgents(allAgents);
        setAgentTrackers(initialTrackersByAgent);
        
        // Initialize date filters for all agents to today's date
        const initialDateFilters = {};
        allAgents.forEach(agent => {
          initialDateFilters[agent.user_id] = { startDate: today, endDate: today };
        });
        setAgentDateFilters(initialDateFilters);
        
        // Auto-select first agent if available
        if (allAgents.length > 0) {
          setSelectedAgentId(allAgents[0].user_id);
        }
        
        log('[QAAgentList] Agents loaded:', allAgents.length);
      } catch (err) {
        logError('[QAAgentList] Error fetching agent list data:', err);
        toast.error("Failed to load agent data");
        setAgents([]);
        setAgentTrackers({});
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, [user?.user_id]);

  // Fetch tracker data for specific agent with date range
  const fetchAgentTrackers = async (agentId, startDate = null, endDate = null) => {
    setAgentLoading(true);
    try {
      // Use provided dates or fall back to state/today's date
      const filters = startDate && endDate 
        ? { startDate, endDate }
        : (agentDateFilters[agentId] || { startDate: getTodayDate(), endDate: getTodayDate() });
      
      log('[QAAgentList] Fetching trackers for agent:', agentId, 'with dates:', filters);
      
      const trackerRes = await api.post("/tracker/view", {
        logged_in_user_id: user?.user_id,
        date_from: filters.startDate,
        date_to: filters.endDate
      });

      const trackerData = trackerRes.data?.data || {};
      const allTrackers = trackerData.trackers || [];
      
      // Filter for trackers assigned to logged-in QA
      let myTrackers = allTrackers;
      if (myTrackers.some(t => t.qa_agent_id !== undefined)) {
        myTrackers = myTrackers.filter(t => String(t.qa_agent_id) === String(user?.user_id));
      }
      
      // Filter for this specific agent and only trackers with files
      const agentSpecificTrackers = myTrackers
        .filter((tracker) => String(tracker.user_id) === String(agentId) && tracker.tracker_file)
        .map(tracker => ({
          ...tracker,
          project_name: tracker.project_name || projectNameMap[String(tracker.project_id)] || '-',
          task_name: tracker.task_name || taskNameMap[String(tracker.task_id)] || '-',
        }));
      
      log('[QAAgentList] Found trackers for agent:', agentSpecificTrackers.length);
      
      setAgentTrackers(prev => ({
        ...prev,
        [agentId]: agentSpecificTrackers
      }));
    } catch (error) {
      logError("[QAAgentList] Error fetching agent trackers:", error);
      toast.error("Failed to fetch tracker data");
    } finally {
      setAgentLoading(false);
    }
  };

  // Toggle agent card expansion
  const toggleAgent = (agentId) => {
    const isCurrentlyExpanded = expandedAgents[agentId];
    
    setExpandedAgents(prev => ({
      ...prev,
      [agentId]: !prev[agentId]
    }));
    
    // If expanding (not currently expanded), fetch fresh data
    if (!isCurrentlyExpanded) {
      fetchAgentTrackers(agentId);
    }
  };

  // Filter and sort agents based on search query
  const filteredAndSortedAgents = useMemo(() => {
    if (!searchQuery.trim()) {
      return agents;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = agents.filter(agent => 
      agent.user_name.toLowerCase().includes(query)
    );
    
    // Sort: exact matches first, then partial matches
    return filtered.sort((a, b) => {
      const aName = a.user_name.toLowerCase();
      const bName = b.user_name.toLowerCase();
      const aStartsWith = aName.startsWith(query);
      const bStartsWith = bName.startsWith(query);
      
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;
      return aName.localeCompare(bName);
    });
  }, [agents, searchQuery]);

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery("");
  };

  // Handle date changes for specific agent
  const handleAgentStartDateChange = (agentId, dateValue) => {
    const currentFilters = agentDateFilters[agentId] || { startDate: getTodayDate(), endDate: getTodayDate() };
    const newFilters = {
      ...currentFilters,
      startDate: dateValue
    };
    
    setAgentDateFilters(prev => ({
      ...prev,
      [agentId]: newFilters
    }));
    
    // Fetch updated data with new dates immediately
    fetchAgentTrackers(agentId, newFilters.startDate, newFilters.endDate);
  };

  const handleAgentEndDateChange = (agentId, dateValue) => {
    const currentFilters = agentDateFilters[agentId] || { startDate: getTodayDate(), endDate: getTodayDate() };
    const newFilters = {
      ...currentFilters,
      endDate: dateValue
    };
    
    setAgentDateFilters(prev => ({
      ...prev,
      [agentId]: newFilters
    }));
    
    // Fetch updated data with new dates immediately
    fetchAgentTrackers(agentId, newFilters.startDate, newFilters.endDate);
  };

  // Reset filters for specific agent
  const handleResetAgentFilters = (agentId) => {
    const today = getTodayDate();
    setAgentDateFilters(prev => ({
      ...prev,
      [agentId]: { startDate: today, endDate: today }
    }));
    // Fetch updated data with today's date immediately
    fetchAgentTrackers(agentId, today, today);
  };

  // Handle QC Form action
  const navigate = useNavigate();
  const handleQCForm = (tracker) => {
    log('[QAAgentList] Opening QC Form for tracker:', tracker.tracker_id);
    navigate('/qc-form', { state: { tracker } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 py-6 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <UsersIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight cursor-default">Agent Files & QC Report</h2>
              <p className="text-slate-600 text-sm font-medium mt-1 cursor-default">View and manage agent files with QC forms</p>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white rounded-2xl shadow-lg mb-6 border border-slate-200 overflow-hidden">
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('agent_files')}
              className={`flex-1 px-6 py-4 text-sm font-bold transition-all relative ${
                activeTab === 'agent_files'
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FileText className="w-4 h-4" />
                <span>Agent's File Report</span>
              </div>
              {activeTab === 'agent_files' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('qc_report')}
              className={`flex-1 px-6 py-4 text-sm font-bold transition-all relative ${
                activeTab === 'qc_report'
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FileCheck className="w-4 h-4" />
                <span>QC Form Report</span>
              </div>
              {activeTab === 'qc_report' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
              )}
            </button>
          </div>
        </div>

        {/* Split View Layout */}
        {activeTab === 'agent_files' && (
          <>
        <div className="bg-white rounded-2xl shadow-xl border-2 border-slate-200 overflow-hidden" style={{ height: 'calc(100vh - 400px)', minHeight: '600px' }}>
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center p-16">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <UsersIcon className="w-8 h-8 text-blue-600 animate-pulse" />
                </div>
              </div>
              <p className="text-slate-700 font-bold text-lg mt-6">Loading Agent Data</p>
              <p className="text-slate-500 text-sm mt-2">Please wait while we fetch the information...</p>
            </div>
          ) : filteredAndSortedAgents.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-16">
              <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
                <UsersIcon className="w-12 h-12 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">
                {searchQuery ? 'No Agents Found' : 'No Agent Data Available'}
              </h3>
              <p className="text-slate-600 text-sm max-w-md mb-6 text-center">
                {searchQuery 
                  ? `We couldn't find any agents matching "${searchQuery}". Try adjusting your search.`
                  : 'No agents are currently assigned to you. Please check back later or contact your administrator.'
                }
              </p>
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-xl transition-all duration-300"
                >
                  <X className="w-4 h-4" />
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <div className="flex h-full">
              {/* Left Sidebar - Agent List */}
              <div className="w-80 border-r-2 border-slate-200 bg-gradient-to-b from-slate-50 to-white flex flex-col">
                {/* Sidebar Header */}
                <div className="px-5 py-4 border-b-2 border-slate-200 bg-gradient-to-r from-blue-600 to-indigo-600">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <UsersIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-base">Agents</h3>
                      <p className="text-blue-100 text-xs font-medium">{filteredAndSortedAgents.length} Total</p>
                    </div>
                  </div>
                </div>

                {/* Search Section */}
                <div className="p-3 border-b-2 border-slate-200 bg-white">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search agents..."
                      className="w-full pl-10 pr-9 py-2.5 text-sm font-medium border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 hover:bg-white transition-all placeholder:text-slate-400"
                    />
                    {searchQuery && (
                      <button
                        onClick={handleClearSearch}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-200 hover:bg-red-100 text-slate-600 hover:text-red-600 rounded-md transition-all flex items-center justify-center group"
                      >
                        <X className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform duration-300" />
                      </button>
                    )}
                  </div>
                  {searchQuery && (
                    <div className="mt-2 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1.5 rounded-lg shadow-sm">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                      <span className="font-bold text-xs">
                        {filteredAndSortedAgents.length} result{filteredAndSortedAgents.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>

                {/* Agents List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {filteredAndSortedAgents.map((agent) => {
                    const trackers = agentTrackers[agent.user_id] || [];
                    const isSelected = selectedAgentId === agent.user_id;
                    
                    return (
                      <button
                        key={agent.user_id}
                        onClick={() => {
                          setSelectedAgentId(agent.user_id);
                          fetchAgentTrackers(agent.user_id);
                        }}
                        disabled={agentLoading}
                        className={`w-full text-left p-4 rounded-xl transition-all duration-300 border-2 relative overflow-hidden ${
                          isSelected
                            ? 'bg-white border-blue-600 shadow-lg scale-105'
                            : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md'
                        } ${agentLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        {/* Left accent border for selected */}
                        {isSelected && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-600 to-indigo-600"></div>
                        )}
                        
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-sm bg-gradient-to-br from-blue-100 to-indigo-100`}>
                            <UsersIcon className="w-6 h-6 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-sm truncate text-slate-900">
                                {agent.user_name}
                              </h4>
                              {isSelected && (
                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm">
                                  <Check className="w-3 h-3" />
                                  <span className="text-xs font-bold">Selected</span>
                                </div>
                              )}
                            </div>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-700">
                              <FileText className="w-3 h-3" />
                              <span>{trackers.length} file{trackers.length !== 1 ? 's' : ''}</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Panel - Agent Details */}
              <div className="flex-1 flex flex-col bg-gradient-to-br from-slate-50 to-blue-50/30">
                {agentLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                      <p className="text-slate-700 font-bold text-lg">Loading Agent Data...</p>
                      <p className="text-slate-500 text-sm mt-2">Please wait</p>
                    </div>
                  </div>
                ) : selectedAgentId ? (() => {
                  const selectedAgent = agents.find(a => a.user_id === selectedAgentId);
                  const trackers = agentTrackers[selectedAgentId] || [];
                  
                  return (
                    <>
                      {/* Details Header */}
                      <div className="px-6 py-5 border-b-2 border-slate-200 bg-white">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
                              <UsersIcon className="w-8 h-8 text-white" />
                            </div>
                            <div>
                              <h2 className="text-2xl font-bold text-slate-900 mb-1">{selectedAgent?.user_name}</h2>
                              <div className="flex items-center gap-3">
                                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 px-3 py-1.5 rounded-lg font-bold text-sm">
                                  <FileText className="w-4 h-4" />
                                  <span>{trackers.length} Files</span>
                                </div>
                                {trackers.length > 0 && (
                                  <div className="text-xs text-slate-500 font-medium bg-slate-100 px-3 py-1.5 rounded-lg">
                                    {agentDateFilters[selectedAgentId]?.startDate === agentDateFilters[selectedAgentId]?.endDate 
                                      ? format(new Date(agentDateFilters[selectedAgentId]?.startDate), 'dd MMM yyyy')
                                      : `${format(new Date(agentDateFilters[selectedAgentId]?.startDate), 'dd MMM')} - ${format(new Date(agentDateFilters[selectedAgentId]?.endDate), 'dd MMM yyyy')}`
                                    }
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Date Filter */}
                      <div className="px-6 py-4 bg-white border-b-2 border-slate-200">
                        <div className="flex flex-wrap items-end gap-4">
                          <div className="flex-1 min-w-[320px]">
                            <DateRangePicker
                              startDate={agentDateFilters[selectedAgentId]?.startDate || getTodayDate()}
                              endDate={agentDateFilters[selectedAgentId]?.endDate || getTodayDate()}
                              onStartDateChange={(dateValue) => handleAgentStartDateChange(selectedAgentId, dateValue)}
                              onEndDateChange={(dateValue) => handleAgentEndDateChange(selectedAgentId, dateValue)}
                              label="Filter by Date Range"
                              description={null}
                              showClearButton={false}
                              compact={true}
                              noWrapper={true}
                            />
                          </div>
                          <button
                            onClick={() => handleResetAgentFilters(selectedAgentId)}
                            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md hover:shadow-xl transition-all duration-300 group"
                            type="button"
                          >
                            <RotateCcw className="w-4 h-4 group-hover:rotate-[-360deg] transition-transform duration-500" />
                            <span>Reset to Today</span>
                          </button>
                        </div>
                      </div>

                      {/* Files Table */}
                      <div className="flex-1 overflow-y-auto p-6">
                        {trackers.length > 0 ? (
                          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-slate-200">
                            <div className="overflow-x-auto">
                              <table className="min-w-full">
                                <thead className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 sticky top-0">
                                  <tr>
                                    <th className="px-6 py-4 font-bold text-white text-xs uppercase tracking-wider text-left">
                                      <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                        Date & Time
                                      </div>
                                    </th>
                                    <th className="px-6 py-4 font-bold text-white text-xs uppercase tracking-wider text-left">
                                      <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                        Project
                                      </div>
                                    </th>
                                    <th className="px-6 py-4 font-bold text-white text-xs uppercase tracking-wider text-left">
                                      <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                        Task
                                      </div>
                                    </th>
                                    <th className="px-6 py-4 font-bold text-white text-xs uppercase tracking-wider text-center">
                                      <div className="flex items-center justify-center gap-2">
                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                        File
                                      </div>
                                    </th>
                                    <th className="px-6 py-4 font-bold text-white text-xs uppercase tracking-wider text-center">
                                      <div className="flex items-center justify-center gap-2">
                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                        Action
                                      </div>
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {trackers.map((tracker, index) => (
                                    <tr
                                      key={tracker.tracker_id || index}
                                      className={`transition-all duration-200 group ${
                                        index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                                      } hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50`}
                                    >
                                      <td className="px-6 py-4 align-middle">
                                        <div className="flex items-center gap-3">
                                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-sm">
                                            <FileText className="w-5 h-5 text-blue-600" />
                                          </div>
                                          <div>
                                            {tracker.date_time ? (() => {
                                              const date = new Date(tracker.date_time);
                                              const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                              const day = date.getUTCDate();
                                              const month = monthNames[date.getUTCMonth()];
                                              const year = date.getUTCFullYear();
                                              let hours = date.getUTCHours();
                                              const minutes = String(date.getUTCMinutes()).padStart(2, '0');
                                              const ampm = hours >= 12 ? 'PM' : 'AM';
                                              hours = hours % 12 || 12;
                                              return (
                                                <>
                                                  <div className="font-bold text-slate-900 text-sm">{day} {month} {year}</div>
                                                  <div className="text-xs text-slate-500 font-medium mt-0.5">
                                                    <span className="bg-slate-100 px-2 py-0.5 rounded">
                                                      {hours}:{minutes} {ampm}
                                                    </span>
                                                  </div>
                                                </>
                                              );
                                            })() : (
                                              <span className="text-slate-400">—</span>
                                            )}
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 align-middle">
                                        <div className="inline-flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100">
                                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                          <span className="font-bold text-blue-700 text-sm">
                                            {tracker.project_name || "—"}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 align-middle">
                                        <span className="text-slate-700 font-medium text-sm">
                                          {tracker.task_name || "—"}
                                        </span>
                                      </td>
                                      <td className="px-6 py-4 align-middle text-center">
                                        {tracker.tracker_file ? (
                                          <a
                                            href={tracker.tracker_file}
                                            download
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center justify-center w-12 h-12 text-green-600 hover:text-white bg-green-50 hover:bg-gradient-to-br hover:from-green-600 hover:to-emerald-600 transition-all duration-300 rounded-xl shadow-sm hover:shadow-lg group/download"
                                            title="Download file"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <Download className="w-5 h-5 group-hover/download:scale-110 transition-transform" />
                                          </a>
                                        ) : (
                                          <span className="text-slate-300 text-sm">No file</span>
                                        )}
                                      </td>
                                      <td className="px-6 py-4 align-middle text-center">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleQCForm(tracker);
                                          }}
                                          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-700 hover:via-indigo-700 hover:to-blue-700 text-white text-sm font-bold rounded-xl transition-all duration-300 shadow-md hover:shadow-xl transform hover:scale-105 group/btn"
                                        >
                                          <FileCheck className="w-4 h-4 group-hover/btn:rotate-12 transition-transform" />
                                          <span>QC Form</span>
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-16 h-full flex items-center justify-center">
                            <div className="text-center max-w-md">
                              <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <FileText className="w-10 h-10 text-slate-400" />
                              </div>
                              <h3 className="text-lg font-bold text-slate-700 mb-2">No Files Found</h3>
                              <p className="text-slate-500 text-sm">
                                No tracker files available for this agent in the selected date range. Try adjusting the date filter.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })() : (
                  <div className="h-full flex items-center justify-center p-16">
                    <div className="text-center">
                      <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <UsersIcon className="w-12 h-12 text-blue-600" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-2">Select an Agent</h3>
                      <p className="text-slate-600 text-sm">Choose an agent from the sidebar to view their files</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        </>
        )}

        {/* QC Form Report Tab */}
        {activeTab === 'qc_report' && (
          <QCFormReportView />
        )}

        {/* Loader spinner style */}
        <style>{`
          .loader {
            border: 4px solid #e0e7ef;
            border-top: 4px solid #2563eb;
            border-radius: 50%;
            width: 36px;
            height: 36px;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}

export default QAAgentList;
