// All available features with their permissions
export const FEATURES = {
  // Products Management
  products: {
    key: 'products',
    name: 'Products',
    icon: 'cube',
    description: 'Manage product inventory',
    permissions: ['view', 'create', 'update', 'delete'],
  },
  
  // Categories Management
  categories: {
    key: 'categories',
    name: 'Categories',
    icon: 'folder',
    description: 'Manage product categories',
    permissions: ['view', 'create', 'update', 'delete'],
  },

  // Suppliers Management
  suppliers: {
    key: 'suppliers',
    name: 'Suppliers',
    icon: 'business',
    description: 'Manage supplier information',
    permissions: ['view', 'create', 'update', 'delete'],
  },

  // Stock Management
  stock_in: {
    key: 'stock_in',
    name: 'Stock In',
    icon: 'arrow-down-circle',
    description: 'Add stock to inventory',
    permissions: ['view', 'create'],
  },

  stock_out: {
    key: 'stock_out',
    name: 'Stock Out',
    icon: 'arrow-up-circle',
    description: 'Remove stock from inventory',
    permissions: ['view', 'create'],
  },

  // Sales Management
  sales_create: {
    key: 'sales_create',
    name: 'Create Invoice',
    icon: 'document-text',
    description: 'Create and generate sales invoices',
    permissions: ['view', 'create'],
  },

  sales_view: {
    key: 'sales_view',
    name: 'View Sales',
    icon: 'eye',
    description: 'View sales history and invoices',
    permissions: ['view'],
  },

  sales_delete: {
    key: 'sales_delete',
    name: 'Delete Invoice',
    icon: 'trash',
    description: 'Delete sales invoices',
    permissions: ['delete'],
  },

  // Reports
  reports: {
    key: 'reports',
    name: 'Reports',
    icon: 'bar-chart',
    description: 'View sales and inventory reports',
    permissions: ['view'],
  },

  // Staff Management
  staff: {
    key: 'staff',
    name: 'Staff Management',
    icon: 'people',
    description: 'Manage staff and permissions',
    permissions: ['view', 'create', 'update', 'delete'],
  },

  // Settings
  settings: {
    key: 'settings',
    name: 'Settings',
    icon: 'settings',
    description: 'App settings and configuration',
    permissions: ['view', 'update'],
  },
};

// Get all features as array
export const getAllFeatures = () => Object.values(FEATURES);

// Permission labels
export const PERMISSION_LABELS = {
  view: { label: 'View', icon: 'eye', color: '#2196F3' },
  create: { label: 'Create', icon: 'add-circle', color: '#4CAF50' },
  update: { label: 'Update', icon: 'create', color: '#FF9800' },
  delete: { label: 'Delete', icon: 'trash', color: '#F44336' },
};

// Category-wise features grouping (for UI organization)
export const FEATURE_CATEGORIES = {
  inventory: {
    name: 'Inventory Management',
    features: ['products', 'categories', 'suppliers', 'stock_in', 'stock_out'],
    color: '#9C27B0',
  },
  sales: {
    name: 'Sales & Invoicing',
    features: ['sales_create', 'sales_view', 'sales_delete'],
    color: '#2196F3',
  },
  reports: {
    name: 'Reports & Analytics',
    features: ['reports'],
    color: '#FF9800',
  },
  admin: {
    name: 'Administration',
    features: ['staff', 'settings'],
    color: '#F44336',
  },
};
