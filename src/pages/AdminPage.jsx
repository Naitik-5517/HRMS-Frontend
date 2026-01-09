// import React, { useState, useMemo, useEffect } from 'react';
// import AdminLayout from '../layouts/AdminLayout';
// import UsersManagement from '../components/dashboard/manage/UsersManagement';
// import ProjectsManagement from '../components/dashboard/manage/ProjectsManagement';
// import { useAuth } from '../context/AuthContext';
// import { Lock } from "lucide-react";
// import db from '../utils/db.js';

// const AdminPage = () => {
//   const [users, setUsers] = useState([]);
//   const [projects, setProjects] = useState([]);
//   const [requests, setRequests] = useState([]);
//   const { canManageUsers, canManageProjects, isSuperAdmin } = useAuth();

//   // Initialize data
//   useEffect(() => {
//     const initialUsers = db.getUsers() || [];
//     const initialProjects = db.getProjects() || [];
//     const passwordRequests = db.getPasswordRequests() || [];

//     setUsers(initialUsers);
//     setProjects(initialProjects);
//     setRequests(passwordRequests);
//   }, []);

//   const pendingRequests = useMemo(() =>
//     requests
//       .filter(r => r.status === 'PENDING')
//       .sort((a, b) => b.timestamp - a.timestamp),
//     [requests]
//   );

//   const potentialOwners = useMemo(() =>
//     users.filter(u => u.role === 'ADMIN' || u.role === 'PROJECT_MANAGER'),
//     [users]
//   );

//   const potentialAPMs = useMemo(() =>
//     users.filter(u => u.designation === 'Asst. Project Manager'),
//     [users]
//   );

//   const potentialQAs = useMemo(() =>
//     users.filter(u => u.designation === 'QA'),
//     [users]
//   );

//   const handleUpdateUsers = (updatedUsers) => {
//     setUsers(updatedUsers);
//     db.updateUsers(updatedUsers); // ✅ correct method
//   };

//   const handleUpdateProjects = (updatedProjects) => {
//     setProjects(updatedProjects);
//     db.updateProjects(updatedProjects);
//   };

//   const handleResolveRequest = (req) => {
//     if (window.confirm(`Reset password for ${req.username} and send notification to ${req.email}?`)) {
//       const updatedUsers = users.map(u =>
//         u.id === req.userId ? { ...u, password: '123' } : u
//       );
//       handleUpdateUsers(updatedUsers);

//       db.resolvePasswordRequest(req.id);
//       setRequests(db.getPasswordRequests() || []);

//       alert(`Password reset to '123'. Notification sent to ${req.email}`);
//     }
//   };

//   const handleFactoryReset = () => {
//     if (window.confirm("WARNING: This will wipe ALL data and restore the default seed values. This cannot be undone. Are you sure?")) {
//       db.reset();
//       window.location.reload();
//     }
//   };

//   return (
//     <AdminLayout onFactoryReset={handleFactoryReset}>
//       {({ activeTab }) => (
//         <>
//           {activeTab === 'users' && canManageUsers && (
//             <UsersManagement
//               users={users}
//               projects={projects}
//               onUpdateUsers={handleUpdateUsers}
//               pendingRequests={pendingRequests}
//               onResolveRequest={handleResolveRequest}
//             />
//           )}

//           {activeTab === 'projects' && canManageProjects && (
//             <ProjectsManagement
//               projects={projects}
//               onUpdateProjects={handleUpdateProjects}
//               potentialOwners={potentialOwners}
//               potentialAPMs={potentialAPMs}
//               potentialQAs={potentialQAs}
//             />
//           )}

//           {/* Show message if no permission for active tab */}
//           {activeTab === 'users' && !canManageUsers && (
//             <div className="p-8 text-center text-slate-500">
//               <Lock className="w-12 h-12 mx-auto mb-4 text-slate-300" />
//               <h3 className="font-bold text-lg mb-2">Access Denied</h3>
//               <p>You don't have permission to manage users.</p>
//             </div>
//           )}

//           {activeTab === 'projects' && !canManageProjects && (
//             <div className="p-8 text-center text-slate-500">
//               <Lock className="w-12 h-12 mx-auto mb-4 text-slate-300" />
//               <h3 className="font-bold text-lg mb-2">Access Denied</h3>
//               <p>You don't have permission to manage projects.</p>
//             </div>
//           )}
//         </>
//       )}
//     </AdminLayout>
//   );
// };

// export default AdminPage;
















import React, { useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import ManageModule from "../components/dashboard/manage/user/ManageModule.jsx"
import { useAuth } from "../context/AuthContext";
import db from "../utils/db.js";

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState("users"); // ✅ DEFAULT TAB
  const { canManageUsers, canManageProjects } = useAuth();

  const handleFactoryReset = () => {
    if (window.confirm("This will reset ALL data. Continue?")) {
      db.reset();
      window.location.reload();
    }
  };

  return (
    <AdminLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onFactoryReset={handleFactoryReset}
    >
      <ManageModule
        activeTab={activeTab}
      />
    </AdminLayout>

  // {/* {activeTab === "users" && (
  //       canManageUsers ? (
  //         <UsersManagement
  //           users={users}
  //           projects={projects}
  //           onUpdateUsers={handleUpdateUsers}
  //           pendingRequests={pendingRequests}
  //           onResolveRequest={handleResolveRequest}
  //         />
  //       ) : (
  //         <div className="p-8 text-center text-slate-500">
  //           <Lock className="w-12 h-12 mx-auto mb-4 text-slate-300" />
  //           <h3 className="font-bold text-lg mb-2">Access Denied</h3>
  //           <p>You don't have permission to manage users.</p>
  //         </div>
  //       )
  //     )} */}

  // {/* PROJECTS TAB */ }
  // {/* {activeTab === "projects" && (
  //       canManageProjects ? (
  //         <ProjectsManagement
  //           projects={projects}
  //           onUpdateProjects={handleUpdateProjects}
  //         />
  //       ) : (
  //         <div className="p-8 text-center text-slate-500">
  //           <Lock className="w-12 h-12 mx-auto mb-4 text-slate-300" />
  //           <h3 className="font-bold text-lg mb-2">Access Denied</h3>
  //           <p>You don't have permission to manage projects.</p>
  //         </div>
  //       )
  //     )} */}
  );
};

export default AdminPage;
