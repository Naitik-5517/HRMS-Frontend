import React, { useState, useEffect, useMemo } from 'react';
import { Users, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const UserTrackingView = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [roleOptions, setRoleOptions] = useState([]);
  const [updatingPermission, setUpdatingPermission] = useState(null);

  // Fetch users and roles on mount
  useEffect(() => {
    fetchUsers();
    fetchRoleDropdown();
  }, []);

  // Fetch users by role when roleFilter changes (except 'all')
  useEffect(() => {
    if (roleFilter === 'all') {
      fetchUsers();
    } else {
      fetchUsersByRole(roleFilter);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter]);

  // Fetch users by role
  const fetchUsersByRole = async (roleId) => {
    try {
      setLoading(true);
      const selectedRole = roleOptions.find(opt => String(opt.role_id) === String(roleId));
      const roleLabel = selectedRole ? selectedRole.label : '';
      if (!user?.user_id || !roleLabel) {
        setUsers([]);
        setLoading(false);
        return;
      }
      const response = await api.post('/permission/user_list', {
        logged_in_user_id: user.user_id,
        role: roleLabel
      });
      let userArray = [];
      if (response.data?.status === 200) {
        const innerData = response.data.data;
        if (Array.isArray(innerData)) {
          userArray = innerData;
        } else if (innerData && Array.isArray(innerData.users)) {
          userArray = innerData.users;
        } else if (innerData && Array.isArray(innerData.user_list)) {
          userArray = innerData.user_list;
        } else {
          for (const key in innerData) {
            if (Array.isArray(innerData[key])) {
              userArray = innerData[key];
              break;
            }
          }
        }
        setUsers(userArray);
      } else {
        setUsers([]);
      }
    } catch (error) {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch role dropdown data from API
  const fetchRoleDropdown = async () => {
    try {
      const response = await api.post('/dropdown/get', { dropdown_type: 'user roles' });
      if (response.data?.status === 200 && Array.isArray(response.data.data)) {
        setRoleOptions(response.data.data);
      } else {
        setRoleOptions([]);
      }
    } catch (error) {
      setRoleOptions([]);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Log user_id and token for debugging
      const token = localStorage.getItem('tfs_auth_token');
      console.log('Sending user_id:', user?.user_id, 'Token:', token);

      if (!user?.user_id) {
        toast.error('User ID missing. Please login again.');
        setUsers([]);
        setLoading(false);
        return;
      }

      const response = await api.post('/permission/user_list', {
        logged_in_user_id: user.user_id
      });

      console.log('API /permission/user_list response:', response.data);
      console.log('API /permission/user_list inner data:', response.data?.data);
      let userArray = [];
      if (response.data?.status === 200) {
        const innerData = response.data.data;
        if (Array.isArray(innerData)) {
          userArray = innerData;
        } else if (innerData && Array.isArray(innerData.users)) {
          userArray = innerData.users;
        } else if (innerData && Array.isArray(innerData.user_list)) {
          userArray = innerData.user_list;
        } else {
          // Try to find any array property
          for (const key in innerData) {
            if (Array.isArray(innerData[key])) {
              userArray = innerData[key];
              break;
            }
          }
        }
        if (userArray.length > 0) {
          setUsers(userArray);
        } else {
          toast.error('API returned success but no user array found.');
          setUsers([]);
        }
      } else {
        toast.error('Failed to load users');
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Error loading users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Map user role to label for filter matching
  const getRoleLabel = (roleIdOrName) => {
    if (!roleIdOrName) return '';
    // Try to match by role_id
    const found = roleOptions.find(opt => String(opt.role_id) === String(roleIdOrName) || opt.label === roleIdOrName);
    return found ? found.label : roleIdOrName;
  };

  // Filter users: search only by name and email (role filter now handled by API)
  const filteredUsers = useMemo(() => {
    const safeUsers = Array.isArray(users) ? users : [];
    return safeUsers.filter(userData => {
      return (
        userData.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        userData.user_email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [users, searchQuery]);

  // Handle permission toggle
  const handlePermissionToggle = async (targetUserId, permissionType, currentValue) => {
    const permissionKey = `${targetUserId}-${permissionType}`;
    setUpdatingPermission(permissionKey);

    try {
      // Find the target user to get both permission values
      const targetUser = users.find(u => u.user_id === targetUserId);
      
      const payload = {
        user_id: user.user_id,
        target_user_id: targetUserId,
        project_creation_permission: permissionType === 'project' 
          ? (currentValue === 1 ? 0 : 1) 
          : (targetUser?.project_creation_permission || 0),
        user_creation_permission: permissionType === 'user' 
          ? (currentValue === 1 ? 0 : 1) 
          : (targetUser?.user_creation_permission || 0)
      };

      const response = await api.post('/permission/update', payload);
      
      if (response.data) {
        // Update local state
        setUsers(prevUsers => 
          prevUsers.map(u => 
            u.user_id === targetUserId 
              ? {
                  ...u,
                  [permissionType === 'project' ? 'project_creation_permission' : 'user_creation_permission']: currentValue === 1 ? 0 : 1
                }
              : u
          )
        );
        toast.success(`Permission ${currentValue === 1 ? 'revoked' : 'granted'} successfully!`);
      }
    } catch (error) {
      console.error('Error updating permission:', error);
      toast.error(error.response?.data?.message || 'Failed to update permission');
    } finally {
      setUpdatingPermission(null);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-blue-700 tracking-tight">User Permission</h2>
      </div>


      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Roles</option>
            {roleOptions.map(opt => (
              <option key={opt.role_id} value={opt.role_id}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      {filteredUsers.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No users found</h3>
          <p className="text-gray-500">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-600 to-blue-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    User Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-white uppercase tracking-wider">
                    User Creation Permission
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-white uppercase tracking-wider">
                    Project Creation Permission
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((userData, index) => (
                  <tr key={userData.user_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{userData.user_name}</div>
                      {userData.designation && (
                        <div className="text-sm text-gray-500">{userData.designation}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {userData.user_email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        userData.role === 'Admin' ? 'bg-purple-100 text-purple-700' :
                        userData.role === 'Manager' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {userData.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handlePermissionToggle(userData.user_id, 'user', userData.user_creation_permission)}
                        disabled={updatingPermission === `${userData.user_id}-user`}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                          userData.user_creation_permission === 1 ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                            userData.user_creation_permission === 1 ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handlePermissionToggle(userData.user_id, 'project', userData.project_creation_permission)}
                        disabled={updatingPermission === `${userData.user_id}-project`}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                          userData.project_creation_permission === 1 ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                            userData.project_creation_permission === 1 ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Results Count */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{filteredUsers.length}</span> of <span className="font-semibold text-gray-900">{users.length}</span> users
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserTrackingView;