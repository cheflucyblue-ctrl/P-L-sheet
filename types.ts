export type TransactionType = 'INCOME' | 'EXPENSE';

export enum ExpenseCategory {
  COGS_FOOD = 'COGS - Food',
  COGS_BEV = 'COGS - Beverage',
  LABOR_FOH = 'Labor - Front of House',
  LABOR_BOH = 'Labor - Back of House',
  LABOR_MGMT = 'Labor - Management',
  RENT = 'Rent',
  UTILITIES = 'Utilities',
  MARKETING = 'Marketing & Ads',
  REPAIRS = 'Repairs & Maintenance',
  SUPPLIES = 'Operating Supplies',
  ADMIN = 'General & Admin',
  OTHER = 'Other'
}

export enum IncomeCategory {
  FOOD_SALES = 'Food Sales',
  BEV_SALES = 'Beverage Sales',
  CATERING = 'Catering/Events',
  DELIVERY = 'Third-party Delivery',
  MERCH = 'Merchandise',
  TIPS = 'Tips / Gratuity',
  OTHER = 'Other'
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: ExpenseCategory | IncomeCategory | string;
  paymentMethod: string;
  covers?: number;
}

export interface CompanyProfile {
  name: string;
  address: string;
  phone: string;
  owner: string;
  registrationNumber: string;
  email: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  primeCost: number; // COGS + Labor
  primeCostPercentage: number;
}

export interface MonthlyAnalysis {
  analysis: string;
  isLoading: boolean;
  error: string | null;
}