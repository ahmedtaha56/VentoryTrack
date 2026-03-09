// Define all available roles and their permissions
export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  STAFF: 'staff',
  VIEWER: 'viewer',
};

// Role descriptions
export const ROLE_DESCRIPTIONS = {
  admin: {
    label: 'Admin',
    description: 'Full access to all features',
    color: '#d32f2f', // Red
  },
  manager: {
    label: 'Manager',
    description: 'Can manage products, staff, and view reports',
    color: '#f57c00', // Orange
  },
  staff: {
    label: 'Staff',
    description: 'Can manage stock and sales',
    color: '#1976d2', // Blue
  },
  viewer: {
    label: 'Viewer',
    description: 'Can only view data',
    color: '#388e3c', // Green
  },
};

// Feature permissions by role
export const ROLE_PERMISSIONS = {
  admin: {
    users: { view: true, create: true, update: true, delete: true },
    products: { view: true, create: true, update: true, delete: true },
    categories: { view: true, create: true, update: true, delete: true },
    suppliers: { view: true, create: true, update: true, delete: true },
    stock: { view: true, create: true, update: true, delete: true },
    sales: { view: true, create: true, update: true, delete: true },
    reports: { view: true, create: true, update: true, delete: true },
    settings: { view: true, create: true, update: true, delete: true },
  },
  manager: {
    users: { view: true, create: true, update: true, delete: true },
    products: { view: true, create: true, update: true, delete: true },
    categories: { view: true, create: true, update: true, delete: false },
    suppliers: { view: true, create: true, update: true, delete: false },
    stock: { view: true, create: true, update: true, delete: false },
    sales: { view: true, create: false, update: false, delete: false },
    reports: { view: true, create: false, update: false, delete: false },
    settings: { view: false, create: false, update: false, delete: false },
  },
  staff: {
    users: { view: false, create: false, update: false, delete: false },
    products: { view: true, create: false, update: false, delete: false },
    categories: { view: true, create: false, update: false, delete: false },
    suppliers: { view: true, create: false, update: false, delete: false },
    stock: { view: true, create: true, update: true, delete: false },
    sales: { view: true, create: true, update: false, delete: false },
    reports: { view: true, create: false, update: false, delete: false },
    settings: { view: false, create: false, update: false, delete: false },
  },
  viewer: {
    users: { view: false, create: false, update: false, delete: false },
    products: { view: true, create: false, update: false, delete: false },
    categories: { view: true, create: false, update: false, delete: false },
    suppliers: { view: true, create: false, update: false, delete: false },
    stock: { view: true, create: false, update: false, delete: false },
    sales: { view: true, create: false, update: false, delete: false },
    reports: { view: true, create: false, update: false, delete: false },
    settings: { view: false, create: false, update: false, delete: false },
  },
};
