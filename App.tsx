import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TransactionManager from './components/TransactionManager';
import Reports from './components/Reports';
import AIInsights from './components/AIInsights';
import CompanySettings from './components/CompanySettings';
import VatReturn from './components/VatReturn';
import { Transaction, CompanyProfile, TransactionType } from './types';
import { storageService } from './services/storage';

const App: React.FC = () => {
  // Initialize state using the storage service
  const [transactions, setTransactions] = useState<Transaction[]>(() => storageService.getTransactions());
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(() => storageService.getProfile());
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  // Use refs to keep track of latest state for the beforeunload handler and interval
  const transactionsRef = React.useRef(transactions);
  const profileRef = React.useRef(companyProfile);

  // Update refs whenever state changes
  useEffect(() => {
    transactionsRef.current = transactions;
    profileRef.current = companyProfile;
  }, [transactions, companyProfile]);

  // Persist to local storage whenever state changes (Immediate Local Persistence)
  useEffect(() => {
    storageService.saveTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    storageService.saveProfile(companyProfile);
  }, [companyProfile]);

  // --- AUTO SAVE LOGIC (Every 2 Minutes) ---
  useEffect(() => {
    const SAVE_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes

    const intervalId = setInterval(() => {
      setIsAutoSaving(true);
      
      // Save snapshot to auto-backup slot
      storageService.saveAutoBackup(transactionsRef.current, profileRef.current);
      
      // Hide indicator after 1.5s
      setTimeout(() => {
        setIsAutoSaving(false);
      }, 1500);
      
    }, SAVE_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, []);

  // Safety Net: Save data synchronously before the window unloads (closes/refreshes)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Force save the latest data from refs
      storageService.saveTransactions(transactionsRef.current);
      storageService.saveProfile(profileRef.current);
      storageService.saveAutoBackup(transactionsRef.current, profileRef.current);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const addTransaction = (t: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...t,
      id: Math.random().toString(36).substr(2, 9),
    };
    setTransactions(prev => [newTransaction, ...prev]);
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const updateTransaction = (updatedT: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === updatedT.id ? updatedT : t));
  };

  const clearTransactions = (type: TransactionType) => {
    const passcode = window.prompt("Enter Administrator Passcode to clear data:");
    
    if (passcode === "790922") {
      if (window.confirm(`Passcode Accepted. \n\nAre you sure you want to PERMANENTLY delete ALL ${type} records? This action cannot be undone.`)) {
        setTransactions(prev => prev.filter(t => t.type !== type));
      }
    } else if (passcode !== null) {
      alert("Access Denied: Incorrect Passcode.");
    }
  };

  const updateCompanyProfile = (profile: CompanyProfile) => {
    setCompanyProfile(profile);
  };

  // Callback to refresh state when data is restored from a backup file
  const handleDataRestore = () => {
    setTransactions(storageService.getTransactions());
    setCompanyProfile(storageService.getProfile());
    alert("System successfully restored from backup.");
  };

  return (
    <Router>
      <Layout companyProfile={companyProfile}>
        <Routes>
          <Route path="/" element={<Dashboard transactions={transactions} companyProfile={companyProfile} />} />
          <Route 
            path="/income" 
            element={
              <TransactionManager 
                transactions={transactions} 
                onAddTransaction={addTransaction}
                onDeleteTransaction={deleteTransaction}
                onUpdateTransaction={updateTransaction}
                onClearTransactions={() => clearTransactions('INCOME')}
                forcedType="INCOME"
              />
            } 
          />
          <Route 
            path="/expenses" 
            element={
              <TransactionManager 
                transactions={transactions} 
                onAddTransaction={addTransaction}
                onDeleteTransaction={deleteTransaction}
                onUpdateTransaction={updateTransaction}
                onClearTransactions={() => clearTransactions('EXPENSE')}
                forcedType="EXPENSE"
              />
            } 
          />
          <Route 
            path="/loan-account" 
            element={
              <TransactionManager 
                transactions={transactions} 
                onAddTransaction={addTransaction}
                onDeleteTransaction={deleteTransaction}
                onUpdateTransaction={updateTransaction}
                // Intentionally omitting onClearTransactions to prevent accidental bulk deletion of all expenses
                forcedType="EXPENSE"
                forcedPaymentMethod="Loan Account"
              />
            } 
          />
          <Route 
            path="/vat" 
            element={
              <VatReturn 
                transactions={transactions} 
                companyName={companyProfile.name} 
              />
            } 
          />
          <Route path="/reports" element={<Reports transactions={transactions} />} />
          <Route path="/insights" element={<AIInsights transactions={transactions} />} />
          <Route 
            path="/settings" 
            element={
              <CompanySettings 
                profile={companyProfile} 
                onSave={updateCompanyProfile}
                onDataRestored={handleDataRestore}
              />
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        {/* Auto-Save Indicator Overlay */}
        <div className={`fixed bottom-4 right-4 z-50 transition-opacity duration-500 ${isAutoSaving ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
           <div className="bg-slate-800 text-emerald-400 text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-2 border border-slate-700">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Auto-Saving Backup...
           </div>
        </div>
      </Layout>
    </Router>
  );
};

export default App;