// Sign Up Function - FIXED
// Sign Up Function - FIXED
export const signUpUser = async (supabase, name, email, password, role) => {
  try {
    console.log('🔐 signUpUser called with:', { name, email, role });

    // Validate name is not empty
    if (!name || name.trim() === '') {
      throw new Error('Name cannot be empty');
    }

    // 1. Create auth user with metadata
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name.trim(),  // ✅ Set name in metadata for trigger
          role: role || 'staff'
        }
      }
    });

    if (authError) throw authError;

    console.log('✅ Auth user created:', authData.user.id);
    console.log('🔐 Auth metadata set:', authData.user.user_metadata);

    // 2. Wait for trigger to execute (it automatically inserts into users table)
    console.log('⏳ Waiting for trigger to create user profile...');
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 3. Update user profile to ensure name and role are correct
    const { error: updateError } = await supabase
      .from('users')
      .update({
        name: name.trim(),
        role: role || 'staff'
      })
      .eq('id', authData.user.id);

    if (updateError) {
      console.error('❌ Update Error:', updateError);
      throw updateError;
    }

    console.log('✅ User profile created successfully with name:', name.trim());

    // 4. Verify that the user was created with the correct name
    const { data: verifyData, error: verifyError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (verifyError) {
      console.warn('⚠️ Could not verify user creation:', verifyError);
    } else {
      console.log('✅ User verification - Name:', verifyData.name, 'Email:', verifyData.email);

      // Double check - if name is still email, update it again
      if (!verifyData.name || verifyData.name === email) {
        console.warn('⚠️ User created but name is incorrect! Fixing now...');
        const { error: fixError } = await supabase
          .from('users')
          .update({ name: name.trim() })
          .eq('id', authData.user.id);

        if (fixError) {
          console.error('❌ Failed to fix name:', fixError);
        } else {
          console.log('✅ Name fixed successfully to:', name.trim());
        }
      }
    }

    return {
      success: true,
      user: authData.user,
      session: authData.session,
    };
  } catch (error) {
    console.error('❌ signUpUser error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Sign In Function - FIXED (removed .single())
export const signInUser = async (supabase, email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Get user data from users table - WITHOUT .single()
    let { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id);

    if (userError) throw userError;

    // If user profile doesn't exist, create it
    if (!userData || userData.length === 0) {
      // Try direct INSERT instead of RPC
      const { data: insertData, error: insertError } = await supabase
        .from('users')
        .insert([{
          id: data.user.id,
          email: email,
          name: data.user.user_metadata?.name || email.split('@')[0],
          role: 'admin'
        }])
        .select();

      if (insertError) {
        console.error('Direct INSERT error:', insertError);
        // Try RPC as fallback
        const { data: rpcResult, error: dbError } = await supabase.rpc('create_user_profile_if_not_exists', {
          user_id: data.user.id,
          user_email: email,
          user_name: data.user.user_metadata?.name || email.split('@')[0],
          user_role: 'admin'
        });

        if (dbError) {
          console.error('RPC create_user_profile_if_not_exists error:', dbError);
          throw dbError;
        }
        console.log('RPC result:', rpcResult);
      } else {
        console.log('Direct INSERT successful:', insertData);
      }

      // Fetch the newly created user data
      const { data: newUserData, error: newError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id);

      if (newError) throw newError;
      userData = newUserData;
    }

    // Ensure we return a single object, not an array
    const userDataObject = (Array.isArray(userData) && userData.length > 0) ? userData[0] : null;

    console.log('signInUser - userData array:', userData);
    console.log('signInUser - userDataObject:', userDataObject);

    return {
      success: true,
      user: data.user,
      session: data.session,
      userData: userDataObject,
    };
  } catch (error) {
    console.error('signInUser error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Sign Out Function
export const signOutUser = async (supabase) => {
  try {
    console.log('🟢 signOutUser called');
    const { error } = await supabase.auth.signOut();
    console.log('🟢 supabase.auth.signOut() completed, error:', error);

    if (error) {
      console.error('🔥 signOut error from Supabase:', error);
      throw error;
    }

    console.log('✅ signOutUser completed successfully');
    return { success: true };
  } catch (error) {
    console.error('🔥 signOutUser catch error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Get Current User - FIXED (removed .single())
export const getCurrentUser = async (supabase) => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false };

    let { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id);

    if (error) throw error;

    // If user profile doesn't exist, create it
    if (!userData || userData.length === 0) {
      console.log('User profile not found, creating...');
      // ... existing creation code ...
    }

    // ✅ FIX: Ensure userData has the name field
    const userDataToReturn = (Array.isArray(userData) && userData.length > 0) ? {
      ...userData[0],
      name: userData[0].name || user.email?.split('@')[0]  // ← Ensure name exists
    } : null;

    console.log('getCurrentUser - userData array:', userData);
    console.log('getCurrentUser - userDataObject:', userDataToReturn);

    return {
      success: true,
      user,
      userData: userDataToReturn,  // ← Use this instead
    };
  } catch (error) {
    console.error('getCurrentUser error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Get Session
export const getSession = async (supabase) => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
};

// Check if any user exists in the database
export const doesAnyUserExist = async (supabase) => {
  try {
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (error) {
      // If the table doesn't exist (e.g., brand new project), assume no users.
      if (error.code === '42P01') {
        return { success: true, exists: false };
      }
      throw error;
    }

    return { success: true, exists: count > 0 };
  } catch (error) {
    return { success: false, error: error.message, exists: false };
  }
};

// Count admin users - check if we already have 2 admins
export const countAdminUsers = async (supabase) => {
  try {
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin');

    if (error) {
      if (error.code === '42P01') {
        return { success: true, count: 0 };
      }
      throw error;
    }

    return { success: true, count: count || 0 };
  } catch (error) {
    return { success: false, error: error.message, count: 0 };
  }
};

// Insert Stock Log
export const updateProductQuantity = async (supabase, productId, newQuantity, userId) => {
  try {
    console.log('📊 updateProductQuantity called - productId:', productId, 'newQuantity:', newQuantity);
    const { data, error } = await supabase
      .from('products')
      .update({ quantity: newQuantity })
      .eq('id', productId)
      .select();

    if (error) {
      console.error('❌ Error updating product quantity:', error);
      throw error;
    }

    console.log('✅ Product quantity updated successfully:', data);
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('🔥 updateProductQuantity error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// ==========================================
// PRODUCT FUNCTIONS
// ==========================================

export const createProduct = async (supabase, productData, actorName) => {
  try {
    const { data, error } = await supabase.from('products').insert([productData]).select();
    if (error) throw error;

    const message = `${actorName} created a new product: ${productData.name}.`;
    await createTeamNotification(supabase, { message, type: 'product_add', actorName });

    return { success: true, data: data[0] };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateProduct = async (supabase, productId, productData, actorName) => {
  try {
    const { data, error } = await supabase.from('products').update(productData).eq('id', productId).select();
    if (error) throw error;

    const message = `${actorName} updated the product: ${productData.name}.`;
    await createTeamNotification(supabase, { message, type: 'product_update', actorName });

    return { success: true, data: data[0] };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteProduct = async (supabase, productId, productName, actorName) => {
  try {
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) throw error;

    const message = `${actorName} deleted the product: ${productName}.`;
    await createTeamNotification(supabase, { message, type: 'product_delete', actorName });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ==========================================
// SUPPLIER FUNCTIONS
// ==========================================

export const createSupplier = async (supabase, supplierData, actorName) => {
  try {
    const { data, error } = await supabase.from('suppliers').insert([supplierData]).select();
    if (error) throw error;

    const message = `${actorName} created a new supplier: ${supplierData.name}.`;
    await createTeamNotification(supabase, { message, type: 'supplier_add', actorName });

    return { success: true, data: data[0] };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateSupplier = async (supabase, supplierId, supplierData, actorName) => {
  try {
    const { data, error } = await supabase.from('suppliers').update(supplierData).eq('id', supplierId).select();
    if (error) throw error;

    const message = `${actorName} updated the supplier: ${supplierData.name}.`;
    await createTeamNotification(supabase, { message, type: 'supplier_update', actorName });

    return { success: true, data: data[0] };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteSupplier = async (supabase, supplierId, supplierName, actorName) => {
  try {
    // Get current user
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) throw new Error('No user logged in');

    // Check for existing "No Supplier"
    let { data: noSupplier } = await supabase
      .from('suppliers')
      .select('id')
      .eq('name', 'No Supplier')
      .maybeSingle();

    let noSupplierId = noSupplier?.id;

    // If "No Supplier" doesn't exist, create it
    if (!noSupplierId) {
      console.log('📦 Creating "No Supplier" entry...');
      const { data: created, error: createError } = await supabase
        .from('suppliers')
        .insert([
          {
            name: 'No Supplier',
            email: 'nosupplier@system.local',
            phone: 'N/A',
            city: 'System',
            country: 'System',
            user_id: currentUser.id,
          }
        ])
        .select('id')
        .single();

      if (createError) {
        console.error('❌ Error creating "No Supplier":', createError);
        throw createError;
      }
      noSupplierId = created.id;
      console.log('✅ "No Supplier" created:', noSupplierId);
    }

    // Reassign all products to "No Supplier"
    console.log('📦 Reassigning products to "No Supplier"...');
    const { error: updateError } = await supabase
      .from('products')
      .update({ supplier_id: noSupplierId })
      .eq('supplier_id', supplierId);

    if (updateError) {
      console.error('❌ Error updating products:', updateError);
      throw updateError;
    }
    console.log('✅ Products reassigned to "No Supplier"');

    const { error } = await supabase.from('suppliers').delete().eq('id', supplierId);
    if (error) throw error;

    const message = `${actorName} deleted the supplier: ${supplierName}.`;
    await createTeamNotification(supabase, { message, type: 'supplier_delete', actorName });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ==========================================
// CATEGORY FUNCTIONS
// ==========================================

export const createCategory = async (supabase, categoryData, actorName) => {
  try {
    const { data, error } = await supabase.from('categories').insert([categoryData]).select();
    if (error) throw error;

    const message = `${actorName} created a new category: ${categoryData.name}.`;
    await createTeamNotification(supabase, { message, type: 'category_add', actorName });

    return { success: true, data: data[0] };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateCategory = async (supabase, categoryId, categoryData, actorName) => {
  try {
    const { data, error } = await supabase.from('categories').update(categoryData).eq('id', categoryId).select();
    if (error) throw error;

    const message = `${actorName} updated the category: ${categoryData.name}.`;
    await createTeamNotification(supabase, { message, type: 'category_update', actorName });

    return { success: true, data: data[0] };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteCategory = async (supabase, categoryId, categoryName, actorName) => {
  try {
    const { error } = await supabase.from('categories').delete().eq('id', categoryId);
    if (error) throw error;

    const message = `${actorName} deleted the category: ${categoryName}.`;
    await createTeamNotification(supabase, { message, type: 'category_delete', actorName });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};



// ==========================================
// STAFF MANAGEMENT FUNCTIONS
// ==========================================

export const createStaffUser = async (supabase, { email, password, name, role = 'staff' }) => {
  return await signUpUser(supabase, name, email, password, role);
};

export const fetchStaffUsers = async (supabase) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .in('role', ['admin', 'staff', 'manager', 'viewer']);

    if (error) {
      console.error('fetchStaffUsers error:', error);
      throw error;
    }

    console.log('fetchStaffUsers - data:', data);

    // Debug: Check if names are present
    data?.forEach(user => {
      console.log(`Staff: ${user.id} - Name: "${user.name}" - Email: "${user.email}"`);
    });

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('fetchStaffUsers catch error:', error);
    return { success: false, error: error.message };
  }
};

// Update staff member's role
export const updateStaffRole = async (supabase, userId, newRole) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId)
      .select();

    if (error) throw error;

    console.log('updateStaffRole - success:', data);
    return { success: true, data: data[0] };
  } catch (error) {
    console.error('updateStaffRole error:', error);
    return { success: false, error: error.message };
  }
};

// Delete staff user
export const deleteStaffUser = async (supabase, userId, staffName, actorName) => {
  try {
    console.log(`🗑️  Deleting staff user: ${staffName} (ID: ${userId})`);

    // Use RPC function to safely delete user with proper permissions
    console.log(`📤 Calling safe_delete_staff_user RPC...`);
    const { data, error: rpcError } = await supabase.rpc('safe_delete_staff_user', {
      p_user_id: userId
    });

    if (rpcError) {
      console.error('❌ RPC Error deleting user:', rpcError);
      throw rpcError;
    }

    if (data && !data.success) {
      console.error('❌ RPC returned error:', data.error);
      throw new Error(data.error || 'Failed to delete user');
    }

    console.log(`✅ User deleted via RPC:`, data);

    // Create notification
    const message = `${actorName} deleted staff member: ${staffName}.`;
    await createTeamNotification(supabase, { message, type: 'staff_delete', actorName });

    console.log(`✅ Staff user deleted successfully: ${staffName}`);
    return { success: true };
  } catch (error) {
    console.error('❌ deleteStaffUser error:', error);
    return { success: false, error: error.message };
  }
};

// ==========================================
// PERMISSION MANAGEMENT FUNCTIONS
// ==========================================

export const updateUserPermission = async (supabase, { userId, featureKey, canView, canCreate, canUpdate, canDelete }) => {
  try {
    const { data, error } = await supabase.rpc('update_staff_permission', {
      p_user_id: userId,
      p_feature_key: featureKey,
      p_can_view: canView,
      p_can_create: canCreate,
      p_can_update: canUpdate,
      p_can_delete: canDelete
    });

    if (error) throw error;

    return { success: true, data };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Get user permissions by feature
export const getUserFeaturePermissions = async (supabase, userId, featureKey) => {
  try {
    const { data, error } = await supabase
      .from('staff_permissions')
      .select('*')
      .eq('user_id', userId)
      .eq('feature_key', featureKey)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found

    return {
      success: true,
      permission: data || {
        can_view: false,
        can_create: false,
        can_update: false,
        can_delete: false,
      }
    };
  } catch (error) {
    console.error('getUserFeaturePermissions error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Get all user permissions
export const getAllUserPermissions = async (supabase, userId) => {
  try {
    const { data, error } = await supabase
      .from('staff_permissions')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

    // Convert array to object keyed by feature_key
    const permissionsObj = {};
    if (data && Array.isArray(data)) {
      data.forEach((perm) => {
        permissionsObj[perm.feature_key] = {
          can_view: perm.can_view || false,
          can_create: perm.can_create || false,
          can_update: perm.can_update || false,
          can_delete: perm.can_delete || false,
        };
      });
    }

    return { success: true, permissions: permissionsObj };
  } catch (error) {
    console.error('getAllUserPermissions error:', error);
    return { success: false, error: error.message };
  }
};

// ==========================================
// NOTIFICATION FUNCTIONS
// ==========================================

export const createTeamNotification = async (supabase, { message, type, actorName, actorId }) => {
  try {
    console.log(`[createTeamNotification] 📢 START - Creating team notification`);
    console.log(`[createTeamNotification] 📌 Type: ${type}`);
    console.log(`[createTeamNotification] 📝 Message: "${message}"`);
    console.log(`[createTeamNotification] 👤 Actor: ${actorName} (ID: ${actorId})`);

    // 1. Get all staff members
    console.log('[createTeamNotification] 👥 Step 1: Fetching all staff members...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, role');

    if (usersError) {
      console.error('[createTeamNotification] ❌ Error fetching staff users:', usersError);
      throw usersError;
    }

    console.log(`[createTeamNotification] ✅ Found ${users?.length || 0} staff members`);
    if (users && users.length > 0) {
      console.log('[createTeamNotification] 📋 Staff members:');
      users.forEach(u => {
        console.log(`[createTeamNotification]   - ${u.name || u.email} (ID: ${u.id}, Role: ${u.role})`);
      });
    }

    // 2. Use all users for notifications (entire team should be notified)
    let usersToNotify = users || [];
    console.log(`[createTeamNotification] 📤 Will notify ${usersToNotify.length} users`);

    if (usersToNotify.length === 0) {
      console.log('[createTeamNotification] ⚠️ No users to notify');
      return { success: true, message: "No users to notify." };
    }

    // 3. Deduplicate: avoid inserting the same message for the same user multiple times
    const userIds = usersToNotify.map(u => u.id);
    console.log(`[createTeamNotification] 🔎 Step 2: Checking for recent identical notifications for ${userIds.length} users`);
    console.log(`[createTeamNotification] 🔎 Message to check: "${message}"`);
    console.log(`[createTeamNotification] 🔎 Type: ${type}`);

    const twoSecondsAgo = new Date(Date.now() - 2 * 1000).toISOString();
    console.log(`[createTeamNotification] 🔎 Checking for notifications created after: ${twoSecondsAgo}`);

    const { data: existing, error: existingError } = await supabase
      .from('notifications')
      .select('id, user_id, message, type, created_at')
      .in('user_id', userIds)
      .eq('message', message)
      .eq('type', type)
      .gte('created_at', twoSecondsAgo);

    if (existingError) {
      console.error('[createTeamNotification] ❌ Error checking existing notifications for dedupe:', existingError);
      throw existingError;
    }

    console.log(`[createTeamNotification] 🔍 Found ${(existing || []).length} recent identical notifications`);
    if (existing && existing.length > 0) {
      console.log('[createTeamNotification] 📋 Existing notifications:');
      existing.forEach(n => {
        console.log(`[createTeamNotification]   - ID: ${n.id}, User: ${n.user_id}, Created: ${n.created_at}`);
      });
    }

    const existingUserIds = (existing || []).map(r => r.user_id);
    const toInsert = usersToNotify.filter(u => !existingUserIds.includes(u.id));

    console.log(`[createTeamNotification] 📝 Users to insert: ${toInsert.length} (after dedupe)`);
    if (toInsert.length > 0) {
      console.log('[createTeamNotification] 📋 Users to be notified:');
      toInsert.forEach(u => {
        console.log(`[createTeamNotification]   - ${u.name || u.email} (ID: ${u.id})`);
      });
    }

    if (toInsert.length === 0) {
      console.log('[createTeamNotification] ⚠️ No new notifications to insert after dedupe - skipping insert');
      return { success: true, message: 'No new notifications to insert (deduped).' };
    }

    // 4. Create a notification for each remaining user and bulk insert
    const notifications = toInsert.map(user => ({
      user_id: user.id,
      message: message,
      type: type
    }));

    console.log(`[createTeamNotification] 📝 Step 3: Preparing ${notifications.length} notification records`);
    console.log('[createTeamNotification] 📋 Records to insert:');
    notifications.forEach((n, idx) => {
      console.log(`[createTeamNotification]   [${idx + 1}] User: ${n.user_id}, Type: ${n.type}`);
    });

    // 5. Bulk insert notifications
    console.log('[createTeamNotification] 🚀 Step 4: Inserting notifications into database...');
    const { error: insertError, data: insertedData } = await supabase
      .from('notifications')
      .insert(notifications);

    if (insertError) {
      console.error('[createTeamNotification] ❌ Error inserting notifications:', insertError);
      console.error('[createTeamNotification] ❌ Error details:', JSON.stringify(insertError, null, 2));
      throw insertError;
    }

    console.log(`[createTeamNotification] ✅ Successfully inserted ${notifications.length} notifications`);
    console.log('[createTeamNotification] 📊 Inserted data:', insertedData);
    console.log('[createTeamNotification] 🟢 SUCCESS');
    return { success: true };

  } catch (error) {
    console.error('[createTeamNotification] 🔥 ERROR in createTeamNotification:', error);
    console.error('[createTeamNotification] 🔥 Error message:', error.message);
    console.error('[createTeamNotification] 🔥 Error stack:', error.stack);
    console.log('[createTeamNotification] 🔴 FAILED');
    return { success: false, error: error.message };
  }
};

export const insertStockLog = async (supabase, userId, productId, type, quantity, reason, referenceNumber) => {
  console.log('--- insertStockLog called ---');
  console.log('Inserting:', { userId, productId, type, quantity, reason, referenceNumber });

  try {
    const { data, error } = await supabase
      .from('stock_logs')
      .insert([
        {
          user_id: userId,
          product_id: productId,
          type,
          quantity,
          reason,
          reference_number: referenceNumber,
          created_at: new Date().toISOString(),
        },
      ]);

    console.log('Supabase insert response:', { data, error });

    if (error) {
      console.error('Stock log insert failed:', error);
      throw error;
    }

    console.log('Stock log inserted successfully');
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Stock log insert error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Combined Stock In - Log + Update Product
export const handleStockIn = async (
  supabase,
  userId,
  actorName,
  productId,
  quantity,
  reason,
  currentQuantity,
  referenceNumber = null,
  sendNotification = true  // ← ADD THIS LINE
) => {
  console.log('=== handleStockIn called ===');
  console.log('Parameters:', { userId, actorName, productId, quantity, reason, currentQuantity, referenceNumber, sendNotification });

  try {
    // 1. Insert stock log
    console.log('Step 1: Inserting stock log...');
    const logResult = await insertStockLog(supabase, userId, productId, 'in', quantity, reason, referenceNumber);
    console.log('Stock log result:', logResult);

    if (!logResult.success) {
      console.error('Stock log insert failed:', logResult.error);
      throw new Error(logResult.error);
    }

    // 2. Update product quantity
    const newQuantity = currentQuantity + quantity;
    console.log('Step 2: Updating product quantity from', currentQuantity, 'to', newQuantity);
    const updateResult = await updateProductQuantity(supabase, productId, newQuantity, userId);
    console.log('Product update result:', updateResult);

    if (!updateResult.success) {
      console.error('Product update failed:', updateResult.error);
      throw new Error(updateResult.error);
    }

    // 3. Create notification ONLY IF sendNotification is true ← FIXED HERE
    if (sendNotification) {  // ← ADD THIS CHECK
      const { data: product, error: productError } = await supabase.from('products').select('name, low_stock_alert').eq('id', productId).single();
      if (productError) {
        console.error('Could not fetch product name for notification', productError);
      } else {
        const message = `${actorName} stocked in ${quantity} units of ${product.name}.`;
        await createTeamNotification(supabase, { message, type: 'stock_in', actorName });

        // Check for low stock alert
        if (newQuantity <= product.low_stock_alert) {
          const lowStockMessage = `${product.name} is low on stock (${newQuantity} remaining).`;
          await createTeamNotification(supabase, { message: lowStockMessage, type: 'low_stock_alert', actorName });
        }
      }
    }

    console.log('=== handleStockIn completed successfully ===');
    return {
      success: true,
      newQuantity,
    };
  } catch (error) {
    console.error('=== handleStockIn failed ===');
    console.error('Error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Combined Stock Out - Log + Update Product
export const handleStockOut = async (
  supabase,
  userId,
  actorName,
  productId,
  quantity,
  reason,
  currentQuantity,
  referenceNumber = null,
  sendNotification = true  // ← ADD THIS LINE
) => {
  try {
    // Check if enough quantity available
    if (quantity > currentQuantity) {
      throw new Error(`Only ${currentQuantity} units available`);
    }

    // 1. Insert stock log
    const logResult = await insertStockLog(supabase, userId, productId, 'out', quantity, reason, referenceNumber);

    if (!logResult.success) {
      throw new Error(logResult.error);
    }

    // 2. Update product quantity
    const newQuantity = currentQuantity - quantity;
    const updateResult = await updateProductQuantity(supabase, productId, newQuantity, userId);

    if (!updateResult.success) {
      throw new Error(updateResult.error);
    }

    // 3. Create notification ONLY IF sendNotification is true ← FIXED HERE
    if (sendNotification) {  // ← ADD THIS CHECK
      const { data: product, error: productError } = await supabase.from('products').select('name, low_stock_alert').eq('id', productId).single();
      if (productError) {
        console.error('Could not fetch product name for notification', productError);
      } else {
        const message = `${actorName} stocked out ${quantity} units of ${product.name}.`;
        await createTeamNotification(supabase, { message, type: 'stock_out', actorName });

        // Check for low stock alert
        if (newQuantity <= product.low_stock_alert) {
          const lowStockMessage = `${product.name} is low on stock (${newQuantity} remaining).`;
          await createTeamNotification(supabase, { message: lowStockMessage, type: 'low_stock_alert', actorName });
        }
      }
    }

    return {
      success: true,
      newQuantity,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

// Insert Sale
export const insertSale = async (supabase, userId, total, notes, items) => {
  try {
    const { data, error } = await supabase
      .from('sales')
      .insert([
        {
          user_id: userId,
          total_amount: total,
          notes,
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) throw error;

    const saleId = data[0].id;

    // Insert sale items
    const saleItems = items.map(item => ({
      sale_id: saleId,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      subtotal: item.subtotal,
    }));

    const { error: itemsError } = await supabase
      .from('sale_items')
      .insert(saleItems);

    if (itemsError) throw itemsError;

    return {
      success: true,
      sale: data[0],
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};
export const subscribeToSalesChanges = (supabase, callback) => {
  console.log('[subscribeToSalesChanges] 🟢 Setting up real-time sales subscription');

  const subscription = supabase
    .channel('public:sales')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'sales'
      },
      (payload) => {
        console.log('[subscribeToSalesChanges] 📊 New sale detected:', payload);
        callback('new_sale', payload);
      }
    )
    .subscribe((status) => {
      console.log('[subscribeToSalesChanges] 📡 Subscription status:', status);
    });

  return () => {
    console.log('[subscribeToSalesChanges] 🔌 Unsubscribing from sales changes');
    supabase.removeChannel(subscription);
  };
};

// Insert Sale with Notification
export const insertSaleWithNotification = async (supabase, userId, actorName, total, notes, saleItems, invoiceItems) => {
  try {
    console.log('[insertSaleWithNotification] 🟢 START');
    console.log('[insertSaleWithNotification] 📌 Parameters:', {
      userId,
      actorName,
      total,
      itemCount: saleItems?.length || 0  // ✅ FIX 1
    });

    // Parse notes to get invoice details
    const notesObj = typeof notes === 'string' ? JSON.parse(notes) : notes;
    const invoiceNumber = notesObj.invoiceNumber;
    const customerName = notesObj.customerName;
    const paymentMethod = notesObj.paymentMethod;

    console.log('[insertSaleWithNotification] 📋 Invoice Details:');
    console.log('[insertSaleWithNotification]   - Invoice #:', invoiceNumber);
    console.log('[insertSaleWithNotification]   - Customer:', customerName);
    console.log('[insertSaleWithNotification]   - Amount: $', total);
    console.log('[insertSaleWithNotification]   - Payment:', paymentMethod);
    console.log('[insertSaleWithNotification]   - Items:', saleItems?.length || 0);  // ✅ FIX 2

    // Step 1: Insert the sale
    console.log('[insertSaleWithNotification] 📝 Step 1: Inserting sale record...');
    const saleResult = await insertSale(supabase, userId, total, JSON.stringify(notesObj), saleItems);  // ✅ FIX 3
    console.log('[insertSaleWithNotification] 📥 Sale result:', saleResult);

    if (!saleResult.success) {
      console.error('[insertSaleWithNotification] ❌ Sale insert failed:', saleResult.error);
      throw new Error(saleResult.error);
    }

    console.log('[insertSaleWithNotification] ✅ Sale created successfully, Sale ID:', saleResult.sale?.id);

    // Step 2: Create notification for team members
    console.log('[insertSaleWithNotification] 🔔 Step 2: Creating team notification...');

    // ✅ FIX 4: Build product list
    let productList = '';
    console.log('[insertSaleWithNotification] 📦 Building product list...');
    console.log('[insertSaleWithNotification] 📦 invoiceItems exists:', !!invoiceItems);
    console.log('[insertSaleWithNotification] 📦 invoiceItems is array:', Array.isArray(invoiceItems));
    console.log('[insertSaleWithNotification] 📦 invoiceItems length:', invoiceItems?.length);

    if (invoiceItems && Array.isArray(invoiceItems) && invoiceItems.length > 0) {
      console.log('[insertSaleWithNotification] 📦 Processing items...');
      const productNames = invoiceItems.map(item => {
        const productName = item.productName || 'Unknown Product';
        const quantity = item.quantity || 0;
        console.log('[insertSaleWithNotification]   - Product:', productName, 'Qty:', quantity);
        return `${productName} (${quantity})`;
      }).join(', ');
      productList = ` - Products: ${productNames}`;
      console.log('[insertSaleWithNotification] 📦 Product list:', productList);
    } else {
      console.log('[insertSaleWithNotification] ⚠️ No invoiceItems provided for notification');
    }

    const message = `${actorName} generated invoice #${invoiceNumber} for ${customerName} - $${total.toFixed(2)} (${paymentMethod})${productList}`;
    console.log('[insertSaleWithNotification] 📬 Notification message:', message);

    const notificationResult = await createTeamNotification(supabase, {
      message,
      type: 'sales_invoice',
      actorName,
      actorId: userId
    });

    console.log('[insertSaleWithNotification] 📥 Notification result:', notificationResult);

    if (!notificationResult.success) {
      console.warn('[insertSaleWithNotification] ⚠️ Notification creation failed, but sale was created');
      console.warn('[insertSaleWithNotification] ⚠️ Error:', notificationResult.error);
    } else {
      console.log('[insertSaleWithNotification] ✅ Notification created successfully');
    }

    console.log('[insertSaleWithNotification] 🟢 SUCCESS - Sale and notification created');
    return saleResult;

  } catch (error) {
    console.error('[insertSaleWithNotification] 🔥 ERROR:', error);
    console.error('[insertSaleWithNotification] 🔥 Error message:', error.message);
    console.error('[insertSaleWithNotification] 🔥 Error stack:', error.stack);
    console.log('[insertSaleWithNotification] 🔴 FAILED');
    return {
      success: false,
      error: error.message,
    };
  }
};

// Fetch Sales
export const fetchSales = async (supabase, userId, limit = null) => {
  try {
    let query = supabase
      .from('sales')
      .select(`
        *,
        sale_items (
          product_id,
          quantity,
          unit_price,
          subtotal,
          products (
            name
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Transform data to match expected format
    const sales = data.map(sale => ({
      id: sale.id,
      invoiceNumber: JSON.parse(sale.notes).invoiceNumber,
      customerName: JSON.parse(sale.notes).customerName,
      date: sale.created_at,
      total: sale.total_amount,
      paymentMethod: JSON.parse(sale.notes).paymentMethod,
      items: sale.sale_items.map(item => ({
        productId: item.product_id,
        productName: item.products.name,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        total: item.subtotal,
      })),
    }));

    return {
      success: true,
      sales,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

// Fetch Sale By ID - FIXED (removed .single())
export const fetchSaleById = async (supabase, saleId, userId) => {
  try {
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        sale_items (
          product_id,
          quantity,
          unit_price,
          subtotal,
          products (
            name
          )
        )
      `)
      .eq('id', saleId)
      .eq('user_id', userId);

    if (error) throw error;

    const saleData = data?.[0];
    if (!saleData) {
      throw new Error('Sale not found');
    }

    // Transform data to match expected format
    const sale = {
      id: saleData.id,
      invoiceNumber: JSON.parse(saleData.notes).invoiceNumber,
      customerName: JSON.parse(saleData.notes).customerName,
      date: saleData.created_at,
      total: saleData.total_amount,
      paymentMethod: JSON.parse(saleData.notes).paymentMethod,
      items: saleData.sale_items.map(item => ({
        productId: item.product_id,
        productName: item.products.name,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        total: item.subtotal,
      })),
    };

    return {
      success: true,
      sale,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

export const fetchDashboardData = async (supabase) => {
  try {
    console.log('📊 Calling RPC get_team_dashboard_data...');
    const { data, error } = await supabase.rpc('get_team_dashboard_data');

    if (error) {
      console.error('❌ Error calling get_team_dashboard_data RPC:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      throw error;
    }

    console.log('✅ Team dashboard data loaded via RPC:', data);

    // Parse JSON data if it's returned as string
    let parsedData = data;
    if (typeof data === 'string') {
      parsedData = JSON.parse(data);
    }

    // Ensure arrays are never null and handle JSON arrays
    const topProducts = Array.isArray(parsedData.topProducts)
      ? parsedData.topProducts
      : (parsedData.topProducts ? JSON.parse(JSON.stringify(parsedData.topProducts)) : []);

    const recentSales = Array.isArray(parsedData.recentSales)
      ? parsedData.recentSales
      : (parsedData.recentSales ? JSON.parse(JSON.stringify(parsedData.recentSales)) : []);

    const todaysSales = Array.isArray(parsedData.todaysSales)
      ? parsedData.todaysSales
      : (parsedData.todaysSales ? JSON.parse(JSON.stringify(parsedData.todaysSales)) : []);

    const notifications = Array.isArray(parsedData.notifications)
      ? parsedData.notifications
      : (parsedData.notifications ? JSON.parse(JSON.stringify(parsedData.notifications)) : []);

    console.log('✅ Dashboard data extracted:', {
      totalProducts: parsedData.totalProducts,
      lowStockCount: parsedData.lowStockCount,
      todaysSalesCount: parsedData.todaysSalesCount,
      todaysSalesAmount: parsedData.todaysSalesAmount,
      salesCount: parsedData.salesCount,
      monthlySales: parsedData.monthlySales,
      todaysSalesArray: todaysSales.length,
      topProducts: topProducts.length,
      recentSales: recentSales.length,
      notifications: notifications.length,
    });

    return {
      success: true,
      data: {
        totalProducts: parsedData.totalProducts || 0,
        lowStockCount: parsedData.lowStockCount || 0,
        todaysSalesCount: parsedData.todaysSalesCount || 0,
        todaysSalesAmount: parsedData.todaysSalesAmount || 0,
        todaysSales: todaysSales,
        salesCount: parsedData.salesCount || 0,
        monthlySales: parsedData.monthlySales || 0,
        topProducts: topProducts,
        recentSales: recentSales,
        notifications: notifications,
      },
    };

  } catch (error) {
    console.error('🔥 Error in fetchDashboardData (RPC):', error);
    console.error('🔥 Full error:', JSON.stringify(error, null, 2));
    return { success: false, error: error.message };
  }
};

// Real-time dashboard data subscription
// Fix for subscribeToDashboardChanges in lib/database.js
// Find this section around line 1350-1420 and replace it:

// Real-time dashboard data subscription
export const subscribeToDashboardChanges = (supabase, callback) => {
  console.log('📊 Dashboard: Setting up real-time subscriptions...');

  // Subscribe to sales changes
  const salesSubscription = supabase
    .channel('public:sales')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'sales' },
      (payload) => {
        console.log('📊 Dashboard: Sales data changed:', payload.eventType);
        callback('sales_change');
      }
    )
    .subscribe();

  // Subscribe to sale_items changes
  const saleItemsSubscription = supabase
    .channel('public:sale_items')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'sale_items' },
      (payload) => {
        console.log('📊 Dashboard: Sale items changed:', payload.eventType);
        callback('sale_items_change');
      }
    )
    .subscribe();

  // Subscribe to products changes
  const productsSubscription = supabase  // ✅ FIXED: Was "productsSubsc8ption" (with 8)
    .channel('public:products')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'products' },
      (payload) => {
        console.log('📊 Dashboard: Products data changed:', payload.eventType);
        callback('products_change');
      }
    )
    .subscribe();

  // Subscribe to stock_logs changes
  const stockLogsSubscription = supabase
    .channel('public:stock_logs')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'stock_logs' },
      (payload) => {
        console.log('📊 Dashboard: Stock log added:', payload.eventType);
        callback('stock_change');
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    console.log('🔌 Unsubscribing from dashboard changes');
    supabase.removeChannel(salesSubscription);
    supabase.removeChannel(saleItemsSubscription);
    supabase.removeChannel(productsSubscription);  // ✅ FIXED: Was "productsSubsc8ption"
    supabase.removeChannel(stockLogsSubscription);
  };
};


// Subscribe to staff changes (add/delete)
export const subscribeToStaffChanges = (supabase, callback) => {
  console.log('🔌 Setting up staff real-time subscription...');

  const usersSubscription = supabase
    .channel('public:users')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'users' },
      (payload) => {
        console.log('👥 Staff: Users table changed:', payload.eventType);
        if (payload.eventType === 'DELETE') {
          console.log('🗑️  Staff member deleted:', payload.old_record?.id);
          callback('staff_delete');
        } else if (payload.eventType === 'INSERT') {
          console.log('➕ New staff member added:', payload.new_record?.id);
          callback('staff_insert');
        } else if (payload.eventType === 'UPDATE') {
          console.log('✏️  Staff member updated:', payload.new_record?.id);
          callback('staff_update');
        }
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    console.log('🔌 Unsubscribing from staff changes');
    supabase.removeChannel(usersSubscription);
  };
};

export const fetchReportData = async (supabase, userId, period) => {
  try {
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case 'daily':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'weekly':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(now.getMonth() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    const startTime = startDate.toISOString();

    // 1. Get user role to determine if we should fetch all sales or just user's sales
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (userError) {
      console.warn('Could not fetch user role, assuming admin access:', userError);
    }

    const isAdmin = userData?.role === 'admin';

    console.log('📊 fetchReportData - User role:', userData?.role, 'Is Admin:', isAdmin);

    // 2. Get sales stats for the period
    // Try to use RPC function first if it exists
    let periodSales = null;
    let salesError = null;

    if (isAdmin) {
      // Try RPC function first (if it exists)
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_all_sales_for_period', {
        p_start_time: startTime
      });

      if (!rpcError) {
        console.log('✅ Using RPC function to fetch all sales');
        periodSales = rpcData;
      } else {
        console.warn('⚠️ RPC function not available, falling back to direct query:', rpcError.message);
        // Fallback: try direct query without RLS filter
        const { data, error } = await supabase
          .from('sales')
          .select('total_amount, user_id, sale_items(product_id, quantity, products(selling_price))')
          .gte('created_at', startTime)
          .order('created_at', { ascending: false });

        periodSales = data;
        salesError = error;
      }
    } else {
      // For non-admin users, only fetch their own sales
      const { data, error } = await supabase
        .from('sales')
        .select('total_amount, user_id, sale_items(product_id, quantity, products(selling_price))')
        .eq('user_id', userId)
        .gte('created_at', startTime)
        .order('created_at', { ascending: false });

      periodSales = data;
      salesError = error;
    }

    if (salesError) throw salesError;

    console.log('📊 Reports - Period Sales Data (Admin:', isAdmin, '):', { salesCount: periodSales?.length, startTime, period });
    console.log('📊 Period Sales Details:', JSON.stringify(periodSales?.slice(0, 2), null, 2));

    const totalSales = periodSales.reduce((sum, s) => sum + s.total_amount, 0);
    const ordersCount = periodSales.length;
    const avgOrderValue = ordersCount > 0 ? totalSales / ordersCount : 0;

    // 3. Get all products for inventory stats
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, cost_price, selling_price, quantity, low_stock_alert, sku');

    if (productsError) throw productsError;

    const stockValue = products.reduce((sum, p) => sum + (p.cost_price || 0) * (p.quantity || 0), 0);
    const lowStockProducts = products
      .filter(p => p.quantity <= p.low_stock_alert)
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, 5);

    // 4. Calculate top selling products for the period
    const salesMap = {};
    periodSales.forEach(sale => {
      sale.sale_items.forEach(item => {
        salesMap[item.product_id] = (salesMap[item.product_id] || 0) + item.quantity;
      });
    });

    console.log('📊 Sales Map (product_id -> total_quantity):', salesMap);

    const topProducts = products
      .map(p => ({
        ...p,
        soldCount: salesMap[p.id] || 0,
      }))
      .filter(p => p.soldCount > 0)
      .sort((a, b) => b.soldCount - a.soldCount)
      .slice(0, 5);

    console.log('📊 Top Products Final:', topProducts.map(p => ({ name: p.name, soldCount: p.soldCount })));

    return {
      success: true,
      data: {
        totalSales,
        ordersCount,
        avgOrderValue,
        stockValue,
        lowStockProducts,
        topProducts,
        totalProductsCount: products.length,
        inStockCount: products.filter(p => p.quantity > 0).length,
        outOfStockCount: products.filter(p => p.quantity === 0).length,
      }
    };

  } catch (error) {
    console.error('Error fetching report data:', error);
    return { success: false, error: error.message };
  }
};

export const fetchAllActivity = async (supabase, userId) => {
  try {
    // 1. Fetch all notifications for the user
    const { data: notifications, error: notificationsError } = await supabase
      .from('notifications')
      .select('id, created_at, message, type')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (notificationsError) throw notificationsError;

    const formattedNotifications = notifications.map(n => ({
      ...n,
      id: `notif-${n.id}`
    }));

    return { success: true, data: formattedNotifications };

  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteActivity = async (supabase, activityId) => {
  console.log(`[deleteActivity] Received request to delete: ${activityId}`);
  try {
    const firstDashIndex = activityId.indexOf('-');
    if (firstDashIndex === -1) {
      console.error('[deleteActivity] Invalid activityId format:', activityId);
      throw new Error('Invalid activity ID format. Expected "type-id".');
    }

    const type = activityId.substring(0, firstDashIndex);
    const id = activityId.substring(firstDashIndex + 1);

    let tableName;

    if (type === 'log') {
      tableName = 'stock_logs';
    } else if (type === 'notif') {
      tableName = 'notifications';
    } else {
      console.error(`[deleteActivity] Unknown activity type: ${type}`);
      throw new Error(`Invalid activity type: ${type}`);
    }

    console.log(`[deleteActivity] Deleting from table '${tableName}' where id = ${id}`);

    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`[deleteActivity] Supabase error deleting from ${tableName}:`, error);
      throw error;
    }

    console.log(`[deleteActivity] Successfully deleted record with id ${id} from ${tableName}`);
    return { success: true };
  } catch (error) {
    console.error(`[deleteActivity] Catch block error for ${activityId}:`, error);
    return { success: false, error: error.message };
  }
};

// Get Low Stock Products
export const getLowStockProducts = async (supabase) => {
  try {
    console.log('📦 Fetching low stock products...');
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .lte('quantity', 5)
      .order('quantity', { ascending: true });

    if (error) {
      console.error('❌ Error fetching low stock products:', error);
      throw error;
    }

    console.log('✅ Low stock products fetched:', data ? data.length : 0);
    return { success: true, products: data || [] };
  } catch (error) {
    console.error('🔥 Error in getLowStockProducts:', error);
    return { success: false, products: [], error: error.message };
  }
};

// Real-time subscription for suppliers
export const subscribeToSuppliers = (supabase, callback) => {
  console.log('🔌 Setting up suppliers real-time subscription...');

  const subscription = supabase
    .channel('public:suppliers')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'suppliers' },
      (payload) => {
        console.log('📡 Suppliers data changed:', payload.eventType);
        callback(payload);
      }
    )
    .subscribe();

  return () => {
    console.log('❌ Unsubscribing from suppliers');
    supabase.removeChannel(subscription);
  };
};

// Real-time subscription for categories
export const subscribeToCategories = (supabase, callback) => {
  console.log('🔌 Setting up categories real-time subscription...');

  const subscription = supabase
    .channel('public:categories')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'categories' },
      (payload) => {
        console.log('📡 Categories data changed:', payload.eventType);
        callback(payload);
      }
    )
    .subscribe();

  return () => {
    console.log('❌ Unsubscribing from categories');
    supabase.removeChannel(subscription);
  };
};

// Real-time subscription for products
export const subscribeToProducts = (supabase, callback) => {
  console.log('🔌 Setting up products real-time subscription...');

  const subscription = supabase
    .channel('public:products')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'products' },
      (payload) => {
        console.log('📡 Products data changed:', payload.eventType, payload.new);
        callback(payload);
      }
    )
    .subscribe();

  return () => {
    console.log('❌ Unsubscribing from products');
    supabase.removeChannel(subscription);
  };
};

// ==========================================
// FETCH ALL NOTIFICATIONS FOR A USER (WITH DETAILED LOGGING)
// ==========================================

export const fetchAllNotifications = async (supabase, userId, role) => {
  console.log('[fetchAllNotifications] 🟢 START');
  console.log('[fetchAllNotifications] 📌 Parameters:', { userId, role });

  try {
    console.log('[fetchAllNotifications] 📢 Fetching all notifications for user:', userId, 'Role:', role);

    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    // If NOT admin, explicitly filter by user_id to ensure relevant data
    // (Though RLS usually handles this, explicit is better for UI consistency)
    if (role !== 'admin') {
      console.log('[fetchAllNotifications] 🔍 Non-admin user, filtering by user_id:', userId);
      query = query.eq('user_id', userId);
    } else {
      console.log('[fetchAllNotifications] 👑 Admin user, fetching all notifications for deduplication');
    }

    console.log('[fetchAllNotifications] 🔍 Executing query...');
    const { data, error } = await query;

    console.log('[fetchAllNotifications] 📥 Query completed');
    console.log('[fetchAllNotifications] ❌ Error:', error);
    console.log('[fetchAllNotifications] ✅ Data received:', data ? data.length : 0, 'notifications');

    if (error) {
      console.error('[fetchAllNotifications] ❌ Error fetching notifications:', error);
      console.error('[fetchAllNotifications] ❌ Error details:', JSON.stringify(error, null, 2));
      console.error('[fetchAllNotifications] ❌ Error code:', error.code);
      console.error('[fetchAllNotifications] ❌ Error message:', error.message);
      throw error;
    }

    console.log('[fetchAllNotifications] 📊 Raw data received from Supabase:', data ? data.length : 0, 'notifications');

    if (data && data.length > 0) {
      console.log('[fetchAllNotifications] 📋 First 3 notifications:');
      data.slice(0, 3).forEach((n, idx) => {
        console.log(`[fetchAllNotifications]   [${idx + 1}] ID: ${n.id}, Type: ${n.type}, User: ${n.user_id}, Message: "${n.message.substring(0, 50)}..."`);
      });
    } else {
      console.log('[fetchAllNotifications] ⚠️ No notifications found in database');
    }

    let finalData = data || [];

    // If Admin, deduplicate the notifications
    // Because the system inserts a notification row for EVERY user for the same event,
    // fetching "all" (without user_id filter) results in duplicates (one for each team member).
    // We want to show a unique list of EVENTS.
    if (role === 'admin' && finalData.length > 0) {
      console.log('[fetchAllNotifications] 🧹 Admin user - Starting deduplication...');
      console.log('[fetchAllNotifications] 🧹 Total notifications before dedup:', finalData.length);

      const uniqueEvents = [];
      const seenEvents = new Set();

      finalData.forEach((item, index) => {
        // Create a unique key for the EVENT
        // We ignore user_id, and look at message, type, and rough timestamp (minutes)
        // This groups "Same message sent to multiple people at the same time"
        const timeKey = new Date(item.created_at).toISOString().substring(0, 16); // Up to minute
        const key = `${item.type}|${item.message}|${timeKey}`;

        const isSeen = seenEvents.has(key);
        console.log(`[fetchAllNotifications] 🔄 Notification ${index + 1}/${finalData.length}`);
        console.log(`[fetchAllNotifications]   - ID: ${item.id}`);
        console.log(`[fetchAllNotifications]   - Type: ${item.type}`);
        console.log(`[fetchAllNotifications]   - Message: "${item.message.substring(0, 40)}..."`);
        console.log(`[fetchAllNotifications]   - Time Key: ${timeKey}`);
        console.log(`[fetchAllNotifications]   - Dedup Key: "${key}"`);
        console.log(`[fetchAllNotifications]   - Already Seen: ${isSeen}`);

        if (!isSeen) {
          seenEvents.add(key);
          uniqueEvents.push(item);
          console.log(`[fetchAllNotifications]   ✅ ADDED to unique events`);
        } else {
          console.log(`[fetchAllNotifications]   ⏭️ SKIPPED (duplicate)`);
        }
      });

      console.log(`[fetchAllNotifications] 📉 Deduplication complete: ${finalData.length} -> ${uniqueEvents.length} unique events`);
      finalData = uniqueEvents;
    } else if (role === 'admin') {
      console.log('[fetchAllNotifications] 🧹 Admin user but no notifications to deduplicate');
    } else {
      console.log('[fetchAllNotifications] 📋 Non-admin user - No deduplication needed (RLS filters by user)');
    }

    console.log('[fetchAllNotifications] ✅ Final notifications to return:', finalData.length);
    if (finalData.length > 0) {
      console.log('[fetchAllNotifications] 📋 Final data sample (first 3):');
      finalData.slice(0, 3).forEach((n, idx) => {
        console.log(`[fetchAllNotifications]   [${idx + 1}] Type: ${n.type}, Message: "${n.message.substring(0, 40)}..."`);
      });
    }

    console.log('[fetchAllNotifications] 🟢 SUCCESS');
    return { success: true, data: finalData };
  } catch (error) {
    console.error('[fetchAllNotifications] 🔥 ERROR in fetchAllNotifications:', error);
    console.error('[fetchAllNotifications] 🔥 Error stack:', error.stack);
    console.error('[fetchAllNotifications] 🔥 Full error object:', JSON.stringify(error, null, 2));
    console.log('[fetchAllNotifications] 🔴 FAILED');
    return { success: false, data: [], error: error.message };
  }
};
