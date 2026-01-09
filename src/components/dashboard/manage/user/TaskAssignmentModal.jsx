import React from "react";
import { Briefcase, X, CheckSquare, Square } from "lucide-react";

const TaskAssignmentModal = ({
  assigningUser,
  projects,
  newUser,
  onToggleTaskAssignment,
  onToggleNewUserTask,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in-up">
        <div className="p-4 bg-blue-800 text-white flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-300" />
              Assign Tasks
            </h2>
            <p className="text-blue-200 text-xs">
              For Agent:{" "}
              <strong>
                {assigningUser
                  ? assigningUser.name
                  : newUser.name || "New User"}
              </strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((proj) => (
              <div
                key={proj.id}
                className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm"
              >
                <div className="bg-slate-100 px-3 py-2 border-b border-slate-200 font-bold text-slate-700 text-sm">
                  {proj.name}
                </div>
                <div className="p-2 space-y-1">
                  {proj.tasks.length > 0 ? (
                    proj.tasks.map((task) => {
                      const currentAssignedTasks = assigningUser
                        ? assigningUser.assignedTasks || []
                        : newUser.assignedTasks || [];

                      const isAssigned = currentAssignedTasks.some(
                        (a) => a.projectId === proj.id && a.taskId === task.id
                      );

                      return (
                        <div
                          key={task.id}
                          onClick={() => {
                            if (assigningUser) {
                              onToggleTaskAssignment(proj.id, task.id);
                            } else {
                              onToggleNewUserTask(proj.id, task.id);
                            }
                          }}
                          className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-sm transition-colors ${
                            isAssigned
                              ? "bg-blue-50 text-blue-700"
                              : "hover:bg-slate-50 text-slate-600"
                          }`}
                        >
                          {isAssigned ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300" />
                          )}
                          <span className={isAssigned ? "font-medium" : ""}>
                            {task.name}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-xs text-slate-400 italic px-2">
                      No tasks
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 bg-white flex justify-end">
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold text-sm transition-colors w-full md:w-auto"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskAssignmentModal;