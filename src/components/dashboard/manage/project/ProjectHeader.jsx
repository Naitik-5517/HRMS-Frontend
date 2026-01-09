import React from 'react';
import { Edit, Trash2, Plus, Briefcase } from 'lucide-react';

const ProjectHeader = ({ project, readOnly = false, openEditModal, openDeleteModal, onOpenTasksModal }) => {

     // These handlers will be implemented later
     const handleEdit = async () => {
          await openEditModal(project); 
     };

     const handleDelete = () => {
          openDeleteModal(project);
     };

     const handleCreateTask = () => {
          onOpenTasksModal();
     };

     return (
          <div className="bg-slate-50 px-2 flex flex-row justify-between items-center gap-3">

               {/* Left: Project icon + name */}
               <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 bg-slate-200 rounded-md">
                         <Briefcase className="w-4 h-4 text-slate-700" />
                    </div>

                    <div className="min-w-0">
                         <h1 className="text-sm font-bold text-slate-800 truncate">
                              {project.name}
                         </h1>
                    </div>
               </div>

               {/* Right: Actions */}
               <div className="flex items-center gap-2 shrink-0">
                    <button
                         onClick={handleEdit}
                         className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-100 rounded-md transition"
                         title="Edit"
                    >
                         <Edit className="w-4 h-4" />
                    </button>

                    <button
                         onClick={handleDelete}
                         className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-100 rounded-md transition"
                         title="Delete"
                    >
                         <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                         onClick={handleCreateTask}
                         className="flex items-center gap-1 px-3 py-1.5
                 bg-blue-600 hover:bg-blue-700 text-white
                 text-xs font-medium rounded-md transition"
                    >
                         <Plus className="w-3.5 h-3.5" />
                         <span>Create Task</span>
                    </button>
               </div>
          </div>
     );
};

export default ProjectHeader;