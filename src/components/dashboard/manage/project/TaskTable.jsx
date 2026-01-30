import React, { useEffect, useState, useRef } from 'react';
import { fetchProjectTasks } from '../../../../services/projectService';
import { Edit, Trash2 } from 'lucide-react';
import DeleteTaskModal from './DeleteTaskModal'; // Adjust the import path as necessary

const ROW_HEIGHT = 48; // px, adjust if your row height is different
const VISIBLE_ROWS = 5;

const TaskTable = ({ project, readOnly, onDeleteTask, onEditTask, onTaskUpdated, refresh }) => {
  const [tasks, setTasks] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ open: false, task: null });
  const tableBodyRef = useRef(null);

  useEffect(() => {
    if (!project?.id) {
      return;
    }
    fetchProjectTasks(project.id)
      .then(res => {
        const allTasks = Array.isArray(res.data) ? res.data : [];
        const filtered = allTasks.filter(task => String(task.project_id) === String(project.id));
        setTasks(filtered);
      })
      .catch(() => {
        setTasks([]);
      });
  }, [project?.id, typeof refresh === 'undefined' ? null : refresh]);

  return (
    <div>
      {/* Delete confirmation modal */}
      {deleteModal.open && (
        <DeleteTaskModal
          task={deleteModal.task}
          onClose={() => setDeleteModal({ open: false, task: null })}
          onConfirm={() => {
            onDeleteTask(project.id, deleteModal.task.id || deleteModal.task.task_id);
            setDeleteModal({ open: false, task: null });
          }}
          isDeleting={false}
        />
      )}
      <div
        className="mb-4"
        style={{
          maxHeight: `${ROW_HEIGHT * VISIBLE_ROWS}px`,
          overflowY: 'auto',
        }}
      >
        <table className="w-full text-sm table-fixed">
          <colgroup>
            <col style={{ width: '28%' }} />
            <col style={{ width: '16%' }} />
            <col style={{ width: '40%' }} />
            <col style={{ width: '16%' }} />
          </colgroup>
          <thead>
            <tr className="text-xs text-slate-500 border-b border-slate-100">
              <th className="text-left py-2 px-3">Task Name</th>
              <th className="text-left py-2 px-3">Target / Hr</th>
              <th className="text-left py-2 px-3">Task Description</th>
              <th className="text-center py-2 px-3"><span className="block text-center w-full">Action</span></th>
            </tr>
          </thead>
          <tbody ref={tableBodyRef}>
            {tasks.map((t, idx) => {
              const key = t.id || t.task_id || idx;
              const taskName = t.name || t.task_name || '';
              const taskTarget = t.targetPerHour || t.task_target || '';
              const taskDescription = t.description || t.task_description || '-';
              const taskId = t.id || t.task_id;
              return (
                <tr key={key} className="group hover:bg-slate-50">
                  <td className="py-2 px-3 text-slate-800 font-medium truncate align-middle">{taskName}</td>
                  <td className="py-2 px-3 text-left font-mono text-blue-600 align-middle">{taskTarget}</td>
                  <td className="py-2 px-3 text-left text-slate-600 align-middle wrap-break-word max-w-xs">{taskDescription}</td>
                  <td className="py-2 px-3 text-center align-middle">
                    {!readOnly && (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onEditTask && onEditTask(project.id, taskId, t)}
                          className="p-0 bg-transparent hover:bg-transparent focus:outline-none"
                          title="Edit Task"
                          aria-label="Edit Task"
                        >
                          <Edit
                            className="w-6 h-6 text-blue-500 bg-blue-100 bg-opacity-40 rounded-full p-1 transition-colors duration-200 hover:text-white hover:bg-blue-500 hover:bg-opacity-100"
                          />
                        </button>
                        <button
                          onClick={() => setDeleteModal({ open: true, task: t })}
                          className="p-0 bg-transparent hover:bg-transparent focus:outline-none"
                          title="Delete Task"
                          aria-label="Delete Task"
                        >
                          <Trash2
                            className="w-6 h-6 text-red-500 bg-red-100 bg-opacity-40 rounded-full p-1 transition-colors duration-200 hover:text-white hover:bg-red-500 hover:bg-opacity-100"
                          />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TaskTable;