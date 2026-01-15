import React, { useState, useMemo, useEffect } from "react";
import { UserPlus, Key } from "lucide-react";
import { useAuth } from "../../../../context/AuthContext";
import AddUserFormModal from "./AddUserFormModal";
import EditUserFormModal from "./EditUserFormModal";
import UsersTable from "./UsersTable";
import TaskAssignmentModal from "./TaskAssignmentModal";
import { addUser, updateUser } from "../../../../services/authService";
import { toast } from "react-hot-toast";
import { useUserDropdowns } from "../../../../hooks/useUserDropdowns";
import { useDeviceInfo } from "../../../../hooks/useDeviceInfo";
import DeleteUserModal from "./DeleteUserModal";
import { deleteUser } from "../../../../services/authService";
import { fileToBase64 } from "../../../../utils/fileToBase64";
import LoadingSpinner from "../../../common/LoadingSpinner";
import ErrorMessage from "../../../common/ErrorMessage";
import config from "../../../../config/environment";
import { log, logError } from "../../../../config/environment";

const apiBaseURL = config.apiBaseUrl;

const ensureImageUrl = (value) => {
     if (!value) return null;
     const trimmed = String(value).trim();
     if (/^(data:|https?:\/\/)/i.test(trimmed)) return trimmed;
     return `${apiBaseURL}/${trimmed.replace(/^\/+/, "")}`;
};

