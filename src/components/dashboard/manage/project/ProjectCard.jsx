import React from 'react';
import { Edit, Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-react';
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