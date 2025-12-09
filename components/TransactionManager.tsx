import React, { useState, useEffect, useRef } from 'react';
import { Transaction, TransactionType, ExpenseCategory, IncomeCategory } from '../types';
import { PlusCircle, Search, Trash2, ArrowUpCircle, ArrowDownCircle, Coins, CreditCard, FileText, Banknote, Download, Upload, ChevronDown, ChevronRight, Eraser, Users, Wrench, Utensils, Wine, Building, Zap, Briefcase, Edit2, Save, X } from 'lucide-react';
import { PAYMENT_METHODS } from '../constants';

interface TransactionManagerProps {
  transactions: Transaction[];
  onAddTransaction: (t: Omit<Transaction, 'id'>) => void;
  onDeleteTransaction: (id: string) => void;
  onUpdateTransaction?: (t: Transaction) => void;
  onClearTransactions?: () => void;
  forcedType?: TransactionType;
  forcedPaymentMethod?: string;
}

type IncomeSubFilter = 'ALL' | 'CASH' | 'CARD' | 'ACCOUNT' | 'TIPS';
type ExpenseSubFilter = 'ALL' | 'SALARY' | 'RM' | 'FOOD' | 'ALCOHOL' | 'PETTY_CASH' | 'RENT' | 'UTILITIES' | 'OPS';

const EXPENSE_DROPDOWN_OPTS = [
  "Salary's",
  "R&M",
  "Food",
  "Alcohol",
  "Petty Cash",
  "Rent",
  "Utility's",
  "Operational costs"
];

