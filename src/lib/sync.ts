/* ==== SUPABASE SYNC SERVICE ==== */

import { supabase } from './supabase';
import {
  medicineStorage,
  salesStorage,
  refundsStorage,
  expensesStorage,
  queueStorage,
  offlineStorage,
  type Medicine,
  type Sale,
  type Refund,
  type Expense,
  type QueuedAction,
} from './storage';

// Audit log interface
export interface AuditLog {
  id: string;
  userId: string;
  username: string;
  action: string;
  entityType: 'medicine' | 'sale' | 'refund' | 'expense';
  entityId: string;
  details: string;
  timestamp: string;
}

// Store audit logs in localStorage
const AUDIT_LOG_KEY = 'medical_pos_audit_logs';

export const auditLogStorage = {
  getAll: (): AuditLog[] => {
    try {
      const logs = localStorage.getItem(AUDIT_LOG_KEY);
      return logs ? JSON.parse(logs) : [];
    } catch {
      return [];
    }
  },
  
  add: (log: AuditLog): void => {
    try {
      const logs = auditLogStorage.getAll();
      logs.push(log);
      // Keep only last 1000 logs to prevent storage overflow
      if (logs.length > 1000) {
        logs.splice(0, logs.length - 1000);
      }
      localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(logs));
    } catch (error) {
      console.error('Failed to save audit log:', error);
    }
  },

  clear: (): void => {
    localStorage.removeItem(AUDIT_LOG_KEY);
  },
};

// Create audit log
export const createAuditLog = (
  action: string,
  entityType: AuditLog['entityType'],
  entityId: string,
  details: string
) => {
  const user = JSON.parse(localStorage.getItem('medical_pos_current_user') || '{}');
  
  const log: AuditLog = {
    id: crypto.randomUUID(),
    userId: user.id || 'unknown',
    username: user.username || 'System',
    action,
    entityType,
    entityId,
    details,
    timestamp: new Date().toISOString(),
  };

  auditLogStorage.add(log);
};

// Sync service
export const syncService = {
  // Check if Supabase is properly configured
  isSupabaseConfigured: (): boolean => {
    const url = import.meta.env.VITE_SUPABASE_URL || '';
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    return url.includes('supabase.co') && !key.includes('placeholder');
  },

  // Sync medicines to Supabase
  syncMedicines: async (): Promise<void> => {
    if (!syncService.isSupabaseConfigured()) return;

    const medicines = medicineStorage.getAll();
    const { error } = await supabase.from('medicines').upsert(medicines);
    
    if (error) {
      console.error('Error syncing medicines:', error);
      throw error;
    }
  },

  // Sync sales to Supabase
  syncSales: async (): Promise<void> => {
    if (!syncService.isSupabaseConfigured()) return;

    const sales = salesStorage.getAll();
    const { error } = await supabase.from('sales').upsert(sales);
    
    if (error) {
      console.error('Error syncing sales:', error);
      throw error;
    }
  },

  // Sync refunds to Supabase
  syncRefunds: async (): Promise<void> => {
    if (!syncService.isSupabaseConfigured()) return;

    const refunds = refundsStorage.getAll();
    const { error } = await supabase.from('refunds').upsert(refunds);
    
    if (error) {
      console.error('Error syncing refunds:', error);
      throw error;
    }
  },

  // Sync expenses to Supabase
  syncExpenses: async (): Promise<void> => {
    if (!syncService.isSupabaseConfigured()) return;

    const expenses = expensesStorage.getAll();
    const { error } = await supabase.from('expenses').upsert(expenses);
    
    if (error) {
      console.error('Error syncing expenses:', error);
      throw error;
    }
  },

  // Process queued actions
  processQueue: async (): Promise<void> => {
    if (!syncService.isSupabaseConfigured()) return;

    const queue = queueStorage.getAll();
    
    for (const action of queue) {
      try {
        await syncService.processQueuedAction(action);
        queueStorage.remove(action.id);
      } catch (error) {
        console.error('Error processing queued action:', error);
      }
    }
  },

  // Process individual queued action
  processQueuedAction: async (action: QueuedAction): Promise<void> => {
    const table = action.type === 'medicine' ? 'medicines' :
                  action.type === 'sale' ? 'sales' :
                  action.type === 'refund' ? 'refunds' : 'expenses';

    if (action.action === 'create') {
      await supabase.from(table).insert(action.data);
    } else if (action.action === 'update') {
      await supabase.from(table).update(action.data).eq('id', action.data.id);
    } else if (action.action === 'delete') {
      await supabase.from(table).delete().eq('id', action.data.id);
    }
  },

  // Full sync - pull from Supabase and merge with local
  fullSync: async (): Promise<void> => {
    if (!syncService.isSupabaseConfigured()) return;

    try {
      // Fetch from Supabase
      const [medicinesResult, salesResult, refundsResult, expensesResult] = await Promise.all([
        supabase.from('medicines').select('*'),
        supabase.from('sales').select('*'),
        supabase.from('refunds').select('*'),
        supabase.from('expenses').select('*'),
      ]);

      // Merge with local data (Supabase data takes precedence)
      if (medicinesResult.data) {
        const localMedicines = medicineStorage.getAll();
        const merged = syncService.mergeData(localMedicines, medicinesResult.data as Medicine[]);
        medicineStorage.save(merged);
      }

      if (salesResult.data) {
        const localSales = salesStorage.getAll();
        const merged = syncService.mergeData(localSales, salesResult.data as Sale[]);
        salesStorage.save(merged);
      }

      if (refundsResult.data) {
        const localRefunds = refundsStorage.getAll();
        const merged = syncService.mergeData(localRefunds, refundsResult.data as Refund[]);
        refundsStorage.save(merged);
      }

      if (expensesResult.data) {
        const localExpenses = expensesStorage.getAll();
        const merged = syncService.mergeData(localExpenses, expensesResult.data as Expense[]);
        expensesStorage.save(merged);
      }

      // Process any queued actions
      await syncService.processQueue();

      offlineStorage.setOffline(false);
    } catch (error) {
      console.error('Full sync failed:', error);
      offlineStorage.setOffline(true);
      throw error;
    }
  },

  // Merge local and remote data
  mergeData: <T extends { id: string; updatedAt?: string; createdAt: string }>(
    local: T[],
    remote: T[]
  ): T[] => {
    const merged = new Map<string, T>();

    // Add all remote items
    remote.forEach(item => merged.set(item.id, item));

    // Add local items that are newer or don't exist remotely
    local.forEach(item => {
      const remoteItem = merged.get(item.id);
      if (!remoteItem) {
        merged.set(item.id, item);
      } else if (item.updatedAt && remoteItem.updatedAt) {
        if (new Date(item.updatedAt) > new Date(remoteItem.updatedAt)) {
          merged.set(item.id, item);
        }
      }
    });

    return Array.from(merged.values());
  },
};

/* ==== END OF SUPABASE SYNC SERVICE ==== */
