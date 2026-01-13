/**
 * File: QAAgentList.jsx
 * Author: Naitik Maisuriya
 * Description: QA Agent List - Shows assigned agents with their tracker data (files only)
 */
import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { ChevronDown, ChevronUp, Download, FileText, Users as UsersIcon } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { log, logError } from "../../config/environment";

const QAAgentList = () => {
  const { user } = useAuth();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedAgents, setExpandedAgents] = useState({});
  const [agentTrackers, setAgentTrackers] = useState({});
  const [loadingTrackers, setLoadingTrackers] = useState({});

  // Fetch assigned agents on mount
  useEffect(() => {
    const fetchAssignedAgents = async () => {
      try {
        setLoading(true);
        log('[QAAgentList] Fetching assigned agents');
        
        // TODO: Replace with your actual API endpoint
        // const res = await api.post("/qa/assigned-agents", {
        //   qa_id: user?.user_id,
        //   device_id: user?.device_id || 'web123',
        //   device_type: user?.device_type || 'web'
        // });
        
        // For now, using mock data - replace with actual API call
        const mockAgents = [
          { user_id: 82, user_name: "John Doe" },
          { user_id: 83, user_name: "Jane Smith" },
          { user_id: 84, user_name: "Mike Johnson" }
        ];
        
        setAgents(mockAgents);
        log('[QAAgentList] Assigned agents loaded:', mockAgents.length);
      } catch (err) {
        logError('[QAAgentList] Error fetching assigned agents:', err);
        toast.error("Failed to load assigned agents");
        setAgents([]);
      } finally {
        setLoading(false);
      }
    };

    if (user?.user_id) {
      fetchAssignedAgents();
    }
  }, [user?.user_id]);

  // Toggle agent card expansion
  const toggleAgent = async (agentId) => {
    const isExpanding = !expandedAgents[agentId];
    
    setExpandedAgents(prev => ({
      ...prev,
      [agentId]: isExpanding
    }));

    // Fetch tracker data if expanding and not already loaded
    if (isExpanding && !agentTrackers[agentId]) {
      await fetchAgentTrackers(agentId);
    }
  };

  // Fetch tracker data for a specific agent (only entries with files)
  const fetchAgentTrackers = async (agentId) => {
    try {
      setLoadingTrackers(prev => ({ ...prev, [agentId]: true }));
      log('[QAAgentList] Fetching trackers for agent:', agentId);
      
      // TODO: Replace with your actual API endpoint
      // const res = await api.post("/qa/agent-trackers", {
      //   qa_id: user?.user_id,
      //   user_id: agentId,
      //   has_file: true, // Only fetch trackers with files
      //   device_id: user?.device_id || 'web123',
      //   device_type: user?.device_type || 'web'
      // });
      
      // For now, using mock data - replace with actual API call
      const mockTrackers = [];
      
      setAgentTrackers(prev => ({
        ...prev,
        [agentId]: mockTrackers
      }));
      log('[QAAgentList] Trackers loaded for agent:', agentId, mockTrackers.length);
    } catch (err) {
      logError('[QAAgentList] Error fetching trackers:', err);
      toast.error("Failed to load tracker data");
      setAgentTrackers(prev => ({
        ...prev,
        [agentId]: []
      }));
    } finally {
      setLoadingTrackers(prev => ({ ...prev, [agentId]: false }));
    }
  };

  // Handle QC Form action
  const handleQCForm = (tracker) => {
    log('[QAAgentList] Opening QC Form for tracker:', tracker.tracker_id);
    // TODO: Implement QC Form modal or navigation
    toast.success("QC Form functionality coming soon!");
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <UsersIcon className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-slate-800">Agent List</h2>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-gray-500">Loading agents...</span>
          </div>
        </div>
      ) : agents.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 text-center">
          <UsersIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No assigned agents found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {agents.map((agent) => {
            const isExpanded = expandedAgents[agent.user_id];
            const trackers = agentTrackers[agent.user_id] || [];
            const isLoadingTrackers = loadingTrackers[agent.user_id];

            return (
              <div
                key={agent.user_id}
                className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden"
              >
                {/* Agent Card Header */}
                <div
                  onClick={() => toggleAgent(agent.user_id)}
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-700 font-bold text-sm">
                        {agent.user_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-800">
                        {agent.user_name}
                      </h3>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-600" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-600" />
                    )}
                  </button>
                </div>

                {/* Expanded Content - Tracker Table */}
                {isExpanded && (
                  <div className="border-t border-slate-200">
                    {isLoadingTrackers ? (
                      <div className="flex justify-center items-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          <span className="text-gray-500 text-sm">Loading tracker data...</span>
                        </div>
                      </div>
                    ) : trackers.length === 0 ? (
                      <div className="p-6 text-center">
                        <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">No tracker data with files found</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                              <th className="px-4 py-3 text-left font-semibold text-slate-700">
                                Date/Time
                              </th>
                              <th className="px-4 py-3 text-left font-semibold text-slate-700">
                                Agent Name
                              </th>
                              <th className="px-4 py-3 text-left font-semibold text-slate-700">
                                Project Name
                              </th>
                              <th className="px-4 py-3 text-left font-semibold text-slate-700">
                                Task Name
                              </th>
                              <th className="px-4 py-3 text-center font-semibold text-slate-700">
                                File
                              </th>
                              <th className="px-4 py-3 text-center font-semibold text-slate-700">
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {trackers.map((tracker, index) => (
                              <tr
                                key={tracker.tracker_id || index}
                                className="border-b border-slate-100 hover:bg-blue-50 transition-colors"
                              >
                                <td className="px-4 py-3 text-slate-700">
                                  {tracker.date_time
                                    ? format(new Date(tracker.date_time), "M/d/yyyy h:mma")
                                    : "-"}
                                </td>
                                <td className="px-4 py-3 text-slate-700 font-medium">
                                  {tracker.user_name || agent.user_name}
                                </td>
                                <td className="px-4 py-3 text-slate-700">
                                  {tracker.project_name || "-"}
                                </td>
                                <td className="px-4 py-3 text-slate-700">
                                  {tracker.task_name || "-"}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {tracker.tracker_file ? (
                                    <a
                                      href={tracker.tracker_file}
                                      download
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center justify-center text-blue-600 hover:text-blue-800 transition-colors"
                                      title="Download file"
                                    >
                                      <Download className="w-5 h-5" />
                                    </a>
                                  ) : (
                                    <span className="text-slate-400">—</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <button
                                    onClick={() => handleQCForm(tracker)}
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 mx-auto"
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                    QC Form
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default QAAgentList;