const UsersManagement = ({
     users = [],
     projects = [],
     loading,
     onUpdateUsers,
     pendingRequests = [],
     onResolveRequest,
     loadUsers,
     readOnly = false
}) => {
     const { isSuperAdmin, user: authUser } = useAuth();
     const [assigningUser, setAssigningUser] = useState(null);
     const [isAssigningNewUser, setIsAssigningNewUser] = useState(false);
     const [showUserFormModal, setShowUserFormModal] = useState(false);
     const [editUserId, setEditUserId] = useState(null);
     // Removed editingUserId and isEditMode (update user logic)
     const [userPermissions, setUserPermissions] = useState({
          user_creation_permission: 0,
          project_creation_permission: 0,
     });
     const [formErrors, setFormErrors] = useState({});
     const [profilePreview, setProfilePreview] = useState(null);
     const [base64Image, setBase64Image] = useState(null);
     const [userToDelete, setUserToDelete] = useState(null);
     const [isDeleting, setIsDeleting] = useState(false);
     const [isSubmitting, setIsSubmitting] = useState(false);

     const {
          dropdowns,
          loading: dropdownLoading,
          loadDropdowns
     } = useUserDropdowns();

     const deviceInfo = useDeviceInfo();

     // Check permissions on component mount
     useEffect(() => {
          const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
          if (userData) {
               setUserPermissions({
                    user_creation_permission: userData.user_creation_permission || 0,
                    project_creation_permission:
                         userData.project_creation_permission || 0,
               });
          }
     }, []);

     const initialNewUserState = {
          role: "",
          password: "",
          designation: "",
          projectManager: "",
          assistantManager: "",
          qualityAnalyst: "",
          team: "",
          email: "",
          name: "",
          phone: "",
          address: "",
          tenure: "",
          profile_picture: null,
     };

     const [filterUser, setFilterUser] = useState({
          empId: "",
          name: "",
          email: "",
          reportingManager: "",
          role: "",
          assignedTasks: [],
     });

     const [newUser, setNewUser] = useState(initialNewUserState);
     // Edit user modal handlers
     const handleOpenEditUserModal = (user) => {
          console.log('[UsersManagement] Editing user:', user);
          // Set fallback for EditUserFormModal in case backend fetch fails
          if (typeof window !== 'undefined') {
               window.__frontendUserForEdit = user;
          }
          // Always pass user_id for backend API, not id
          setEditUserId(user.user_id || user.id);
     };
     const handleCloseEditUserModal = () => {
          setEditUserId(null);
     };
     // Removed editFormData (update user logic)

     const potentialManagers = useMemo(
          () =>
               users.filter(
                    (u) =>
                         [
                              "Ops Manager",
                              "Asst. Project Manager",
                              "CEO",
                              "Project Manager",
                         ].includes(u.designation || "") ||
                         u.role === "ADMIN" ||
                         u.role === "PROJECT_MANAGER"
               ),
          [users]
     );

     const filteredUsers = useMemo(() => {
          return users.filter((u) => {
               const matchesName = filterUser.name
                    ? u.name?.toLowerCase().includes(filterUser.name.toLowerCase())
                    : true;

               const matchesEmail = filterUser.email
                    ? u.email?.toLowerCase().includes(filterUser.email.toLowerCase())
                    : true;

               const managerValue = (u.project_manager_name || u.reportingManager || "").toLowerCase();
               const matchesManager = filterUser.reportingManager
                    ? managerValue.includes(filterUser.reportingManager.toLowerCase())
                    : true;

               const matchesRole = filterUser.role
                    ? (u.role || "").toUpperCase() === filterUser.role.toUpperCase()
                    : true;

               return matchesName && matchesEmail && matchesManager && matchesRole;
          });
     }, [users, filterUser]);

     const clearFieldError = (field) => {
          setFormErrors((prev) => {
               if (!prev[field]) return prev;
               const updated = { ...prev };
               delete updated[field];
               return updated;
          });
     };

     // Function to convert image to base64
     // const convertToBase64 = (file) => {
     //      return new Promise((resolve, reject) => {
     //           const reader = new FileReader();
     //           reader.readAsDataURL(file);
     //           reader.onload = () => resolve(reader.result);
     //           reader.onerror = error => reject(error);
     //      });
     // };

     // Handle profile picture change
     const handleProfilePictureChange = async (file) => {
          if (!file) return;

          // Validate file type
          const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
          if (!validTypes.includes(file.type)) {
               toast.error("Please select a valid image file (JPEG, PNG, GIF, WebP)");
               return;
          }

          // Validate file size (5MB max)
          if (file.size > 5 * 1024 * 1024) {
               toast.error("Image size should be less than 5MB");
               return;
          }

          // Create preview URL
          const previewUrl = URL.createObjectURL(file);
          setProfilePreview(previewUrl);

          // Convert to base64
          try {
               const base64 = await fileToBase64(file);
               setBase64Image(base64);
          } catch (error) {
               console.error("Error converting image to base64:", error);
               toast.error("Failed to process image");
          }
     };

     // Handle profile picture removal
     const handleRemoveProfilePicture = () => {
          if (profilePreview) {
               URL.revokeObjectURL(profilePreview); // Clean up memory
          }
          setProfilePreview(null);
          setBase64Image(null);
          setNewUser((prev) => ({ ...prev, profile_picture: null }));
     };

     // Clean up preview URLs on unmount
     useEffect(() => {
          return () => {
               if (profilePreview) {
                    URL.revokeObjectURL(profilePreview);
               }
          };
     }, [profilePreview]);

     // Updated handleAddUser function with API call
     const handleAddUser = async () => {
          const errors = {};

          if (!newUser.name?.trim()) {
               errors.name = "Please enter name";
          }

          if (!newUser.email?.trim()) {
               errors.email = "Please enter email";
          } else if (!/^\S+@\S+\.\S+$/.test(newUser.email)) {
               errors.email = "Enter a valid email address";
          }

          if (!newUser.role) {
               errors.role = "Please enter role";
          }

          if (!newUser.password?.trim()) {
               errors.password = "Please enter password";
          } else if (newUser.password.length < 6) {
               errors.password = "Password must be at least 6 characters";
          }

          // Stop here if validation fails
          if (Object.keys(errors).length > 0) {
               setFormErrors(errors);
               return;
          }

          // Clear errors if valid
          setFormErrors({});
          setIsSubmitting(true);

          // Build payload with only changed fields
          // For add user, just use newUser and base64Image
          const updatePayload = {
               user_name: newUser.name,
               user_email: newUser.email,
               user_password: newUser.password,
               role_id: newUser.role,
               designation_id: newUser.designation,  // Changed from 'designation' to 'designation_id'
               project_manager: newUser.projectManager,
               assistant_manager: newUser.assistantManager,
               qa: newUser.qualityAnalyst,
               team: newUser.team,
               user_number: newUser.phone,
               user_address: newUser.address,
               user_tenure: newUser.tenure,
               profile_picture: base64Image || newUser.profile_picture,
               device_id: deviceInfo.device_id,
               device_type: deviceInfo.device_type,
          };
          // If you want to include these fields only when changed, add them to updatePayload above as needed.


          try {
               const response = await addUser(updatePayload);

               if (response.status === 200 || response.status === 201) {
                    setShowUserFormModal(false);

                    // Show success message
                    toast.success("User created successfully!", {
                         className: "toast-success toast-animate",
                         duration: 4000,
                    });

                    // Reset form and close modal
                    setNewUser(initialNewUserState);
                    handleRemoveProfilePicture(); // Clear profile picture
                    
                    // Clear all filters to ensure new user is visible
                    setFilterUser({
                         empId: "",
                         name: "",
                         email: "",
                         reportingManager: "",
                         role: "",
                         assignedTasks: [],
                    });
                    
                    // Refresh the users list after a brief delay to ensure backend is updated
                    setTimeout(() => {
                         log('[UsersManagement] Refreshing users list after add');
                         loadUsers();
                    }, 500);
               } else {
                    throw new Error(response.message || "Failed to create user");
               }
          } catch (error) {
               console.error("Error adding user:", error);
               console.error("Full error object:", JSON.stringify(error, null, 2));
               console.error("Response status:", error.response?.status);
               console.error("Response data:", error.response?.data);
               console.error("Response headers:", error.response?.headers);
               
               // Extract error message from response
               const errorMessage = error.response?.data?.message 
                    || error.response?.data?.error 
                    || error.message 
                    || "Failed to create user";
               
               toast.error(`Error: ${errorMessage}`, {
                    className: "toast-error toast-animate",
                    duration: 6000,
               });
          } finally {
               setIsSubmitting(false);
          }
     };

     const handleCloseUserModal = () => {
          setShowUserFormModal(false);
          setFormErrors({});
          setNewUser(initialNewUserState);
          setBase64Image(null);
          setProfilePreview(null);
          handleRemoveProfilePicture();
     };

     // Open user form modal
     const openUserFormModal = async () => {
          setNewUser(initialNewUserState);
          setBase64Image(null);
          setProfilePreview(null);
          setFormErrors({});
          setShowUserFormModal(true);
          loadDropdowns();
     };

     // Removed openEditUserModal (update user logic)

     // Removed handleUpdateUser (update user logic)

     const handleDeleteUser = (targetUser) => {
          // Allow delete if: SuperAdmin OR ADMIN-like role OR explicit delete_permission = 1
          const authRoleCandidates = [
               String(authUser?.role || ""),
               String(authUser?.role_name || ""),
               String(authUser?.user_role || ""),
          ].map((r) => r.trim().toUpperCase());

          const isAdminLike = authRoleCandidates.includes("ADMIN");

          const canDeleteExplicit = Number(userPermissions?.delete_permission) === 1;
          const canDelete = isSuperAdmin || isAdminLike || canDeleteExplicit;

          if (!canDelete) {
               toast.error("You don't have permission to delete users");
               return;
          }

          setUserToDelete(targetUser);
     };

     const confirmDeleteUser = async () => {
          if (!userToDelete) return;

          try {
               setIsDeleting(true);

               const res = await deleteUser(userToDelete.id, {
                    device_id: deviceInfo.device_id,
                    device_type: deviceInfo.device_type,
                    device_name: deviceInfo.device_name,
               });

               const statusCode = res?.status ?? res?.data?.status;
               const isSuccess =
                    statusCode === 200 ||
                    statusCode === 201 ||
                    statusCode === 204 ||
                    statusCode === "success";

               if (isSuccess) {
                    toast.success("User deleted successfully!", {
                         className: "toast-success toast-animate",
                         duration: 4000,
                    });
                    setUserToDelete(null);

                    // 🔁 Refresh list from backend
                    loadUsers();
               } else {
                    throw new Error(res.message);
               }
          } catch (err) {
               console.error(err);
               toast.error("Failed to delete user");
          } finally {
               setIsDeleting(false);
          }
     };

     // Toggle user active/inactive status
     const handleToggleStatus = async (user) => {
          try {
               // Convert to number and handle both undefined and actual 0 values
               const currentStatus = (user.is_active !== undefined && user.is_active !== null) 
                    ? Number(user.is_active) 
                    : 1;
               const newStatus = currentStatus === 1 ? 0 : 1;
               const userName = user.user_name || user.name || user.email || 'User';
               log('[UsersManagement] Toggling user status for:', userName, 'from:', currentStatus, 'to:', newStatus);
               
               // Prepare payload for update
               const payload = {
                    user_id: String(user.user_id || user.id),
                    device_id: deviceInfo.device_id || 'web',
                    device_type: deviceInfo.device_type || 'Laptop',
                    is_active: newStatus
               };

               await updateUser(payload);
               
               toast.success(`User ${newStatus === 1 ? 'activated' : 'deactivated'} successfully`);
               
               // Reload users list
               if (loadUsers) {
                    loadUsers();
               }
          } catch (error) {
               logError('[UsersManagement] Failed to toggle user status:', error);
               toast.error(error.message || 'Failed to update user status');
          }
     };

     const handleToggleTaskAssignment = (projectId, taskId) => {
          if (!assigningUser) return;

          const currentAssignments = assigningUser.assignedTasks || [];
          const exists = currentAssignments.some(
               (a) => a.projectId === projectId && a.taskId === taskId
          );

          let newAssignments;
          if (exists) {
               newAssignments = currentAssignments.filter(
                    (a) => !(a.projectId === projectId && a.taskId === taskId)
               );
          } else {
               newAssignments = [...currentAssignments, { projectId, taskId }];
          }

          setAssigningUser({ ...assigningUser, assignedTasks: newAssignments });

          const updatedUsers = users.map((u) =>
               u.id === assigningUser.id ? { ...u, assignedTasks: newAssignments } : u
          );

          onUpdateUsers(updatedUsers);
     };

     const handleToggleNewUserTask = (projectId, taskId) => {
          const currentAssignments = newUser.assignedTasks || [];
          const exists = currentAssignments.some(
               (a) => a.projectId === projectId && a.taskId === taskId
          );

          let newAssignments;
          if (exists) {
               newAssignments = currentAssignments.filter(
                    (a) => !(a.projectId === projectId && a.taskId === taskId)
               );
          } else {
               newAssignments = [...currentAssignments, { projectId, taskId }];
          }

          setNewUser({ ...newUser, assignedTasks: newAssignments });
     };

     return (
          <div className="space-y-8 animate-fade-in p-4 md:p-0 overflow-x-hidden">
               {/* Password Requests Section */}
               {isSuperAdmin && pendingRequests.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                         <h3 className="text-sm font-bold text-yellow-800 mb-2 flex items-center gap-2">
                              <Key className="w-4 h-4" /> Pending Password Reset Requests
                         </h3>
                         <div className="space-y-2">
                              {pendingRequests.map((req) => (
                                   <div
                                        key={req.id}
                                        className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-2 rounded border border-yellow-100 shadow-sm gap-2 sm:gap-0"
                                   >
                                        <div className="text-xs">
                                             <span className="font-bold text-slate-700">
                                                  {req.email}
                                             </span>
                                             <span className="text-slate-500 mx-1">•</span>
                                             <span className="text-blue-600 underline wrap-break-word">
                                                  {req.email}
                                             </span>
                                             <span className="text-slate-400 ml-0 sm:ml-2 block sm:inline">
                                                  {new Date(req.timestamp).toLocaleString()}
                                             </span>
                                        </div>
                                        <button
                                             onClick={() => onResolveRequest(req)}
                                             className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded font-bold transition-colors self-end sm:self-center"
                                        >
                                             Reset & Notify
                                        </button>
                                   </div>
                              ))}
                         </div>
                    </div>
               )}

               {/* Add User Form */}
               <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-700 mb-3 uppercase flex items-center gap-2">
                         <UserPlus className="w-4 h-4" /> Add New User
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                         <div className="col-span-1">
                              <label className="block text-xs font-semibold text-slate-500 mb-1">
                                   Full Name
                              </label>
                              <input
                                   type="text"
                                   className="w-full p-2 border rounded text-sm outline-none focus:border-blue-500"
                                   placeholder="e.g. John Doe"
                                   value={filterUser.name}
                                   onChange={(e) => setFilterUser({ ...filterUser, name: e.target.value })}
                                   required
                              />
                         </div>
                         <div className="col-span-1">
                              <label className="block text-xs font-semibold text-slate-500 mb-1">
                                   Email
                              </label>
                              <input
                                   type="email"
                                   className="w-full p-2 border rounded text-sm outline-none focus:border-blue-500"
                                   placeholder="user@co.com"
                                   value={filterUser.email}
                                   onChange={(e) =>
                                        setFilterUser({ ...filterUser, email: e.target.value })
                                   }
                              />
                         </div>
                         <div className="col-span-1">
                              <label className="block text-xs font-semibold text-slate-500 mb-1">
                                   Manager Name
                              </label>
                              <select
                                   className="w-full p-2 border rounded text-sm outline-none focus:border-blue-500"
                                   value={filterUser.reportingManager}
                                   onChange={(e) =>
                                        setFilterUser({ ...filterUser, reportingManager: e.target.value })
                                   }
                              >
                                   <option value="">Select Manager</option>
                                   {potentialManagers.map((u) => (
                                        <option key={u.id} value={u.name}>
                                             {u.name}
                                        </option>
                                   ))}
                              </select>
                         </div>
                         <div>
                              <label className="block text-xs font-semibold text-slate-500 mb-1">
                                   Role
                              </label>
                              <select
                                   className="w-full p-2 border rounded text-sm outline-none focus:border-blue-500"
                                   value={filterUser.role}
                                   onChange={(e) => setFilterUser({ ...filterUser, role: e.target.value })}
                              >
                                    <option value="">All Roles</option>
                                   <option value="AGENT">Agent</option>
                                   {isSuperAdmin && (
                                        <>
                                             <option value="PROJECT_MANAGER">PM</option>
                                             <option value="ASS_MANAGER">Assistant Manager</option>
                                             <option value="FINANCE_HR">Fin/HR</option>
                                             <option value="ADMIN">Admin</option>
                                        </>
                                   )}
                              </select>
                         </div>
                         <div className="flex gap-2 col-span-1">
                              {/* Only show Add User button if user has user_creation_permission = 1 and not in readOnly mode */}
                              {userPermissions.user_creation_permission === 1 && !readOnly && (
                                   <button
                                        onClick={openUserFormModal}
                                        className="bg-blue-600 text-white px-6 py-2 rounded text-sm font-bold hover:bg-blue-700 w-full flex items-center justify-center gap-2"
                                   >
                                        <UserPlus className="w-4 h-4" /> Add User
                                   </button>
                              )}
                              {readOnly && (
                                   <div className="bg-slate-100 text-slate-400 px-6 py-2 rounded text-sm font-medium w-full flex items-center justify-center gap-2 cursor-not-allowed" title="View only access">
                                        <UserPlus className="w-4 h-4" /> Add User (View Only)
                                   </div>
                              )}
                         </div>
                    </div>
               </div>

               {/* Users Table Component */}
               {loading ? (
                    <div className="text-center py-8 text-slate-500">
                         Loading users...
                    </div>
               ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                         No users found for the selected filters
                    </div>
               ) : (
                    <UsersTable
                         users={filteredUsers}
                         handleDeleteUser={handleDeleteUser}
                         openEditUserModal={handleOpenEditUserModal}
                         handleToggleStatus={handleToggleStatus}
                         readOnly={readOnly}
                    />
               )}

               {/* Add User Modal */}
               {showUserFormModal && (
                    <AddUserFormModal
                         newUser={newUser}
                         setNewUser={setNewUser}
                         handleAddUser={handleAddUser}
                         roles={dropdowns.roles}
                         designations={dropdowns.designations}
                         projectManagers={dropdowns.projectManagers}
                         assistantManagers={dropdowns.assistantManagers}
                         qas={dropdowns.qas}
                         teams={dropdowns.teams}
                         isDropdownLoading={dropdownLoading}
                         isSuperAdmin={isSuperAdmin}
                         isSubmitting={isSubmitting}
                         formErrors={formErrors}
                         clearFieldError={clearFieldError}
                         handleCloseUserModal={handleCloseUserModal}
                         handleProfilePictureChange={handleProfilePictureChange}
                         handleRemoveProfilePicture={handleRemoveProfilePicture}
                         profilePreview={profilePreview}
                    />
               )}
               {/* Edit User Modal */}
               {editUserId && (
                    <EditUserFormModal
                         userId={editUserId}
                         isOpen={!!editUserId}
                         onClose={handleCloseEditUserModal}
                         onUserUpdated={loadUsers}
                         deviceId={deviceInfo.device_id}
                         deviceType={deviceInfo.device_type}
                         isSuperAdmin={isSuperAdmin}
                    />
               )}

               {/* Task Assignment Modal */}
               {(assigningUser || isAssigningNewUser) && (
                    <TaskAssignmentModal
                         assigningUser={assigningUser}
                         isAssigningNewUser={isAssigningNewUser}
                         projects={projects}
                         newUser={newUser}
                         onToggleTaskAssignment={handleToggleTaskAssignment}
                         onToggleNewUserTask={handleToggleNewUserTask}
                         onClose={() => {
                              setAssigningUser(null);
                              setIsAssigningNewUser(false);
                         }}
                    />
               )}

               {/* Delete Modal */}
               {userToDelete && (
                    <DeleteUserModal
                         user={userToDelete}
                         onClose={() => setUserToDelete(null)}
                         onConfirm={confirmDeleteUser}
                         isDeleting={isDeleting}
                    />
               )}

          </div>
     );
};

export default UsersManagement;