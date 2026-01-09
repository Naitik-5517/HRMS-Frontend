import React, { useState } from "react";
import {
  Trash2,
  Edit,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAuth } from "../../../../context/AuthContext";

const UsersTable = ({
  users,
  handleDeleteUser,
  openEditUserModal
}) => {
  const [visiblePasswordUserId, setVisiblePasswordUserId] = useState(null);
  useAuth();

  // ...existing code...

  return (
    <div className="overflow-x-auto border border-slate-200 rounded-lg">
      <div className="min-w-3xl lg:min-w-full">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 font-semibold">
            <tr>
              <th className="px-4 py-3">Name / Email</th>
              <th className="px-4 py-3">Designation</th>
              <th className="px-4 py-3">Reporting To</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Password</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => {
              const roleLabel = (u.role || "").replace("_", " ");
              const password = (u.password_plain ?? u.password ?? u.user_password ?? "");
              const masked = password ? "•".repeat(Math.max(8, password.length)) : "••••••••";
              // Use user_id if available, else fallback to id or email
              const rowKey = u.user_id || u.id || u.email;
              return (
                <tr key={rowKey} className="hover:bg-slate-50">

                  <td className="px-4 py-3 font-medium text-slate-800 min-w-[200px]">
                    <div className="font-medium">{u.name}</div>
                    <div className="text-xs text-blue-600/80 mt-0.5">
                      {u.email ? (
                        u.email
                      ) : (
                        <span className="text-slate-300 italic">
                          No Email
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-xs text-slate-600 min-w-[120px]">
                    {u.designation || "-"}
                  </td>

                  <td className="px-4 py-3 text-xs text-slate-600 min-w-[150px]">
                    {u.project_manager_name || u.reportingManager || "-"}
                  </td>

                  <td className="px-4 py-3 min-w-[100px]">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase whitespace-nowrap ${u.role === "ADMIN"
                        ? "bg-slate-800 text-white"
                        : u.role === "PROJECT_MANAGER"
                          ? "bg-blue-700 text-white"
                          : u.role === "FINANCE_HR"
                            ? "bg-sky-600 text-white"
                            : "bg-slate-200 text-slate-700"
                        }`}
                    >
                      {roleLabel || "-"}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-xs min-w-40">
                    <div className="flex items-center gap-2">
                      <span className="tracking-widest font-mono">
                        {visiblePasswordUserId === u.id ? password : masked}
                      </span>
                      <button
                        type="button"
                        className="text-slate-400 hover:text-slate-700 transition-colors"
                        onClick={() => setVisiblePasswordUserId(visiblePasswordUserId === u.id ? null : u.id)}
                        title={visiblePasswordUserId === u.id ? "Hide password" : "Show password"}
                      >
                        {visiblePasswordUserId === u.id ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-right min-w-[120px]">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditUserModal(u)}
                        className="p-0 bg-transparent hover:bg-transparent focus:outline-none"
                        title="Edit User"
                        aria-label="Edit User"
                      >
                        <Edit
                          className="w-6 h-6 text-blue-500 bg-blue-100 bg-opacity-40 rounded-full p-1 transition-colors duration-200 hover:text-white hover:bg-blue-500 hover:bg-opacity-100"
                        />
                      </button>
                        <button
                          onClick={() => handleDeleteUser(u)}
                          className="p-0 bg-transparent hover:bg-transparent focus:outline-none"
                          title="Delete User"
                          aria-label="Delete User"
                        >
                          <Trash2
                            className="w-6 h-6 text-red-500 bg-red-100 bg-opacity-40 rounded-full p-1 transition-colors duration-200 hover:text-white hover:bg-red-500 hover:bg-opacity-100"
                          />
                        </button>
                    </div>
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

export default UsersTable;