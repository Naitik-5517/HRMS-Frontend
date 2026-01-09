import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import AddProjectFormModal from './AddProjectFormModal';

const AddProjectForm = ({
     newProject,
     potentialOwners = [],
     potentialAPMs = [],
     potentialQAs = [],
     onFieldChange,
     onSubmit,
     onUpdateSubmit,
     projectManagers = [],
     assistantManagers = [],
     qaManagers = [],
     teams = [],
     loadDropdowns,
     formErrors = {},
     clearFieldError,
     projectFiles = [],
     handleProjectFilesChange,
     handleRemoveProjectFile,
     isSubmitting = false,
     handleModalClose,
     isEditMode = false,
     showEditModal = false,
     closeEditModal,
     dropdownLoading = false
}) => {
     const [showModal, setShowModal] = useState(false);

     // Open edit modal when edit mode changes, only if dropdowns are loaded and not empty
     useEffect(() => {
          const openEditModalWithData = async () => {
               if (showEditModal) {
                    await loadDropdowns();
                    setShowModal(true);
               }
          };
          openEditModalWithData();
     }, [showEditModal, loadDropdowns]);

     const openModal = async () => {
          await loadDropdowns(); // 🔥 API CALL HERE
          setShowModal(true);
     };

     const handleCloseModal = async () => {
          await handleModalClose();
          setShowModal(false);
          if (closeEditModal) {
               closeEditModal();
          }
     };

     const handleSubmit = async () => {
          const successSubmit = isEditMode ? onUpdateSubmit : onSubmit;
          const success = await successSubmit();
          if (success) {
               setShowModal(false);
          }
     };

     return (
          <>
               {!isEditMode && (
                    <div className="flex flex-col md:flex-row gap-2 bg-slate-50 p-4 rounded-lg border border-slate-200">
                         <div className="flex-1">
                              <label className="block text-xs font-bold text-slate-500 mb-1">PROJECT NAME</label>
                              <input
                                   type="text"
                                   placeholder="e.g. MoveEasy"
                                   value={newProject.name}
                                   onChange={e => onFieldChange('name', e.target.value)}
                                   className="w-full p-2 border rounded-lg text-sm outline-none focus:border-blue-500"
                              />
                         </div>
                         <div className="w-full md:w-32">
                              <label className="block text-xs font-bold text-slate-500 mb-1">TEAM OWNER</label>
                              <select
                                   value={newProject.teamOwner}
                                   onChange={e => onFieldChange('teamOwner', e.target.value)}
                                   className="w-full p-2 border rounded-lg text-sm outline-none focus:border-blue-500 bg-white shadow-sm hover:border-blue-400 transition-colors font-semibold text-blue-700"
                              >
                                   <option value="" className="text-slate-400">Select PM</option>
                                   {potentialOwners.map(u => (
                                        <option key={u.id} value={u.name} className="text-blue-700 font-semibold hover:bg-blue-50">{u.name}</option>
                                   ))}
                              </select>
                         </div>
                         <div className="w-full md:w-32">
                              <label className="block text-xs font-bold text-slate-500 mb-1">APM</label>
                              <select
                                   value={newProject.apmOwner}
                                   onChange={e => onFieldChange('apmOwner', e.target.value)}
                                   className="w-full p-2 border rounded-lg text-sm outline-none focus:border-blue-500 bg-white shadow-sm hover:border-blue-400 transition-colors font-semibold text-blue-700"
                              >
                                   <option value="" className="text-slate-400">Select APM</option>
                                   {potentialAPMs.map(u => (
                                        <option key={u.id} value={u.name} className="text-blue-700 font-semibold hover:bg-blue-50">{u.name}</option>
                                   ))}
                              </select>
                         </div>
                         <div className="w-full md:w-32">
                              <label className="block text-xs font-bold text-slate-500 mb-1">QA</label>
                              <select
                                   value={newProject.qaOwner}
                                   onChange={e => onFieldChange('qaOwner', e.target.value)}
                                   className="w-full p-2 border rounded-lg text-sm outline-none focus:border-blue-500 bg-white shadow-sm hover:border-blue-400 transition-colors font-semibold text-blue-700"
                              >
                                   <option value="" className="text-slate-400">Select QA</option>
                                   {potentialQAs.map(u => (
                                        <option key={u.id} value={u.name} className="text-blue-700 font-semibold hover:bg-blue-50">{u.name}</option>
                                   ))}
                              </select>
                         </div>
                         <div className="flex items-end">
                              <button
                                   onClick={openModal}
                                   className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center justify-center gap-2 h-10"
                              >
                                   <Plus className="w-4 h-4" /> Add
                              </button>
                         </div>
                    </div>
               )}

               {showModal && (
                    dropdownLoading ? (
                         <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
                              <div className="bg-white rounded-xl shadow-2xl p-8 flex flex-col items-center">
                                   <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                                   <span className="text-blue-700 font-semibold">Loading project data...</span>
                              </div>
                         </div>
                    ) :
                    (Array.isArray(projectManagers) && projectManagers.length > 0 &&
                     Array.isArray(assistantManagers) && assistantManagers.length > 0 &&
                     Array.isArray(qaManagers) && qaManagers.length > 0 &&
                     Array.isArray(teams) && teams.length > 0 ? (
                         <AddProjectFormModal
                              newProject={newProject}
                              onFieldChange={onFieldChange}
                              onSubmit={handleSubmit}
                              onClose={handleCloseModal}
                              projectManagers={projectManagers}
                              assistantManagers={assistantManagers}
                              qaManagers={qaManagers}
                              teams={teams}
                              formErrors={formErrors}
                              clearFieldError={clearFieldError}
                              isSubmitting={isSubmitting}
                              projectFiles={projectFiles}
                              handleProjectFilesChange={handleProjectFilesChange}
                              handleRemoveProjectFile={handleRemoveProjectFile}
                              isEditMode={isEditMode}
                         />
                     ) : (
                         <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
                              <div className="bg-white rounded-xl shadow-2xl p-8 flex flex-col items-center">
                                   <span className="text-red-700 font-semibold mb-2">Failed to load required dropdown data.</span>
                                   <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg" onClick={handleCloseModal}>Close</button>
                              </div>
                         </div>
                     ))
               )}
          </>
     );
};

export default AddProjectForm;