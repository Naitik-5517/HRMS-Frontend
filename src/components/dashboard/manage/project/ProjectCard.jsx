import React from 'react';
import { Edit, Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import TaskTable from './TaskTable';
import EditTaskModal from './EditTaskModal';
import TasksModal from './TasksModal';

const ProjectCard = ({
  project,
  readOnly,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  openEditModal,
  openDeleteModal,
  expanded,
  setExpanded
}) => {
  const [editTaskModal, setEditTaskModal] = React.useState({ open: false, task: null });
  const [showTasksModal, setShowTasksModal] = React.useState(false);
  const [taskTableRefresh, setTaskTableRefresh] = React.useState(Date.now());

  return (
    <>
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center">
          {/* Left: Project name, icon, and actions */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-slate-200 rounded-md">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4 text-slate-700"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7V6a2 2 0 012-2h14a2 2 0 012 2v1M3 7h18M3 7v11a2 2 0 002 2h14a2 2 0 002-2V7M9 17h6" /></svg>
            </div>
            <h1 className="text-sm font-bold text-slate-800 truncate">{project.name}</h1>
            <div className="flex items-center gap-2 ml-4">
              {/* Download Project File Button */}
              <button
                onClick={async () => {
                  try {
                    // Use project.project_file from API response
                    const filePath = project.project_file;
                    if (!filePath || filePath === 'null') {
                      toast.error('No file available for this project.');
                      return;
                    }
                    // Extract file name from path
                    const fileName = filePath.split(/[\\/]/).filter(Boolean).pop() || 'project-file';
                    // Backend endpoint to serve file (adjust as needed)
                    const response = await axios.get(`/project/file?path=${encodeURIComponent(filePath)}`, {
                      responseType: 'blob',
                    });
                    const url = window.URL.createObjectURL(new Blob([response.data]));
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', fileName);
                    document.body.appendChild(link);
                    link.click();
                    link.parentNode.removeChild(link);
                  } catch (err) {
                    toast.error('Failed to download file.');
                  }
                }}
                className="p-0 bg-transparent focus:outline-none group"
                title="Download Project File"
                aria-label="Download Project File"
                style={{
                  borderRadius: '9999px',
                  background: 'linear-gradient(90deg, #e0e7ff 0%, #bae6fd 100%)',
                  boxShadow: '0 2px 8px 0 rgba(59,130,246,0.08)',
                  marginRight: '2px',
                  transition: 'background 0.2s, box-shadow 0.2s',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseOver={e => {
                  e.currentTarget.style.background = 'linear-gradient(90deg, #2563eb 0%, #38bdf8 100%)';
                  e.currentTarget.style.boxShadow = '0 4px 16px 0 rgba(59,130,246,0.16)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.background = 'linear-gradient(90deg, #e0e7ff 0%, #bae6fd 100%)';
                  e.currentTarget.style.boxShadow = '0 2px 8px 0 rgba(59,130,246,0.08)';
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-download w-5 h-5" aria-hidden="true" style={{transition: 'color 0.2s'}}><path d="M12 15V3"></path><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><path d="m7 10 5 5 5-5"></path></svg>
              </button>
              <button
                onClick={() => openEditModal(project)}
                className="p-0 bg-transparent hover:bg-transparent focus:outline-none"
                title="Edit Project"
                aria-label="Edit Project"
              >
                <Edit
                  className="w-6 h-6 text-blue-500 bg-blue-100 bg-opacity-40 rounded-full p-1 transition-colors duration-200 hover:text-white hover:bg-blue-500 hover:bg-opacity-100"
                />
              </button>
              <button
                onClick={() => openDeleteModal(project)}
                className="p-0 bg-transparent hover:bg-transparent focus:outline-none"
                title="Delete Project"
                aria-label="Delete Project"
              >
                <Trash2
                  className="w-6 h-6 text-red-500 bg-red-100 bg-opacity-40 rounded-full p-1 transition-colors duration-200 hover:text-white hover:bg-red-500 hover:bg-opacity-100"
                />
              </button>
               <button
                 onClick={() => setShowTasksModal(true)}
                 className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition"
                 title="Create Task"
               >
                 <Plus className="w-4 h-4" />
                 Create Task
               </button>
            </div>
          </div>
          {/* Right side: Arrow button to hide/show task list */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="ml-auto p-2 rounded-full hover:bg-slate-200 transition"
            title={expanded ? 'Collapse' : 'Expand'}
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
        {expanded && (
          <div className="px-4 py-3">
            <TaskTable
              project={project}
              readOnly={readOnly}
              onAddTask={onAddTask}
              onEditTask={(projectId, taskId, taskObj) => {
                setEditTaskModal({ open: true, task: taskObj });
              }}
              onTaskUpdated={() => setTaskTableRefresh(Date.now())}
              onDeleteTask={(projectId, taskId) => {
                if (onDeleteTask) onDeleteTask(projectId, taskId);
                setTaskTableRefresh(Date.now());
              }}
              refresh={taskTableRefresh}
            />
          </div>
        )}
      </div>

      {editTaskModal.open && (
        <EditTaskModal
          open={editTaskModal.open}
          onClose={() => setEditTaskModal({ open: false, task: null })}
          task={editTaskModal.task}
          projectId={project.id}
          onTaskUpdated={() => {
            onUpdateTask && onUpdateTask();
            setTaskTableRefresh(Date.now());
            setEditTaskModal({ open: false, task: null });
          }}
        />
      )}

      {showTasksModal && (
        <TasksModal
          project={project}
          onClose={() => setShowTasksModal(false)}
          onAddTask={(newTask) => {
            onAddTask && onAddTask(project.id, newTask);
            setTaskTableRefresh(Date.now());
            setShowTasksModal(false);
          }}
          onUpdateTask={(taskId, updatedTask) => {
            onUpdateTask && onUpdateTask(project.id, taskId, updatedTask);
            setTaskTableRefresh(Date.now());
          }}
          onDeleteTask={(taskId) => {
            onDeleteTask && onDeleteTask(project.id, taskId);
            setTaskTableRefresh(Date.now());
          }}
          readOnly={readOnly}
        />
      )}
    </>
  );
};



export default ProjectCard;