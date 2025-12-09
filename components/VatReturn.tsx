import React, { useState, useMemo } from 'react';
import { Transaction, ExpenseCategory, IncomeCategory } from '../types';
import { Calendar, Download, TrendingUp, TrendingDown, Info, DollarSign, ListFilter, CheckCircle, XCircle } from 'lucide-react';

interface VatReturnProps {
  transactions: Transaction[];
  companyName: string;
}

const VatReturn: React.FC<VatReturnProps> = ({ transactions, companyName }) => {
  // Default to current month, but allow switching to 'ALL'
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [activeTab, setActiveTab] = useState<'CALCULATION' | 'EXCLUDED'>('CALCULATION');

  const VAT_RATE = 0.15; // 15% standard rate

  // Helper: Extract VAT from Inclusive Amount
  // Formula: Amount - (Amount / 1.15)
  const calculateVat = (inclusiveAmount: number) => {
    return inclusiveAmount - (inclusiveAmount / (1 + VAT_RATE));
  };

  const getVatStatus = (t: Transaction) => {
    if (t.type === 'INCOME') {
      if (t.category === IncomeCategory.TIPS || t.category === 'Tips') return 'EXEMPT';
      return 'STANDARD';
    } else {
      // Expenses
      const cat = t.category.toString();
      const lowerCat = cat.toLowerCase();
      
      // Strict list of Labor/Salary categories that are exempt from Input Tax
      const laborKeywords = ['labor', 'salary', 'wage', 'payroll'];
      if (laborKeywords.some(k => lowerCat.includes(k))) return 'EXEMPT'; // Labor is not vatable supply
      if (cat === "Salary's") return 'EXEMPT'; 

      return 'STANDARD';
    }
  };

  const vatData = useMemo(() => {
    // 1. Filter by Date (Month or All Time)
    const timeFiltered = selectedMonth === 'ALL' 
      ? transactions 
      : transactions.filter(t => t.date.startsWith(selectedMonth));

    // 2. Separate into Buckets
    const vatableIncome: Transaction[] = [];
    const vatableExpenses: Transaction[] = [];
    const excludedTransactions: Transaction[] = [];

    timeFiltered.forEach(t => {
      const status = getVatStatus(t);
      if (status === 'EXEMPT') {
        excludedTransactions.push(t);
      } else if (t.type === 'INCOME') {
        vatableIncome.push(t);
      } else if (t.type === 'EXPENSE') {
        vatableExpenses.push(t);
      }
    });

    // 3. Calculate Totals
    const totalIncomeInc = vatableIncome.reduce((sum, t) => sum + t.amount, 0);
    const outputTax = calculateVat(totalIncomeInc);
    const incomeExcl = totalIncomeInc - outputTax;

    const totalExpenseInc = vatableExpenses.reduce((sum, t) => sum + t.amount, 0);
    const inputTax = calculateVat(totalExpenseInc);
    const expenseExcl = totalExpenseInc - inputTax;

    const netVat = outputTax - inputTax;
    
    return {
      vatableIncome,
      vatableExpenses,
      excludedTransactions,
      totalIncomeInc,
      outputTax,
      incomeExcl,
      totalExpenseInc,
      inputTax,
      expenseExcl,
      netVat
    };
  }, [transactions, selectedMonth]);

  const handleExport = () => {
    const headers = ['Type', 'Date', 'Description', 'Category', 'Status', 'Amount (Inc)', 'VAT Portion'];
    const rows: string[] = [];

    // Income Rows
    vatData.vatableIncome.forEach(t => {
      const vat = calculateVat(t.amount);
      rows.push(`Output (Sales),${t.date},"${t.description.replace(/"/g, '""')}",${t.category},Standard Rate,${t.amount.toFixed(2)},${vat.toFixed(2)}`);
    });

    // Expense Rows
    vatData.vatableExpenses.forEach(t => {
      const vat = calculateVat(t.amount);
      rows.push(`Input (Purchases),${t.date},"${t.description.replace(/"/g, '""')}",${t.category},Standard Rate,${t.amount.toFixed(2)},${vat.toFixed(2)}`);
    });

    // Excluded Rows (for completeness)
    vatData.excludedTransactions.forEach(t => {
       rows.push(`Excluded (${t.type}),${t.date},"${t.description.replace(/"/g, '""')}",${t.category},Exempt/Non-Vatable,${t.amount.toFixed(2)},0.00`);
    });

    // Totals Row
    rows.push(`,,,,,,`);
    rows.push(`TOTAL OUTPUT TAX,,,,,${vatData.totalIncomeInc.toFixed(2)},${vatData.outputTax.toFixed(2)}`);
    rows.push(`TOTAL INPUT TAX,,,,,${vatData.totalExpenseInc.toFixed(2)},${vatData.inputTax.toFixed(2)}`);
    rows.push(`NET VAT PAYABLE,,,,,,${vatData.netVat.toFixed(2)}`);

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const periodName = selectedMonth === 'ALL' ? 'All_Time' : selectedMonth;
    link.download = `VAT_Return_${periodName}_${companyName.replace(/\s+/g, '_')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">VAT Return Assistant</h2>
          <p className="text-slate-500">Auto-calculated Output Tax (Sales) & Input Tax (Expenses)</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="text-sm font-medium text-slate-700 outline-none bg-transparent"
            >
                <option value="ALL">All History (Total)</option>
                {/* Generate last 12 months dynamically could be added here, but simple input works */}
                <option value={new Date().toISOString().slice(0, 7)}>Current Month</option>
                <option value={new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7)}>Last Month</option>
            </select>
            {selectedMonth !== 'ALL' && selectedMonth.length > 3 && (
                 <input 
                 type="month" 
                 value={selectedMonth} 
                 onChange={(e) => setSelectedMonth(e.target.value)}
                 className="text-sm font-medium text-slate-700 outline-none w-24"
               />
            )}
          </div>
          <button 
            onClick={handleExport}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Output Tax */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingUp className="w-24 h-24 text-emerald-600" />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Output Tax (Sales)</p>
            <h3 className="text-2xl font-bold text-emerald-600">R{vatData.outputTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            <p className="text-xs text-slate-400 mt-2">
              On Vatable Sales: R{vatData.totalIncomeInc.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Input Tax */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingDown className="w-24 h-24 text-red-600" />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Input Tax (Purchases)</p>
            <h3 className="text-2xl font-bold text-red-600">R{vatData.inputTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            <p className="text-xs text-slate-400 mt-2">
              On Vatable Expenses: R{vatData.totalExpenseInc.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Net Position */}
        <div className={`rounded-xl shadow-sm border p-6 relative overflow-hidden ${vatData.netVat > 0 ? 'bg-slate-800 border-slate-700' : 'bg-emerald-600 border-emerald-500'}`}>
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <DollarSign className="w-24 h-24 text-white" />
          </div>
          <div className="relative z-10 text-white">
            <p className="text-sm font-medium opacity-80 uppercase tracking-wider mb-1">
              {vatData.netVat > 0 ? 'Payment Due to SARS' : 'Refund Due from SARS'}
            </p>
            <h3 className="text-3xl font-bold">
              R{Math.abs(vatData.netVat).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-xs opacity-60 mt-2">
              {vatData.netVat > 0 ? 'Output exceeds Input' : 'Input exceeds Output'}
            </p>
          </div>
        </div>
      </div>

      {/* TABS HEADER */}
      <div className="border-b border-slate-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('CALCULATION')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'CALCULATION'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <ListFilter className="w-4 h-4" />
              Tax Calculation
              <span className="bg-indigo-100 text-indigo-600 py-0.5 px-2.5 rounded-full text-xs">
                {vatData.vatableIncome.length + vatData.vatableExpenses.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('EXCLUDED')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'EXCLUDED'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Info className="w-4 h-4" />
              Excluded Items (Audit)
              <span className="bg-slate-100 text-slate-600 py-0.5 px-2.5 rounded-full text-xs">
                {vatData.excludedTransactions.length}
              </span>
            </button>
          </nav>
      </div>

      {/* CONTENT: CALCULATION TABLES */}
      {activeTab === 'CALCULATION' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Income Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-emerald-50/50 flex justify-between items-center">
                <h3 className="font-semibold text-emerald-800">Vatable Income (Output)</h3>
                <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-1 rounded">Standard Rate 15%</span>
            </div>
            <div className="overflow-x-auto max-h-96 scrollbar-thin">
                <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase font-medium sticky top-0">
                    <tr>
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Desc</th>
                    <th className="px-4 py-2 text-right">Amount</th>
                    <th className="px-4 py-2 text-right">VAT</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {vatData.vatableIncome.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2 whitespace-nowrap text-slate-600">{t.date}</td>
                        <td className="px-4 py-2 text-slate-600 truncate max-w-[150px]">{t.description}</td>
                        <td className="px-4 py-2 text-right text-slate-800">R{t.amount.toFixed(2)}</td>
                        <td className="px-4 py-2 text-right text-emerald-600 font-medium">R{calculateVat(t.amount).toFixed(2)}</td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
            </div>

            {/* Expenses Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-red-50/50 flex justify-between items-center">
                <h3 className="font-semibold text-red-800">Vatable Expenses (Input)</h3>
                <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">Standard Rate 15%</span>
            </div>
            <div className="overflow-x-auto max-h-96 scrollbar-thin">
                <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase font-medium sticky top-0">
                    <tr>
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Category</th>
                    <th className="px-4 py-2 text-right">Amount</th>
                    <th className="px-4 py-2 text-right">VAT</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {vatData.vatableExpenses.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2 whitespace-nowrap text-slate-600">{t.date}</td>
                        <td className="px-4 py-2 text-slate-600 truncate max-w-[150px]">{t.category}</td>
                        <td className="px-4 py-2 text-right text-slate-800">R{t.amount.toFixed(2)}</td>
                        <td className="px-4 py-2 text-right text-red-600 font-medium">R{calculateVat(t.amount).toFixed(2)}</td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
            </div>
        </div>
      )}

      {/* CONTENT: EXCLUDED ITEMS */}
      {activeTab === 'EXCLUDED' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-semibold text-slate-700">Non-Vatable & Exempt Transactions</h3>
                <p className="text-xs text-slate-500">Items like Salaries, Wages, and Tips are excluded from VAT calculations.</p>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase font-medium">
                        <tr>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Type</th>
                            <th className="px-6 py-3">Category</th>
                            <th className="px-6 py-3">Reason</th>
                            <th className="px-6 py-3 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {vatData.excludedTransactions.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">No excluded items found for this period.</td></tr>
                        ) : (
                            vatData.excludedTransactions.map(t => (
                                <tr key={t.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-3 text-slate-600">{t.date}</td>
                                    <td className="px-6 py-3">
                                        <span className={`text-xs px-2 py-1 rounded font-medium ${t.type === 'INCOME' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                            {t.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-slate-700 font-medium">{t.category}</td>
                                    <td className="px-6 py-3 text-slate-500 italic">Exempt / Non-Vatable Supply</td>
                                    <td className="px-6 py-3 text-right text-slate-600">R{t.amount.toFixed(2)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
             </div>
          </div>
      )}

    </div>
  );
};

export default VatReturn;