const TransactionManager: React.FC<TransactionManagerProps> = ({ transactions, onAddTransaction, onDeleteTransaction, onUpdateTransaction, onClearTransactions, forcedType, forcedPaymentMethod }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>(forcedType || 'ALL');
  const [incomeSubFilter, setIncomeSubFilter] = useState<IncomeSubFilter>('ALL');
  const [expenseSubFilter, setExpenseSubFilter] = useState<ExpenseSubFilter>('ALL');
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  
  // Inline Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Transaction>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (forcedType) {
      setFilterType(forcedType);
    }
  }, [forcedType]);

  // New Transaction Form State
  const [newTrans, setNewTrans] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    type: (forcedType || 'EXPENSE') as TransactionType,
    category: (forcedType === 'INCOME' ? IncomeCategory.FOOD_SALES : 'Operational costs') as string,
    paymentMethod: forcedPaymentMethod || 'Credit Card',
    covers: ''
  });

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    if (dateStr.includes('/') && dateStr.split('/').length === 3) return dateStr;
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const handleOpenAddModal = () => {
    // Smart Defaults based on current view/filter
    let initialPaymentMethod = forcedPaymentMethod || 'Credit Card';
    let initialCategory = forcedType === 'INCOME' ? IncomeCategory.FOOD_SALES : 'Operational costs';
    
    // Income Logic
    if (forcedType === 'INCOME') {
      if (incomeSubFilter === 'CASH') initialPaymentMethod = 'Cash';
      if (incomeSubFilter === 'CARD') initialPaymentMethod = 'Credit Card';
      if (incomeSubFilter === 'ACCOUNT') initialPaymentMethod = 'Account';
      if (incomeSubFilter === 'TIPS') {
        initialCategory = IncomeCategory.TIPS;
        initialPaymentMethod = 'Cash'; 
      }
    } 
    // Expense Logic
    else if (forcedType === 'EXPENSE') {
      if (expenseSubFilter === 'SALARY') initialCategory = "Salary's";
      if (expenseSubFilter === 'RM') initialCategory = "R&M";
      if (expenseSubFilter === 'FOOD') initialCategory = "Food";
      if (expenseSubFilter === 'ALCOHOL') initialCategory = "Alcohol";
      if (expenseSubFilter === 'PETTY_CASH') {
        initialPaymentMethod = 'Cash';
        initialCategory = "Petty Cash";
      }
      if (expenseSubFilter === 'RENT') initialCategory = "Rent";
      if (expenseSubFilter === 'UTILITIES') initialCategory = "Utility's";
      if (expenseSubFilter === 'OPS') initialCategory = "Operational costs";
    }

    setNewTrans(prev => ({
        ...prev,
        type: (forcedType || 'EXPENSE') as TransactionType,
        category: initialCategory as string,
        paymentMethod: initialPaymentMethod,
        description: '',
        amount: '',
        covers: ''
    }));
    setIsModalOpen(true);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    onAddTransaction({
      date: newTrans.date,
      description: newTrans.description,
      amount: parseFloat(newTrans.amount),
      type: newTrans.type,
      category: newTrans.category,
      paymentMethod: newTrans.paymentMethod,
      covers: newTrans.covers ? parseInt(newTrans.covers) : undefined
    });
    setIsModalOpen(false);
  };

  // --- Inline Edit Handlers ---
  const handleEditClick = (t: Transaction) => {
    setEditingId(t.id);
    setEditForm({ ...t });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSaveEdit = () => {
    if (onUpdateTransaction && editingId && editForm) {
        // Validation could go here
        onUpdateTransaction({
            ...editForm as Transaction,
            amount: Number(editForm.amount) // Ensure amount is number
        });
        setEditingId(null);
        setEditForm({});
    }
  };

  const toggleDateExpand = (date: string) => {
    setExpandedDates(prev => ({ ...prev, [date]: !prev[date] }));
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesType = false;
    if (filterType === 'ALL') matchesType = true;
    else if (filterType === 'EXPENSE') matchesType = t.type === 'EXPENSE';
    else if (filterType === 'INCOME') {
      matchesType = t.type === 'INCOME';
    }

    // Filter by forcedPaymentMethod (e.g. Loan Account)
    if (forcedPaymentMethod && t.paymentMethod !== forcedPaymentMethod) {
      return false;
    }

    // Sub-filters for Income
    if (forcedType === 'INCOME' && incomeSubFilter !== 'ALL') {
      const method = t.paymentMethod.toLowerCase();
      if (incomeSubFilter === 'CASH' && (!method.includes('cash') || t.category === IncomeCategory.TIPS)) return false;
      if (incomeSubFilter === 'CARD' && !method.includes('card')) return false;
      if (incomeSubFilter === 'ACCOUNT' && !method.includes('account')) return false;
      if (incomeSubFilter === 'TIPS' && t.category !== IncomeCategory.TIPS) return false;
    }

    // Sub-filters for Expenses
    if (forcedType === 'EXPENSE' && expenseSubFilter !== 'ALL') {
      const cat = t.category;
      
      if (expenseSubFilter === 'SALARY') {
          if (!cat.includes('Labor') && cat !== "Salary's") return false;
      }
      if (expenseSubFilter === 'RM') {
          if (!cat.includes('Repairs') && cat !== "R&M") return false;
      }
      if (expenseSubFilter === 'FOOD') {
          if (cat !== ExpenseCategory.COGS_FOOD && cat !== "Food") return false;
      }
      if (expenseSubFilter === 'ALCOHOL') {
          if (cat !== ExpenseCategory.COGS_BEV && cat !== "Alcohol") return false;
      }
      if (expenseSubFilter === 'RENT') {
          if (cat !== ExpenseCategory.RENT && cat !== "Rent") return false;
      }
      if (expenseSubFilter === 'UTILITIES') {
          if (cat !== ExpenseCategory.UTILITIES && cat !== "Utility's") return false;
      }
      if (expenseSubFilter === 'PETTY_CASH') {
        // Petty cash is either a specific category OR paid by cash
        const isCashMethod = t.paymentMethod.toLowerCase().includes('cash');
        const isPettyCat = cat === "Petty Cash";
        if (!isCashMethod && !isPettyCat) return false;
      }
      if (expenseSubFilter === 'OPS') {
         const opsCats = [
           ExpenseCategory.SUPPLIES, 
           ExpenseCategory.ADMIN, 
           ExpenseCategory.MARKETING, 
           ExpenseCategory.OTHER,
           "Operational costs"
         ];
         if (!opsCats.includes(cat as any)) return false;
      }
    }

    return matchesSearch && matchesType;
  });

  // --- Aggregation Logic for Income Sheet ---
  interface DailyIncomeAgg {
    date: string;
    day: string;
    total: number;
    tips: number;
    cash: number;
    card: number;
    eft: number; // Cheque / EFT / Transfer
    charge: number; // Account
    covers: number;
    transactions: Transaction[];
  }

  const dailyIncomeGroups = React.useMemo(() => {
    if (forcedType !== 'INCOME') return [];

    const groups: Record<string, DailyIncomeAgg> = {};

    filteredTransactions.forEach(t => {
      if (!groups[t.date]) {
        const d = new Date(t.date);
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
        groups[t.date] = {
          date: t.date,
          day: dayName,
          total: 0,
          tips: 0,
          cash: 0,
          card: 0,
          eft: 0,
          charge: 0,
          covers: 0,
          transactions: []
        };
      }
      
      const g = groups[t.date];

      // Separate Tips from Sales Revenue
      if (t.category === IncomeCategory.TIPS) {
        g.tips += t.amount;
      } else {
        g.total += t.amount;
      }

      g.transactions.push(t);
      if (t.covers) g.covers += t.covers;

      const method = t.paymentMethod.toLowerCase();
      if (method.includes('cash')) g.cash += t.amount;
      else if (method.includes('card')) g.card += t.amount;
      else if (method.includes('account')) g.charge += t.amount;
      else if (['check', 'eft', 'ach', 'bank transfer', 'direct deposit'].some(m => method.includes(m))) g.eft += t.amount;
    });

    return Object.values(groups).sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredTransactions, forcedType]);


  // --- Export Functionality ---
  const handleExport = () => {
    if (forcedType === 'INCOME') {
      // Export Daily Sheet format
      const headers = ['Date', 'Total Sales', 'Cash', 'Card', 'Cheque / EFT', 'Charge', 'Covers', 'Tips'];
      const csvContent = [
        headers.join(','),
        ...dailyIncomeGroups.map(g => {
          return `${formatDate(g.date)},${g.total},${g.cash},${g.card},${g.eft},${g.charge},${g.covers},${g.tips}`;
        })
      ].join('\n');
      downloadCsv(csvContent, 'daily_income_sheet');
    } else if (forcedType === 'EXPENSE') {
      // Export Filtered Expense List
      const headers = ['Date', 'Category', 'Description', 'Payment Method', 'Amount'];
      const csvContent = [
        headers.join(','),
        ...filteredTransactions.map(t => {
          const safeDesc = `"${t.description.replace(/"/g, '""')}"`;
          return `${formatDate(t.date)},${t.category},${safeDesc},${t.paymentMethod},${t.amount}`;
        })
      ].join('\n');
      
      const subName = expenseSubFilter === 'ALL' ? 'all' : expenseSubFilter.toLowerCase();
      const fileName = forcedPaymentMethod ? 'loan_account_report' : `expenses_${subName}_report`;
      downloadCsv(csvContent, fileName);
    } else {
      // Export Standard Transaction List format (fallback)
      const headers = ['Date', 'Type', 'Category', 'Description', 'Method', 'Amount'];
      const csvContent = [
        headers.join(','),
        ...filteredTransactions.map(t => {
          const safeDesc = `"${t.description.replace(/"/g, '""')}"`;
          return `${formatDate(t.date)},${t.type},${t.category},${safeDesc},${t.paymentMethod},${t.amount}`;
        })
      ].join('\n');
      downloadCsv(csvContent, 'transaction_report');
    }
  };

  const handleDownloadTemplate = () => {
    if (forcedType === 'INCOME') {
      const headers = ['Date', 'Total Sales', 'Cash', 'Card', 'Cheque / EFT', 'Charge', 'Covers', 'Tips'];
      // Sample row to guide the user
      const sampleRow = ['30/11/2025', '15000.00', '5000.00', '10000.00', '0.00', '0.00', '45', '500.00'];
      const csvContent = [headers.join(','), sampleRow.join(',')].join('\n');
      downloadCsv(csvContent, 'income_import_template');
    } else if (forcedType === 'EXPENSE') {
      // Expense Template
      const headers = ['Date', 'Category', 'Description', 'Payment Method', 'Amount'];
      const sampleRow = ['30/11/2025', 'Food', 'Weekly Veg Delivery', forcedPaymentMethod || 'Credit Card', '2500.00'];
      const csvContent = [headers.join(','), sampleRow.join(',')].join('\n');
      downloadCsv(csvContent, 'expense_import_template');
    }
  };

  const downloadCsv = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Import Functionality ---
  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset so onChange fires even if same file selected
      fileInputRef.current.click();
    }
  };

  const parseCSVLine = (line: string): string[] => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values.map(v => v.replace(/^"|"$/g, '').trim()); // Remove surrounding quotes
  };

  const parseCurrency = (val: string | undefined): number => {
    if (!val) return 0;
    // Remove all non-numeric characters except '.' and '-'
    // This removes 'R', spaces (including non-breaking \xa0), commas (assuming thousands separator)
    const clean = val.replace(/[^0-9.-]/g, '');
    return parseFloat(clean) || 0;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      const lines = text.split('\n').filter(l => l.trim().length > 0);
      if (lines.length < 2) return; // Need header + data

      const header = lines[0].toLowerCase();
      
      // DETECT FORMAT
      const isDailySheet = header.includes('total sales') && header.includes('cash');
      
      let importCount = 0;

      lines.slice(1).forEach((line) => {
        const cols = parseCSVLine(line);
        if (cols.length < 2) return;

        // Parse Date: Handle DD/MM/YYYY or YYYY-MM-DD
        let dateStr = cols[0];
        let date = dateStr;
        if (dateStr.includes('/') && dateStr.split('/').length === 3) {
            const [d, m, y] = dateStr.split('/');
            date = `${y}-${m}-${d}`;
        }
        
        // --- LOGIC FOR INCOME DAILY SHEET IMPORT ---
        if (isDailySheet && forcedType === 'INCOME') {
            // Mapping based on Export/Provided Format: 
            // Date(0), Total(1), Cash(2), Card(3), EFT(4), Charge(5), Covers(6), Tips(7)
            
            const cashVal = parseCurrency(cols[2]);
            const cardVal = parseCurrency(cols[3]);
            const eftVal = parseCurrency(cols[4]);
            const chargeVal = parseCurrency(cols[5]);
            // Covers might look like "1 339" or "106". Strip everything but digits.
            const coversVal = parseInt(cols[6]?.replace(/[^0-9]/g, '') || '0');
            const tipsVal = parseCurrency(cols[7]);

            // Helper to add
            const add = (amt: number, method: string, cat: string, desc: string, covers?: number) => {
                if (amt > 0) {
                    onAddTransaction({
                        date,
                        type: 'INCOME',
                        category: cat,
                        description: desc,
                        paymentMethod: method,
                        amount: amt,
                        covers: covers 
                    });
                    importCount++;
                }
            };
            
            // We attach covers to the first transaction we create for sales, to avoid double counting covers in the aggregate view
            let coversAssigned = false;
            const assignCovers = () => {
                if (!coversAssigned && coversVal > 0) {
                    coversAssigned = true;
                    return coversVal;
                }
                return undefined;
            }

            // Order matters slightly for who gets the covers if multiple exist, but usually it's arbitrary.
            add(cashVal, 'Cash', IncomeCategory.FOOD_SALES, 'Imported Daily Cash', assignCovers());
            add(cardVal, 'Credit Card', IncomeCategory.FOOD_SALES, 'Imported Daily Card', assignCovers());
            add(eftVal, 'Cheque / EFT', IncomeCategory.FOOD_SALES, 'Imported Daily EFT', assignCovers());
            add(chargeVal, 'Account', IncomeCategory.FOOD_SALES, 'Imported Daily Account', assignCovers());
            add(tipsVal, 'Cash', IncomeCategory.TIPS, 'Imported Daily Tips'); // Tips don't get covers

        } else if (forcedType === 'EXPENSE' && cols.length === 5) {
            // --- LOGIC FOR EXPENSE TEMPLATE IMPORT (5 Columns) ---
            // Date(0), Category(1), Description(2), Method(3), Amount(4)
            const category = cols[1];
            const description = cols[2];
            const paymentMethod = cols[3];
            const amount = parseCurrency(cols[4]);

            if (!isNaN(amount) && description) {
                onAddTransaction({ 
                    date, 
                    type: 'EXPENSE', 
                    category, 
                    description, 
                    paymentMethod, 
                    amount 
                });
                importCount++;
            }
        } else {
            // --- LOGIC FOR STANDARD LIST IMPORT (fallback) ---
            // Expected: Date(0), Type(1), Category(2), Description(3), Method(4), Amount(5)
            
            if (cols.length >= 6) {
                const type = forcedType || (cols[1] as TransactionType);
                const category = cols[2];
                const description = cols[3];
                const paymentMethod = cols[4];
                const amount = parseCurrency(cols[5]);
                
                if (!isNaN(amount) && description) {
                    onAddTransaction({ date, type, category, description, paymentMethod, amount });
                    importCount++;
                }
            }
        }
      });

      if (importCount > 0) {
        alert(`Successfully imported ${importCount} transactions.`);
      } else {
        alert('No valid transactions found to import. Please check file format.');
      }
    };
    reader.readAsText(file);
  };

  const getPageTitle = () => {
    if (forcedPaymentMethod === 'Loan Account') return 'Loan Account Management';
    if (forcedType === 'INCOME') return 'Income Management';
    if (forcedType === 'EXPENSE') return 'Expense Management';
    return 'Transactions';
  };

  const SubFilterButton = ({ label, active, onClick, icon: Icon }: any) => (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium transition-all duration-200 border whitespace-nowrap ${
        active 
          ? 'bg-slate-800 text-white border-slate-800 shadow-md transform scale-105' 
          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
      }`}
    >
      {Icon && <Icon className="w-3 h-3 md:w-4 md:h-4" />}
      <span>{label}</span>
    </button>
  );

  const getAddButtonLabel = () => {
    if (forcedPaymentMethod === 'Loan Account') return 'Loan Purchase';
    if (forcedType === 'INCOME' && incomeSubFilter !== 'ALL') {
        return incomeSubFilter === 'TIPS' ? 'Tips' : `${incomeSubFilter.charAt(0) + incomeSubFilter.slice(1).toLowerCase()} Entry`;
    }
    if (forcedType === 'EXPENSE' && expenseSubFilter !== 'ALL') {
        switch(expenseSubFilter) {
            case 'RM': return 'R&M';
            case 'PETTY_CASH': return 'Petty Cash';
            case 'OPS': return 'Ops Cost';
            case 'FOOD': return 'Food Cost';
            case 'SALARY': return 'Salary';
            default: return expenseSubFilter.charAt(0) + expenseSubFilter.slice(1).toLowerCase();
        }
    }
    return forcedType ? (forcedType === 'INCOME' ? 'Income' : 'Expense') : 'Entry';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{getPageTitle()}</h2>
          <p className="text-slate-500">
            {forcedPaymentMethod === 'Loan Account' ? 'Track purchases made via Loan Account' : (forcedType === 'INCOME' ? 'Daily sales and revenue tracking' : 'Track costs and expenses')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Show Import/Export/Template buttons for both INCOME and EXPENSE */}
          {forcedType && (
            <>
              <input 
                type="file" 
                accept=".csv,.xls,.xlsx" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
              />
              <button 
                onClick={handleDownloadTemplate}
                className="px-4 py-2.5 rounded-lg flex items-center space-x-2 font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                title="Download Import Template"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Template</span>
              </button>
              <button 
                onClick={handleImportClick}
                className="px-4 py-2.5 rounded-lg flex items-center space-x-2 font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Import</span>
              </button>
              <button 
                onClick={handleExport}
                className="px-4 py-2.5 rounded-lg flex items-center space-x-2 font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </>
          )}

          {forcedType && onClearTransactions && (
            <button 
                onClick={onClearTransactions}
                className="px-4 py-2.5 rounded-lg flex items-center space-x-2 font-medium bg-white border border-red-200 text-red-600 hover:bg-red-50 transition-colors shadow-sm"
                title="Clear All Data"
            >
                <Eraser className="w-4 h-4" />
                <span className="hidden sm:inline">Clear Data</span>
            </button>
          )}

          <button 
            onClick={handleOpenAddModal}
            className={`px-5 py-2.5 rounded-lg flex items-center space-x-2 font-medium shadow-sm transition-colors text-white ${forcedType === 'EXPENSE' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
          >
            <PlusCircle className="w-5 h-5" />
            <span>Add {getAddButtonLabel()}</span>
          </button>
        </div>
      </div>

      {/* Income Sub-Menu */}
      {forcedType === 'INCOME' && (
        <div className="flex flex-wrap gap-2 pb-2 overflow-x-auto">
          <SubFilterButton label="All Income" active={incomeSubFilter === 'ALL'} onClick={() => setIncomeSubFilter('ALL')} />
          <SubFilterButton label="Cash" icon={Coins} active={incomeSubFilter === 'CASH'} onClick={() => setIncomeSubFilter('CASH')} />
          <SubFilterButton label="Credit Card" icon={CreditCard} active={incomeSubFilter === 'CARD'} onClick={() => setIncomeSubFilter('CARD')} />
          <SubFilterButton label="Account" icon={FileText} active={incomeSubFilter === 'ACCOUNT'} onClick={() => setIncomeSubFilter('ACCOUNT')} />
          <SubFilterButton label="Tips" icon={Banknote} active={incomeSubFilter === 'TIPS'} onClick={() => setIncomeSubFilter('TIPS')} />
        </div>
      )}

      {/* Expense Sub-Menu - Hide in Loan Account view for simplicity or show all if desired, keeping it clean for Loan Account */}
      {forcedType === 'EXPENSE' && !forcedPaymentMethod && (
        <div className="flex flex-wrap gap-2 pb-2 overflow-x-auto">
            <SubFilterButton label="All Expenses" active={expenseSubFilter === 'ALL'} onClick={() => setExpenseSubFilter('ALL')} />
            <SubFilterButton label="Salary's" icon={Users} active={expenseSubFilter === 'SALARY'} onClick={() => setExpenseSubFilter('SALARY')} />
            <SubFilterButton label="R&M" icon={Wrench} active={expenseSubFilter === 'RM'} onClick={() => setExpenseSubFilter('RM')} />
            <SubFilterButton label="Food" icon={Utensils} active={expenseSubFilter === 'FOOD'} onClick={() => setExpenseSubFilter('FOOD')} />
            <SubFilterButton label="Alcohol" icon={Wine} active={expenseSubFilter === 'ALCOHOL'} onClick={() => setExpenseSubFilter('ALCOHOL')} />
            <SubFilterButton label="Petty Cash" icon={Coins} active={expenseSubFilter === 'PETTY_CASH'} onClick={() => setExpenseSubFilter('PETTY_CASH')} />
            <SubFilterButton label="Rent" icon={Building} active={expenseSubFilter === 'RENT'} onClick={() => setExpenseSubFilter('RENT')} />
            <SubFilterButton label="Utility's" icon={Zap} active={expenseSubFilter === 'UTILITIES'} onClick={() => setExpenseSubFilter('UTILITIES')} />
            <SubFilterButton label="Operational costs" icon={Briefcase} active={expenseSubFilter === 'OPS'} onClick={() => setExpenseSubFilter('OPS')} />
        </div>
      )}

      {/* Search Bar (Filters still useful for searching descriptions within days) */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {!forcedType && (
            <div className="flex gap-2 w-full md:w-auto">
            <button onClick={() => setFilterType('ALL')} className={`px-4 py-2 rounded-lg text-sm font-medium ${filterType === 'ALL' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`}>All</button>
            <button onClick={() => setFilterType('INCOME')} className={`px-4 py-2 rounded-lg text-sm font-medium ${filterType === 'INCOME' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700'}`}>Income</button>
            <button onClick={() => setFilterType('EXPENSE')} className={`px-4 py-2 rounded-lg text-sm font-medium ${filterType === 'EXPENSE' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700'}`}>Expenses</button>
            </div>
        )}
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase font-medium">
              <tr>
                {forcedType === 'INCOME' ? (
                  <>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4 text-right">Total Sales</th>
                    <th className="px-6 py-4 text-right">Cash</th>
                    <th className="px-6 py-4 text-right">Card</th>
                    <th className="px-6 py-4 text-right">Cheque / Eft</th>
                    <th className="px-6 py-4 text-right">Charge</th>
                    <th className="px-6 py-4 text-center">Covers</th>
                    <th className="px-6 py-4 text-right">Tips</th>
                    <th className="px-6 py-4 text-center">Action</th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4">Method</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                    <th className="px-6 py-4 text-center">Action</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {forcedType === 'INCOME' ? (
                // --- INCOME DAILY SHEET VIEW ---
                dailyIncomeGroups.length === 0 ? (
                  <tr><td colSpan={9} className="px-6 py-8 text-center text-slate-400">No income records found.</td></tr>
                ) : (
                  dailyIncomeGroups.map((g) => (
                    <React.Fragment key={g.date}>
                      <tr className="hover:bg-slate-50 transition-colors bg-white font-medium">
                        <td className="px-6 py-4 whitespace-nowrap text-slate-700">
                          {formatDate(g.date)}
                        </td>
                        <td className="px-6 py-4 text-right text-emerald-600 font-bold">R{g.total.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right text-slate-600">R{g.cash.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right text-slate-600">R{g.card.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right text-slate-600">R{g.eft.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right text-slate-600">R{g.charge.toLocaleString()}</td>
                        <td className="px-6 py-4 text-center text-slate-600">{g.covers}</td>
                        <td className="px-6 py-4 text-right text-emerald-500">R{g.tips.toLocaleString()}</td>
                        <td className="px-6 py-4 text-center">
                          <button 
                            onClick={() => toggleDateExpand(g.date)}
                            className="text-slate-400 hover:text-emerald-600 transition-colors p-1"
                            title="View Details"
                          >
                             {expandedDates[g.date] ? <ChevronDown className="w-5 h-5"/> : <ChevronRight className="w-5 h-5"/>}
                          </button>
                        </td>
                      </tr>
                      {/* Expanded Details Row */}
                      {expandedDates[g.date] && (
                        <tr className="bg-slate-50/50">
                          <td colSpan={9} className="px-0 py-0">
                             <div className="px-6 py-3 border-b border-slate-100 shadow-inner">
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Detailed Breakdown for {formatDate(g.date)}</p>
                                <table className="w-full text-xs">
                                  <tbody>
                                    {g.transactions.map(t => (
                                      <tr key={t.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-100/50">
                                        <td className="py-2 pl-2 w-24 text-slate-500">{t.category}</td>
                                        <td className="py-2 text-slate-700">{t.description}</td>
                                        <td className="py-2 text-slate-500">{t.paymentMethod}</td>
                                        <td className="py-2 text-right font-medium text-slate-700">R{t.amount.toLocaleString()}</td>
                                        <td className="py-2 text-right w-10">
                                            <button onClick={() => onDeleteTransaction(t.id)} className="text-red-400 hover:text-red-600">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                             </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )
              ) : (
                // --- EXPENSE / STANDARD LIST VIEW ---
                filteredTransactions.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-400">No transactions found matching your filters.</td></tr>
                ) : (
                  filteredTransactions.map((t) => (
                    <tr 
                      key={t.id} 
                      className={`hover:bg-slate-50 transition-colors ${forcedType === 'EXPENSE' ? 'cursor-pointer' : ''}`}
                      onDoubleClick={() => forcedType === 'EXPENSE' && handleEditClick(t)}
                    >
                      {editingId === t.id ? (
                          // --- EDIT MODE ROW ---
                          <>
                            <td className="px-6 py-4">
                                <input 
                                    type="date"
                                    className="w-full p-1 border rounded text-xs"
                                    value={editForm.date}
                                    onChange={(e) => setEditForm({...editForm, date: e.target.value})}
                                />
                            </td>
                            <td className="px-6 py-4">
                                <select 
                                    className="w-full p-1 border rounded text-xs"
                                    value={editForm.category}
                                    onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                                >
                                    {forcedType === 'EXPENSE' 
                                      ? EXPENSE_DROPDOWN_OPTS.map(c => <option key={c} value={c}>{c}</option>)
                                      : Object.values(ExpenseCategory).map(c => <option key={c} value={c}>{c}</option>)
                                    }
                                </select>
                            </td>
                            <td className="px-6 py-4">
                                <input 
                                    type="text"
                                    className="w-full p-1 border rounded text-xs"
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                                />
                            </td>
                            <td className="px-6 py-4">
                                <select 
                                    className="w-full p-1 border rounded text-xs"
                                    value={editForm.paymentMethod}
                                    disabled={!!forcedPaymentMethod}
                                    onChange={(e) => setEditForm({...editForm, paymentMethod: e.target.value})}
                                >
                                    {PAYMENT_METHODS.map(m => (
                                      <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <input 
                                    type="number"
                                    step="0.01"
                                    className="w-24 p-1 border rounded text-xs text-right"
                                    value={editForm.amount}
                                    onChange={(e) => setEditForm({...editForm, amount: parseFloat(e.target.value) || 0})}
                                />
                            </td>
                            <td className="px-6 py-4 text-center flex justify-center gap-2">
                                <button onClick={handleSaveEdit} className="text-emerald-500 hover:text-emerald-700">
                                    <Save className="w-4 h-4" />
                                </button>
                                <button onClick={handleCancelEdit} className="text-slate-400 hover:text-slate-600">
                                    <X className="w-4 h-4" />
                                </button>
                            </td>
                          </>
                      ) : (
                          // --- DISPLAY MODE ROW ---
                          <>
                            <td className="px-6 py-4 text-slate-600 whitespace-nowrap">{formatDate(t.date)}</td>
                            <td className="px-6 py-4 text-slate-700 font-medium">{t.category}</td>
                            <td className="px-6 py-4 text-slate-500">{t.description}</td>
                            <td className="px-6 py-4 text-slate-500">{t.paymentMethod}</td>
                            <td className={`px-6 py-4 text-right font-bold ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-slate-800'}`}>
                                R{t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-6 py-4 text-center flex justify-center gap-2">
                                {forcedType === 'EXPENSE' && (
                                    <button onClick={() => handleEditClick(t)} className="text-slate-400 hover:text-blue-500 transition-colors">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                )}
                                <button onClick={() => onDeleteTransaction(t.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </td>
                          </>
                      )}
                    </tr>
                  ))
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className={`px-6 py-4 border-b border-slate-100 flex justify-between items-center ${newTrans.type === 'INCOME' ? 'bg-emerald-50' : 'bg-red-50'}`}>
              <h3 className={`font-bold text-lg ${newTrans.type === 'INCOME' ? 'text-emerald-800' : 'text-red-800'}`}>
                  New {newTrans.type === 'INCOME' ? 'Income' : (forcedPaymentMethod ? 'Loan Purchase' : 'Expense')}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {!forcedType && (
                    <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Type</label>
                    <select 
                        className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={newTrans.type}
                        onChange={(e) => setNewTrans({ ...newTrans, type: e.target.value as TransactionType })}
                    >
                        <option value="INCOME">Income</option>
                        <option value="EXPENSE">Expense</option>
                    </select>
                    </div>
                )}
                <div className={forcedType ? 'col-span-2' : ''}>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Date</label>
                  <input 
                    type="date"
                    required
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newTrans.date}
                    onChange={(e) => setNewTrans({ ...newTrans, date: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className={newTrans.type !== 'INCOME' ? 'col-span-2' : ''}>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Category</label>
                    <select 
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newTrans.category}
                    onChange={(e) => setNewTrans({ ...newTrans, category: e.target.value })}
                    >
                    {newTrans.type === 'INCOME' 
                        ? Object.values(IncomeCategory).map(c => <option key={c} value={c}>{c}</option>)
                        : EXPENSE_DROPDOWN_OPTS.map(c => <option key={c} value={c}>{c}</option>)
                    }
                    </select>
                </div>
                {newTrans.type === 'INCOME' && (
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Covers (Opt)</label>
                        <input 
                            type="number"
                            min="0"
                            placeholder="e.g. 50"
                            className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={newTrans.covers}
                            onChange={(e) => setNewTrans({ ...newTrans, covers: e.target.value })}
                        />
                    </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Description</label>
                <input 
                  type="text"
                  required
                  placeholder={newTrans.type === 'INCOME' ? "e.g. Lunch Service" : "e.g. Supplier Payment"}
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newTrans.description}
                  onChange={(e) => setNewTrans({ ...newTrans, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Amount (R)</label>
                  <input 
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newTrans.amount}
                    onChange={(e) => setNewTrans({ ...newTrans, amount: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Payment Method</label>
                  <select 
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newTrans.paymentMethod}
                    disabled={!!forcedPaymentMethod}
                    onChange={(e) => setNewTrans({ ...newTrans, paymentMethod: e.target.value })}
                  >
                    {PAYMENT_METHODS.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-600 font-medium hover:bg-slate-50">Cancel</button>
                <button type="submit" className={`px-5 py-2.5 rounded-lg text-white font-medium shadow-lg transition-colors ${newTrans.type === 'INCOME' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' : 'bg-red-600 hover:bg-red-700 shadow-red-200'}`}>Save {newTrans.type === 'INCOME' ? 'Income' : (forcedPaymentMethod ? 'Loan Purchase' : 'Expense')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionManager;