import React from "react";
import { Trash2, X } from "lucide-react";

const DeleteProjectModal = ({
     project,
     onClose,
     onConfirm,
     isDeleting
}) => {
     if (!project) return null;

     return (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
               <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 animate-fade-in">

                    {/* Header */}
                    <div className="flex justify-between items-center mb-4">
                         <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                              <Trash2 className="w-5 h-5 text-red-600" />
                              Delete Project
                         </h2>
                         <button onClick={onClose}>
                              <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
                         </button>
                    </div>

                    {/* Body */}
                    <p className="text-sm text-slate-600">
                         Are you sure you want to delete
                         <span className="font-semibold text-slate-800">
                              {" "} {project.name}
                         </span>
                         ?
                    </p>

                    <p className="text-xs text-red-500 mt-2">
                         This action cannot be undone. All tasks associated with this project will also be deleted.
                    </p>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 mt-6">
                         <button
                              onClick={onClose}
                              disabled={isDeleting}
                              className="px-4 py-2 text-sm rounded border hover:bg-slate-50 disabled:opacity-50"
                         >
                              Cancel
                         </button>

                         <button
                              onClick={onConfirm}
                              disabled={isDeleting}
                              className="px-4 py-2 text-sm rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                         >
                              {isDeleting ? "Deleting..." : "Delete"}
                         </button>
                    </div>
               </div>
          </div>
     );
};

export default DeleteProjectModal;
