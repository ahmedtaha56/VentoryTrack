import { useContext } from 'react';
import { supabase } from '../lib/supabase';
import { AuthContext } from '../context/Authcontext';
import { FEATURES } from '../config/features';
import { ROLE_PERMISSIONS } from '../config/roles';

export const usePermissions = () => {
  const { permissions, role, userData, user } = useContext(AuthContext);

  const isUserAdmin = role?.toLowerCase() === 'admin';

  // Refresh permissions from database
  const refreshPermissions = async (userId) => {
    try {
      const { data, error } = await supabase.rpc('get_user_features', {
        p_user_id: userId,
      });
      if (error) {
        console.error('❌ Error refreshing permissions:', error);
        return;
      }
      console.log(`✅ Permissions refreshed - ${data?.length || 0} items`);
      return data || [];
    } catch (error) {
      console.error('❌ Error in refreshPermissions:', error);
    }
  };

  const getFeaturePermissions = (featureKey) => {
    // Admins have full access to everything
    if (isUserAdmin) {
      return {
        canView: true,
        canCreate: true,
        canUpdate: true,
        canDelete: true,
      };
    }

    // Check custom staff permissions first (from staff_permissions table)
    // These are stored in the permissions array
    if (permissions && Array.isArray(permissions)) {
      const customPerm = permissions.find(p => p.feature_key === featureKey);
      if (customPerm) {
        return {
          canView: customPerm.can_view || false,
          canCreate: customPerm.can_create || false,
          canUpdate: customPerm.can_update || false,
          canDelete: customPerm.can_delete || false,
        };
      }
    }

    // Check role-based permissions (from ROLE_PERMISSIONS config)
    if (role && ROLE_PERMISSIONS[role?.toLowerCase()]) {
      const rolePerms = ROLE_PERMISSIONS[role.toLowerCase()][featureKey];
      if (rolePerms) {
        return {
          canView: rolePerms.view || false,
          canCreate: rolePerms.create || false,
          canUpdate: rolePerms.update || false,
          canDelete: rolePerms.delete || false,
        };
      }
    }

    // If no custom permissions found, default to view-only for known features
    const feature = FEATURES[featureKey];
    if (feature && feature.permissions.includes('view')) {
      return {
        canView: true,
        canCreate: false,
        canUpdate: false,
        canDelete: false,
      };
    }

    // No access for unknown features
    return {
      canView: false,
      canCreate: false,
      canUpdate: false,
      canDelete: false,
    };
  };

  // Check if user has any permission on a feature
  const hasFeatureAccess = (featureKey) => {
    const perms = getFeaturePermissions(featureKey);
    return perms.canView || perms.canCreate || perms.canUpdate || perms.canDelete;
  };

  // Check specific permission type
  const hasPermission = (featureKey, permissionType) => {
    const perms = getFeaturePermissions(featureKey);
    const permKey = `can${permissionType.charAt(0).toUpperCase()}${permissionType.slice(1)}`;
    return perms[permKey] || false;
  };

  return {
    isUserAdmin,
    permissions,
    role,
    getFeaturePermissions,
    hasFeatureAccess,
    hasPermission,
    refreshPermissions,
  };
};