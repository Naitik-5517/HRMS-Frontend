import React, { useEffect, useState } from "react";
import AddUserFormModal from "./AddUserFormModal";
import { fetchUserDropdowns } from "../../../../services/dropdownService";
import { fetchUserById, updateUser } from "../../../../services/userService";
import { log, logError, logWarn } from "../../../../config/environment";
import { toast } from "react-hot-toast";

const EditUserFormModal = ({
  userId,
  isOpen,
  onClose,
  onUserUpdated,
  isSuperAdmin = false,
  deviceId = "",
  deviceType = "Laptop"
}) => {
  const [userData, setUserData] = useState(null);
  const [originalUserData, setOriginalUserData] = useState(null); // Store original data to compare changes
  const [dropdowns, setDropdowns] = useState({ roles: [], designations: [], projectManagers: [], assistantManagers: [], qas: [], teams: [] });
  const [isDropdownLoading, setIsDropdownLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [profilePreview, setProfilePreview] = useState(null);

  // Fetch user data and dropdowns on open
  useEffect(() => {
    let isMounted = true; // Cleanup flag to prevent memory leaks
    
    if (isOpen && userId) {
      setIsDropdownLoading(true);
      
      Promise.all([
        fetchUserById(userId, deviceId, deviceType),
        fetchUserDropdowns()
      ])
        .then(([user, dropdownData]) => {
          // Only update state if component is still mounted
          if (!isMounted) return;
          
          log('[EditUserFormModal] Fetched user:', user);
          log('[EditUserFormModal] Fetched dropdownData:', dropdownData);
          
          if (!user) {
            // Fallback: try to get user data from window
            if (typeof window !== 'undefined' && window.__frontendUserForEdit) {
              logWarn('[EditUserFormModal] No user found in backend, using frontend data');
              user = window.__frontendUserForEdit;
            } else {
              logWarn('[EditUserFormModal] No user found for userId:', userId);
              setUserData(null);
              setDropdowns(dropdownData);
              setIsDropdownLoading(false);
              return;
            }
          }
          
          // Map user fields to dropdown IDs/values for correct display
          const getIdByLabel = (arr, label, idKey = 'id', labelKey = 'label') => {
            if (!label || !arr || !Array.isArray(arr)) return '';
            const norm = (v) => (v === null || v === undefined) ? '' : String(v).trim().toLowerCase();
            const result = arr.find(item => norm(item[labelKey]) === norm(label))?.[idKey] || '';
            return result;
          };
          
          // Extract role_id
          let roleValue = user.role_id || '';
          if (!roleValue && user.role && dropdownData.roles) {
            roleValue = getIdByLabel(dropdownData.roles, user.role, 'role_id', 'label') ||
                       getIdByLabel(dropdownData.roles, user.role, 'role_id', 'role_name') ||
                       '';
          }
          
          // Extract team_id
          let teamValue = user.team_id || '';
          if (!teamValue && dropdownData.teams) {
            teamValue = getIdByLabel(dropdownData.teams, user.team_name, 'team_id', 'label') ||
                       getIdByLabel(dropdownData.teams, user.team_name, 'team_id', 'team_name') ||
                       getIdByLabel(dropdownData.teams, user.team, 'team_id', 'label') ||
                       '';
          }
          
          log('[EditUserFormModal] Role mapping - input:', user.role, 'role_id:', user.role_id, 'mapped:', roleValue);
          log('[EditUserFormModal] Team mapping - input:', user.team_name, 'team_id:', user.team_id, 'mapped:', teamValue);
          log('[EditUserFormModal] Available roles:', dropdownData.roles);
          log('[EditUserFormModal] Available teams:', dropdownData.teams);
          
          const newUserData = {
            ...user,
            name: user.user_name,
            email: user.user_email,
            phone: user.user_number,
            password: user.user_password || "", // Show existing password for edit
            role: String(roleValue || ''), // Convert to string for select element
            designation: String(
              user.designation_id ||
              getIdByLabel(dropdownData.designations, user.designation, 'designation_id', 'label') ||
              ''
            ),
            projectManager: String(
              user.project_manager_id ||
              getIdByLabel(dropdownData.projectManagers, user.project_manager, 'user_id', 'label') ||
              getIdByLabel(dropdownData.projectManagers, user.project_manager_name, 'user_id', 'label') ||
              ''
            ),
            assistantManager: String(
              user.assistant_manager_id ||
              getIdByLabel(dropdownData.assistantManagers, user.asst_manager, 'user_id', 'label') ||
              getIdByLabel(dropdownData.assistantManagers, user.assistant_manager, 'user_id', 'label') ||
              ''
            ),
            qualityAnalyst: String(
              user.qa_id ||
              getIdByLabel(dropdownData.qas, user.qa, 'user_id', 'label') ||
              ''
            ),
            team: String(teamValue || ''), // Convert to string for select element
            tenure: user.user_tenure || user.tenure || "",
            address: user.user_address || user.address || "",
          };
          
          log('[EditUserFormModal] Final userData being set:', newUserData);
          log('[EditUserFormModal] userData.role:', newUserData.role, 'type:', typeof newUserData.role);
          log('[EditUserFormModal] userData.team:', newUserData.team, 'type:', typeof newUserData.team);
          
          setUserData(newUserData);
          setOriginalUserData(newUserData); // Store original data for comparison
          
          setProfilePreview(user.profile_picture || null);
          setDropdowns(dropdownData);
        })
        .catch((error) => {
          if (!isMounted) return;
          logError('[EditUserFormModal] Error fetching data:', error);
          setFormErrors({ general: error.message || 'Failed to load user data' });
        })
        .finally(() => {
          if (isMounted) {
            setIsDropdownLoading(false);
          }
        });
    }
    
    // Cleanup function to prevent memory leaks
    return () => {
      isMounted = false;
    };
  }, [isOpen, userId, deviceId, deviceType]);

  // Handle update user
  const handleUpdateUser = async () => {
    if (!userData || !userData.user_id) {
      toast.error('User ID is required');
      return;
    }
    
    setIsSubmitting(true);
    setFormErrors({});
    
    try {
      // Build payload with user_id (required) and only changed fields
      const payload = { user_id: userData.user_id };
      
      log('[EditUserFormModal] Current userData:', userData);
      log('[EditUserFormModal] Original userData:', originalUserData);
      
      // Map frontend field names to backend field names
      const fieldMapping = {
        name: 'user_name',
        email: 'user_email',
        phone: 'user_number',
        password: 'user_password',
        tenure: 'user_tenure',
        address: 'user_address',
        role: 'role_id',
        designation: 'designation_id',
        projectManager: 'project_manager_id',
        assistantManager: 'assistant_manager_id',
        qualityAnalyst: 'qa_id',
        team: 'team_id'
      };
      
      // Add only changed fields to payload
      Object.entries(fieldMapping).forEach(([frontendKey, backendKey]) => {
        const currentValue = userData[frontendKey];
        const originalValue = originalUserData?.[frontendKey];
        
        // Normalize values to strings for comparison (to handle "3" vs 3)
        const currentStr = String(currentValue || '');
        const originalStr = String(originalValue || '');
        const hasChanged = currentStr !== originalStr;
        
        log(`[EditUserFormModal] Checking ${frontendKey}: current="${currentValue}" (${typeof currentValue}) original="${originalValue}" (${typeof originalValue}) changed=${hasChanged}`);
        
        // Special handling for password - only include if it was actually changed
        if (frontendKey === 'password') {
          if (hasChanged && currentValue && String(currentValue).trim() !== "") {
            payload[backendKey] = currentValue;
            log(`[EditUserFormModal] Including password in payload (changed)`);
          } else {
            log(`[EditUserFormModal] Skipping password (not changed or empty)`);
          }
          return;
        }
        
        // Only include if value has changed and is not empty
        if (hasChanged && currentValue !== null && currentValue !== undefined && currentValue !== "") {
          payload[backendKey] = currentValue;
          log(`[EditUserFormModal] Including ${backendKey} = ${currentValue} (changed from ${originalValue})`);
        }
      });
      
      // Add profile picture if changed
      if (profilePreview && profilePreview !== originalUserData?.profile_picture) {
        payload.profile_picture = profilePreview;
        log('[EditUserFormModal] Including profile picture (changed)');
      }
      
      log('[EditUserFormModal] Final update payload:', payload);
      log('[EditUserFormModal] Payload as JSON:', JSON.stringify(payload, null, 2));
      
      // If only user_id is present, no changes were made
      if (Object.keys(payload).length === 1) {
        toast.info('No changes detected');
        setIsSubmitting(false);
        return;
      }
      
      const res = await updateUser(payload);
      
      log('[EditUserFormModal] API response:', res);
      
      if (res.status === 200) {
        log('[EditUserFormModal] User updated successfully');
        toast.success('User updated successfully!', {
          duration: 3000,
        });
        onUserUpdated && onUserUpdated();
        onClose();
      } else {
        setFormErrors({ general: res.message || "Update failed" });
        toast.error(res.message || 'Failed to update user');
      }
    } catch (err) {
      logError('[EditUserFormModal] Update error:', err);
      logError('[EditUserFormModal] Error response:', err.response?.data);
      const errorMessage = err.message || 'Failed to update user';
      setFormErrors({ general: errorMessage });
      toast.error(errorMessage, {
        duration: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Profile picture change
  const handleProfilePictureChange = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setProfilePreview(reader.result);
    reader.readAsDataURL(file);
  };
  const handleRemoveProfilePicture = () => setProfilePreview(null);

  if (!isOpen || !userData) return null;

  return (
    <AddUserFormModal
      newUser={userData}
      setNewUser={setUserData}
      handleUpdateUser={handleUpdateUser}
      roles={dropdowns.roles}
      designations={dropdowns.designations}
      projectManagers={dropdowns.projectManagers}
      assistantManagers={dropdowns.assistantManagers}
      qas={dropdowns.qas}
      teams={dropdowns.teams}
      isDropdownLoading={isDropdownLoading}
      isSuperAdmin={isSuperAdmin}
      handleCloseUserModal={onClose}
      isSubmitting={isSubmitting}
      formErrors={formErrors}
      clearFieldError={(field) => setFormErrors((prev) => ({ ...prev, [field]: undefined }))}
      handleProfilePictureChange={handleProfilePictureChange}
      handleRemoveProfilePicture={handleRemoveProfilePicture}
      profilePreview={profilePreview}
      isEditMode={true}
    />
  );
};

export default EditUserFormModal;
