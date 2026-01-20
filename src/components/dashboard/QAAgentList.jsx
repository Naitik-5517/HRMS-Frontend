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
  // Removed loadingTrackers state (no longer needed)


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

        // 2. Fetch tracker data after mapping is ready
        const trackerRes = await api.post("/tracker/view", {
          logged_in_user_id: user?.user_id
        });
        const trackerData = trackerRes.data?.data || {};
        const allTrackers = trackerData.trackers || [];
        let myTrackers = allTrackers;
        if (myTrackers.some(t => t.qa_agent_id !== undefined)) {
          myTrackers = myTrackers.filter(t => String(t.qa_agent_id) === String(user?.user_id));
        }
        // Build agents list directly from filtered tracker data
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
        // Build trackers by agent (enrich with project/task names)
        let trackersByAgent = {};
        allAgents.forEach(agent => {
          trackersByAgent[agent.user_id] = myTrackers
            .filter(t => String(t.user_id) === String(agent.user_id) && t.tracker_file)
            .map(tracker => ({
              ...tracker,
              user_name: tracker.user_name || agent.user_name || '-',
              project_name: tracker.project_name || pMap[String(tracker.project_id)] || '-',
              task_name: tracker.task_name || tMap[String(tracker.task_id)] || '-',
            }));
        });
        setAgents(allAgents);
        setAgentTrackers(trackersByAgent);
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

  // Toggle agent card expansion (no async tracker fetch needed)
  const toggleAgent = (agentId) => {
    const isExpanding = !expandedAgents[agentId];
    setExpandedAgents(prev => ({
      ...prev,
      [agentId]: isExpanding
    }));
  };

  // Handle QC Form action
  const handleQCForm = (tracker) => {
    log('[QAAgentList] Opening QC Form for tracker:', tracker.tracker_id);
    // TODO: Implement QC Form modal or navigation
    toast.success("QC Form functionality coming soon!");
  };

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-blue-700 tracking-tight">Agent File Report</h2>
      </div>
      <div>
        {loading ? (
          <div className="text-center py-8 text-blue-600 font-semibold">Loading...</div>
        ) : agents.length === 0 ? (
          <div className="text-center py-8 text-slate-500">No agent data found.</div>
        ) : (
          <div className="space-y-4">
            {agents.map((agent) => {
              const trackers = agentTrackers[agent.user_id] || [];
              return (
                <div key={agent.user_id} className="mb-8 border rounded-lg shadow-sm bg-white">
                  <div className="flex items-center justify-between px-6 py-4 cursor-pointer select-none border-b bg-slate-50" onClick={() => toggleAgent(agent.user_id)}>
                    <div className="flex items-center gap-2">
                      <UsersIcon className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-blue-700 text-lg">{agent.user_name}</span>
                    </div>
                    <div>
                      {expandedAgents[agent.user_id] ? <ChevronUp /> : <ChevronDown />}
                    </div>
                  </div>
                  {expandedAgents[agent.user_id] && (
                    <div className="p-6">
                      {trackers.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                              <tr>
                                <th className="px-4 py-3 text-left font-semibold text-slate-700">Date/Time</th>
                                <th className="px-4 py-3 text-left font-semibold text-slate-700">Agent Name</th>
                                <th className="px-4 py-3 text-left font-semibold text-slate-700">Project Name</th>
                                <th className="px-4 py-3 text-left font-semibold text-slate-700">Task Name</th>
                                <th className="px-4 py-3 text-center font-semibold text-slate-700">File</th>
                                <th className="px-4 py-3 text-center font-semibold text-slate-700">Action</th>
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
                      ) : (
                        <div className="text-center text-slate-400">No tracker data for this agent.</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default QAAgentList;
