import React from 'react';
import { Transaction } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface ReportsProps {
  transactions: Transaction[];
}

interface DailyData {
  date: string;
  income: number;
  expense: number;
}

const Reports: React.FC<ReportsProps> = ({ transactions }) => {
  // Aggregate data by Date for the Area Chart
  const dataByDate = transactions.reduce((acc, t) => {
    const date = t.date;
    if (!acc[date]) acc[date] = { date, income: 0, expense: 0 };
    if (t.type === 'INCOME') acc[date].income += t.amount;
    else acc[date].expense += t.amount;
    return acc;
  }, {} as Record<string, DailyData>);

  const timelineData = Object.values(dataByDate).sort((a: DailyData, b: DailyData) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Aggregate data by Category for Bar Chart (Expenses only)
  const expenseCats = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const barData = Object.keys(expenseCats).map(k => ({
    name: k.split(' - ').pop() || k, // Shorten name
    amount: expenseCats[k]
  })).sort((a, b) => b.amount - a.amount);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Visual Reports</h2>
        <p className="text-slate-500">Deep dive into your financial trends</p>
      </div>

      {/* Income vs Expense Timeline */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">Income vs Expenses (Daily Trend)</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timelineData}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#64748b', fontSize: 12}} 
                tickFormatter={formatDate}
              />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(val) => `R${val}`} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number) => [`R${value.toLocaleString()}`, '']}
                labelFormatter={formatDate}
              />
              <Legend verticalAlign="top" height={36} />
              <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" name="Income" />
              <Area type="monotone" dataKey="expense" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" name="Expenses" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Expense Breakdown Bar Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">Expense Breakdown by Category</h3>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={barData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0"/>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={150} tick={{fill: '#475569', fontSize: 13}} />
              <Tooltip 
                cursor={{fill: '#f1f5f9'}}
                formatter={(value: number) => [`R${value.toLocaleString()}`, 'Amount']}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="amount" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Reports;