import { Transaction, TransactionType, ExpenseCategory, IncomeCategory, CompanyProfile } from './types';

export const MOCK_TRANSACTIONS: Transaction[] = [
  // Income entries removed for clean slate
  
  // Expenses - COGS
  { id: '6', date: '2023-10-01', description: 'Sysco Food Delivery', amount: 2500.00, type: 'EXPENSE', category: ExpenseCategory.COGS_FOOD, paymentMethod: 'Invoice' },
  { id: '7', date: '2023-10-02', description: 'Local Produce Vendor', amount: 600.00, type: 'EXPENSE', category: ExpenseCategory.COGS_FOOD, paymentMethod: 'Check' },
  { id: '8', date: '2023-10-03', description: 'Wine & Spirits Restock', amount: 1800.00, type: 'EXPENSE', category: ExpenseCategory.COGS_BEV, paymentMethod: 'ACH' },

  // Expenses - Labor
  { id: '9', date: '2023-10-07', description: 'Weekly Payroll - FOH', amount: 3200.00, type: 'EXPENSE', category: ExpenseCategory.LABOR_FOH, paymentMethod: 'Payroll' },
  { id: '10', date: '2023-10-07', description: 'Weekly Payroll - BOH', amount: 4100.00, type: 'EXPENSE', category: ExpenseCategory.LABOR_BOH, paymentMethod: 'Payroll' },
  { id: '11', date: '2023-10-07', description: 'Manager Salary', amount: 1500.00, type: 'EXPENSE', category: ExpenseCategory.LABOR_MGMT, paymentMethod: 'Payroll' },

  // Expenses - Overhead
  { id: '12', date: '2023-10-01', description: 'October Rent', amount: 4500.00, type: 'EXPENSE', category: ExpenseCategory.RENT, paymentMethod: 'Check' },
  { id: '13', date: '2023-10-05', description: 'Facebook Ad Campaign', amount: 300.00, type: 'EXPENSE', category: ExpenseCategory.MARKETING, paymentMethod: 'Credit Card' },
  { id: '15', date: '2023-10-10', description: 'HVAC Repair', amount: 650.00, type: 'EXPENSE', category: ExpenseCategory.REPAIRS, paymentMethod: 'Credit Card' },
];

export const PAYMENT_METHODS = ['Credit Card', 'Cash', 'Account', 'Check', 'ACH', 'Bank Transfer', 'Payroll', 'Direct Deposit', 'Loan Account', 'Other'];

export const DEFAULT_COMPANY_PROFILE: CompanyProfile = {
  name: 'BistroBalance',
  address: '123 Culinary Ave, Food City',
  phone: '(555) 123-4567',
  owner: 'Jane Doe',
  registrationNumber: 'REG-2023-001',
  email: 'admin@bistro.com'
};