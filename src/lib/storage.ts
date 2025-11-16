// LocalStorage utilities for offline-first functionality

export interface Medicine {
  id: string;
  name: string;
  type: string;
  strength: string;
  quantity: number;
  costPrice: number;
  salePrice: number;
  expiry: string;
  reorderLevel: number;
  createdAt: string;
  updatedAt: string;
}

export interface Sale {
  id: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: string;
  customerName?: string;
  isCredit: boolean;
  createdAt: string;
}

export interface SaleItem {
  medicineId: string;
  medicineName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Refund {
  id: string;
  saleId: string;
  items: RefundItem[];
  total: number;
  reason: string;
  createdAt: string;
}

export interface RefundItem {
  medicineId: string;
  medicineName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Expense {
  id: string;
  date: string;
  type: string;
  amount: number;
  note: string;
  createdAt: string;
}

export interface QueuedAction {
  id: string;
  type: 'sale' | 'refund' | 'medicine' | 'expense';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: string;
}

export type PagePermission = 
  | 'dashboard'
  | 'medicines'
  | 'billing'
  | 'refunds'
  | 'expenses'
  | 'reports'
  | 'audit-logs'
  | 'settings';

export interface LocalUser {
  id: string;
  username: string;
  passwordHash: string;
  role: 'admin' | 'manager' | 'cashier' | 'viewer' | 'pending';
  approved: boolean;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  permissions: PagePermission[];
}

export interface AppSettings {
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  businessEmail: string;
  taxNumber: string;
  defaultTaxRate: number;
  enableTax: boolean;
  defaultDiscount: number;
  maxDiscount: number;
  lowStockThreshold: number;
  expiryWarningDays: number;
  enableStockAlerts: boolean;
  currencySymbol: string;
  receiptHeader: string;
  receiptFooter: string;
  showLogo: boolean;
}

// Storage keys
const KEYS = {
  MEDICINES: 'medical_pos_medicines',
  SALES: 'medical_pos_sales',
  REFUNDS: 'medical_pos_refunds',
  EXPENSES: 'medical_pos_expenses',
  QUEUE: 'medical_pos_queue',
  USER: 'medical_pos_user',
  OFFLINE_MODE: 'medical_pos_offline',
  LOCAL_USERS: 'medical_pos_local_users',
  CURRENT_USER: 'medical_pos_current_user',
  SETTINGS: 'medical_pos_settings',
};

// Generic storage functions
export const storage = {
  get: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error reading ${key} from storage:`, error);
      return null;
    }
  },

  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing ${key} to storage:`, error);
    }
  },

  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key} from storage:`, error);
    }
  },
};

// Medicine operations
export const medicineStorage = {
  getAll: (): Medicine[] => storage.get<Medicine[]>(KEYS.MEDICINES) || [],
  
  save: (medicines: Medicine[]): void => storage.set(KEYS.MEDICINES, medicines),
  
  add: (medicine: Medicine): void => {
    const medicines = medicineStorage.getAll();
    medicines.push(medicine);
    medicineStorage.save(medicines);
  },
  
  update: (id: string, updates: Partial<Medicine>): void => {
    const medicines = medicineStorage.getAll();
    const index = medicines.findIndex(m => m.id === id);
    if (index !== -1) {
      medicines[index] = { ...medicines[index], ...updates, updatedAt: new Date().toISOString() };
      medicineStorage.save(medicines);
    }
  },
  
  delete: (id: string): void => {
    const medicines = medicineStorage.getAll().filter(m => m.id !== id);
    medicineStorage.save(medicines);
  },
};

// Sales operations
export const salesStorage = {
  getAll: (): Sale[] => storage.get<Sale[]>(KEYS.SALES) || [],
  
  save: (sales: Sale[]): void => storage.set(KEYS.SALES, sales),
  
  add: (sale: Sale): void => {
    const sales = salesStorage.getAll();
    sales.push(sale);
    salesStorage.save(sales);
  },
};

// Refunds operations
export const refundsStorage = {
  getAll: (): Refund[] => storage.get<Refund[]>(KEYS.REFUNDS) || [],
  
  save: (refunds: Refund[]): void => storage.set(KEYS.REFUNDS, refunds),
  
  add: (refund: Refund): void => {
    const refunds = refundsStorage.getAll();
    refunds.push(refund);
    refundsStorage.save(refunds);
  },
};

// Expenses operations
export const expensesStorage = {
  getAll: (): Expense[] => storage.get<Expense[]>(KEYS.EXPENSES) || [],
  
  save: (expenses: Expense[]): void => storage.set(KEYS.EXPENSES, expenses),
  
  add: (expense: Expense): void => {
    const expenses = expensesStorage.getAll();
    expenses.push(expense);
    expensesStorage.save(expenses);
  },
};

// Queue operations for offline sync
export const queueStorage = {
  getAll: (): QueuedAction[] => storage.get<QueuedAction[]>(KEYS.QUEUE) || [],
  
  add: (action: QueuedAction): void => {
    const queue = queueStorage.getAll();
    queue.push(action);
    storage.set(KEYS.QUEUE, queue);
  },
  
  clear: (): void => storage.set(KEYS.QUEUE, []),
  
  remove: (id: string): void => {
    const queue = queueStorage.getAll().filter(a => a.id !== id);
    storage.set(KEYS.QUEUE, queue);
  },
};

// Simple hash function for password storage (basic security)
const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
};

// Local authentication storage
export const authStorage = {
  // Get all registered users
  getAllUsers: (): LocalUser[] => storage.get<LocalUser[]>(KEYS.LOCAL_USERS) || [],
  
  // Register a new user
  register: (username: string, password: string): { success: boolean; error?: string; needsApproval?: boolean } => {
    const users = authStorage.getAllUsers();
    
    // Check if username already exists
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      return { success: false, error: 'Username already exists' };
    }
    
    // First user becomes admin, others need approval
    const isFirstUser = users.length === 0;
    
    // Create new user
    const newUser: LocalUser = {
      id: crypto.randomUUID(),
      username,
      passwordHash: simpleHash(password),
      role: isFirstUser ? 'admin' : 'pending',
      approved: isFirstUser,
      createdAt: new Date().toISOString(),
      permissions: isFirstUser ? authStorage.getDefaultPermissions('admin') : [],
    };
    
    users.push(newUser);
    storage.set(KEYS.LOCAL_USERS, users);
    
    // Only set as current user if approved (first user)
    if (isFirstUser) {
      authStorage.setCurrentUser({ id: newUser.id, username: newUser.username, role: newUser.role });
      return { success: true };
    }
    
    return { success: true, needsApproval: true };
  },
  
  // Login with username and password
  login: (username: string, password: string): { success: boolean; error?: string } => {
    const users = authStorage.getAllUsers();
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    
    if (!user) {
      return { success: false, error: 'Invalid username or password' };
    }
    
    if (user.passwordHash !== simpleHash(password)) {
      return { success: false, error: 'Invalid username or password' };
    }
    
    // Check if user is approved
    if (!user.approved) {
      return { success: false, error: 'Account pending approval. Please contact an administrator.' };
    }
    
    // Set as current user
    authStorage.setCurrentUser({ id: user.id, username: user.username, role: user.role });
    
    return { success: true };
  },
  
  // Get current logged-in user
  getCurrentUser: () => storage.get<{ id: string; username: string; role: string }>(KEYS.CURRENT_USER),
  
  // Set current user
  setCurrentUser: (user: { id: string; username: string; role: string }) => storage.set(KEYS.CURRENT_USER, user),
  
  // Logout
  logout: () => storage.remove(KEYS.CURRENT_USER),
  
  // Check if user is logged in
  isLoggedIn: (): boolean => authStorage.getCurrentUser() !== null,
  
  // Check if current user is admin
  isAdmin: (): boolean => {
    const user = authStorage.getCurrentUser();
    return user?.role === 'admin';
  },
  
  // Get default permissions for a role
  getDefaultPermissions: (role: string): PagePermission[] => {
    const rolePermissions: Record<string, PagePermission[]> = {
      admin: ['dashboard', 'medicines', 'billing', 'refunds', 'expenses', 'reports', 'audit-logs', 'settings'],
      manager: ['dashboard', 'medicines', 'billing', 'refunds', 'expenses', 'reports', 'audit-logs'],
      cashier: ['dashboard', 'medicines', 'billing', 'refunds'],
      viewer: ['dashboard', 'medicines', 'reports'],
    };
    return rolePermissions[role] || ['dashboard'];
  },

  // Approve a user with role assignment (admin only)
  approveUser: (userId: string, role: 'manager' | 'cashier' | 'viewer' = 'cashier', permissions?: PagePermission[]): { success: boolean; error?: string } => {
    const currentUser = authStorage.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'Unauthorized: Admin access required' };
    }
    
    const users = authStorage.getAllUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return { success: false, error: 'User not found' };
    }
    
    users[userIndex] = {
      ...users[userIndex],
      role,
      approved: true,
      approvedBy: currentUser.username,
      approvedAt: new Date().toISOString(),
      permissions: permissions || authStorage.getDefaultPermissions(role),
    };
    
    storage.set(KEYS.LOCAL_USERS, users);
    return { success: true };
  },
  
  // Change user role (admin only)
  changeUserRole: (userId: string, newRole: 'admin' | 'manager' | 'cashier' | 'viewer'): { success: boolean; error?: string } => {
    const currentUser = authStorage.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'Unauthorized: Admin access required' };
    }
    
    const users = authStorage.getAllUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return { success: false, error: 'User not found' };
    }
    
    // Prevent changing own role
    if (users[userIndex].id === currentUser.id) {
      return { success: false, error: 'Cannot change your own role' };
    }
    
    users[userIndex] = {
      ...users[userIndex],
      role: newRole,
    };
    
    storage.set(KEYS.LOCAL_USERS, users);
    return { success: true };
  },

  // Update user permissions (admin only)
  updateUserPermissions: (userId: string, permissions: PagePermission[]): { success: boolean; error?: string } => {
    const currentUser = authStorage.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'Unauthorized: Admin access required' };
    }
    
    const users = authStorage.getAllUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return { success: false, error: 'User not found' };
    }
    
    users[userIndex] = {
      ...users[userIndex],
      permissions,
    };
    
    storage.set(KEYS.LOCAL_USERS, users);
    return { success: true };
  },

  // Check if user has permission to access a page
  hasPagePermission: (page: PagePermission): boolean => {
    const currentUser = authStorage.getCurrentUser();
    if (!currentUser) return false;
    
    const users = authStorage.getAllUsers();
    const user = users.find(u => u.id === currentUser.id);
    
    if (!user || !user.approved) return false;
    if (user.role === 'admin') return true;
    
    return user.permissions?.includes(page) || false;
  },
  
  // Reject/delete a pending user (admin only)
  rejectUser: (userId: string): { success: boolean; error?: string } => {
    const currentUser = authStorage.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'Unauthorized: Admin access required' };
    }
    
    const users = authStorage.getAllUsers().filter(u => u.id !== userId);
    storage.set(KEYS.LOCAL_USERS, users);
    return { success: true };
  },
  
  // Get pending users (admin only)
  getPendingUsers: (): LocalUser[] => {
    return authStorage.getAllUsers().filter(u => u.role === 'pending');
  },
};

// User session
export const userStorage = {
  get: () => storage.get(KEYS.USER),
  set: (user: any) => storage.set(KEYS.USER, user),
  clear: () => storage.remove(KEYS.USER),
};

// Offline mode
export const offlineStorage = {
  isOffline: (): boolean => storage.get<boolean>(KEYS.OFFLINE_MODE) || false,
  setOffline: (offline: boolean): void => storage.set(KEYS.OFFLINE_MODE, offline),
};

// Settings operations
const DEFAULT_SETTINGS: AppSettings = {
  businessName: 'Medical POS',
  businessAddress: '',
  businessPhone: '',
  businessEmail: '',
  taxNumber: '',
  defaultTaxRate: 5,
  enableTax: true,
  defaultDiscount: 0,
  maxDiscount: 100,
  lowStockThreshold: 10,
  expiryWarningDays: 30,
  enableStockAlerts: true,
  currencySymbol: 'Rs.',
  receiptHeader: 'Thank you for your purchase!',
  receiptFooter: 'Please visit again',
  showLogo: false,
};

export const settingsStorage = {
  get: (): AppSettings => storage.get<AppSettings>(KEYS.SETTINGS) || DEFAULT_SETTINGS,
  
  save: (settings: AppSettings): void => storage.set(KEYS.SETTINGS, settings),
  
  update: (updates: Partial<AppSettings>): void => {
    const currentSettings = settingsStorage.get();
    const updatedSettings = { ...currentSettings, ...updates };
    settingsStorage.save(updatedSettings);
  },
  
  reset: (): void => settingsStorage.save(DEFAULT_SETTINGS),
};
