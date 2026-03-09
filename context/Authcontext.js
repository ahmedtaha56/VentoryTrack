import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabase';
import { signInUser, signUpUser, signOutUser, getCurrentUser, getSession } from '../lib/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppContext } from './AppContext';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { dispatch } = useContext(AppContext);
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);
  const [permissions, setPermissions] = useState([]);

  // Get user permissions from the database
  const fetchUserPermissions = async (userId) => {
    try {
      const { data, error } = await supabase.rpc('get_user_features', {
        p_user_id: userId,
      });
      if (error) throw error;
      setPermissions(data || []);
      return data || [];
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      setPermissions([]);
      return [];
    }
  };

  const setupUserContext = async (user, userData) => {
    // userData should already be a single object (not array) from database.js
    // But handle null/undefined case
    const userDataToUse = userData || {
      name: user?.email?.split('@')[0] || 'User',
      role: 'admin',  // Change from 'staff' to 'admin'
      email: user?.email
    };

    console.log('setupUserContext - userData received:', userData);
    console.log('setupUserContext - userDataToUse:', userDataToUse);

    setUser(user);
    setUserData(userDataToUse);
    setRole(userDataToUse?.role);
    console.log(`✅ User session initialized for: ${userDataToUse?.name} (Role: ${userDataToUse?.role})`);
    dispatch({ type: 'SET_USER', payload: user });
    if (user) {
      await fetchUserPermissions(user.id);
      // Subscribe to real-time permission changes
      setupPermissionSubscription(user.id);
    }
  };

  // Subscribe to permission changes in real-time
  const setupPermissionSubscription = (userId) => {
    console.log(`🔔 Setting up real-time permission subscription for user ${userId}`);
    const channel = supabase
      .channel(`permissions:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'staff_permissions',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('🔄 Permission change detected:', payload);
          // Refetch permissions when they change
          fetchUserPermissions(userId);
        }
      )
      .subscribe();
    return channel;
  };

  // Check if user is logged in on app start
  useEffect(() => {
    const checkUser = async () => {
      try {
        const session = await getSession(supabase);
        if (session && session.user) {
          const result = await getCurrentUser(supabase);
          if (result.success) {
            await setupUserContext(result.user, result.userData);
          }
        }
      } catch (error) {
        console.error('Error checking user:', error);
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, []);

  const signIn = async (email, password) => {
    try {
      const result = await signInUser(supabase, email, password);

      if (result.success) {
        await setupUserContext(result.user, result.userData);
        await AsyncStorage.setItem('userToken', result.session.access_token);
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const signUp = async (name, email, password, role) => {
    try {
      const result = await signUpUser(supabase, name, email, password, role);

      if (result.success) {
        const userResult = await getCurrentUser(supabase);
        if (userResult.success) {
          await setupUserContext(userResult.user, userResult.userData);
        }
        await AsyncStorage.setItem('userToken', result.session.access_token);
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const signOut = async () => {
    console.log('🔵 AuthContext.signOut() called');
    try {
      console.log('🔵 Calling signOutUser...');
      await signOutUser(supabase);
      console.log('🔵 signOutUser completed');

      setUser(null);
      console.log('🔵 setUser(null) - user state cleared');

      setUserData(null);
      console.log('🔵 setUserData(null) - userData state cleared');

      setRole(null);
      console.log('🔵 setRole(null) - role state cleared');

      setPermissions([]);
      console.log('🔵 setPermissions([]) - permissions state cleared');

      setLoading(false);
      console.log('🔵 setLoading(false) - loading state cleared');

      dispatch({ type: 'LOGOUT' });
      console.log('🔵 dispatch LOGOUT');

      await AsyncStorage.removeItem('userToken');
      console.log('🔵 AsyncStorage token removed');

      console.log('✅ signOut completed successfully');
      return { success: true };
    } catch (error) {
      console.error('🔥 signOut error:', error);
      setLoading(false);
      return { success: false, error: error.message };
    }
  };

  // Public method to refresh permissions
  const refreshPermissionsManually = async (userId) => {
    console.log(`🔄 Manual permission refresh requested for user ${userId}`);
    return await fetchUserPermissions(userId);
  };

  const value = {
    user,
    userData,
    loading,
    signIn,
    signUp,
    signOut,
    role,
    permissions,
    refreshPermissionsManually,
    // Legacy support for old navigation
    state: {
      isSignedIn: !!user,
      userRole: role || 'staff',
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;