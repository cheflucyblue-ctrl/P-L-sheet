import { Transaction, CompanyProfile } from '../types';
import { MOCK_TRANSACTIONS, DEFAULT_COMPANY_PROFILE } from '../constants';

const KEYS = {
  TRANSACTIONS: 'bistro_transactions',
  PROFILE: 'bistro_profile',
  AUTO_BACKUP: 'bistro_autosave_latest'
};

export const storageService = {
  // --- Transactions ---
  getTransactions: (): Transaction[] => {
    try {
      const saved = localStorage.getItem(KEYS.TRANSACTIONS);
      return saved ? JSON.parse(saved) : MOCK_TRANSACTIONS;
    } catch (e) {
      console.error('Failed to load transactions', e);
      return MOCK_TRANSACTIONS;
    }
  },

  saveTransactions: (transactions: Transaction[]) => {
    try {
      localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(transactions));
    } catch (e) {
      console.error('Failed to save transactions', e);
    }
  },

  // --- Company Profile ---
  getProfile: (): CompanyProfile => {
    try {
      const saved = localStorage.getItem(KEYS.PROFILE);
      return saved ? JSON.parse(saved) : DEFAULT_COMPANY_PROFILE;
    } catch (e) {
      console.error('Failed to load profile', e);
      return DEFAULT_COMPANY_PROFILE;
    }
  },

  saveProfile: (profile: CompanyProfile) => {
    try {
      localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.error('Failed to save profile', e);
    }
  },

  // --- Auto Backup (2 Minute Cycle) ---
  saveAutoBackup: (transactions: Transaction[], profile: CompanyProfile) => {
    try {
      const backupData = {
        transactions,
        profile,
        timestamp: new Date().toISOString(),
        type: 'AUTO_SAVE'
      };
      localStorage.setItem(KEYS.AUTO_BACKUP, JSON.stringify(backupData));
      return true;
    } catch (e) {
      console.error('Auto-save failed', e);
      return false;
    }
  },

  getAutoBackup: () => {
    try {
      const saved = localStorage.getItem(KEYS.AUTO_BACKUP);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  },

  // --- Manual Backup & Restore ---
  exportData: (): string => {
    const data = {
      transactions: storageService.getTransactions(),
      profile: storageService.getProfile(),
      timestamp: new Date().toISOString(),
      appVersion: '1.0.0',
      type: 'MANUAL_EXPORT'
    };
    return JSON.stringify(data, null, 2);
  },

  importData: (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      
      // Basic validation
      if (!data || typeof data !== 'object') return false;

      if (data.transactions && Array.isArray(data.transactions)) {
        storageService.saveTransactions(data.transactions);
      }
      
      if (data.profile && typeof data.profile === 'object') {
        storageService.saveProfile(data.profile);
      }
      
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  }
};