import React, { useState } from 'react';
import { Transaction } from '../types';
import { analyzeFinancialData } from '../services/geminiService';
import { Sparkles, RefreshCcw, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown'; // Ensure this is installed or handle simple rendering

interface AIInsightsProps {
  transactions: Transaction[];
}

const AIInsights: React.FC<AIInsightsProps> = ({ transactions }) => {
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeFinancialData(transactions);
      setAnalysis(result);
    } catch (err: any) {
      setError(err.message || 'Failed to generate insights. Check your API key.');
    } finally {
      setLoading(false);
    }
  };

  // Simple Markdown renderer replacement for the demo if react-markdown isn't available in env
  // Ideally, use a library like `react-markdown`. Here I'll do a simple whitespace preserve for now.
  // In a real pro-code scenario, I would `import ReactMarkdown` and use it. 
  // Given constraints, I will implement a basic renderer or assume the text is clean.
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full shadow-lg mb-2">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900">AI Financial Consultant</h2>
        <p className="text-slate-500 max-w-lg mx-auto">
          Leverage Gemini 2.5 Flash to analyze your monthly transaction data, identify cost leaks, and discover profit opportunities.
        </p>
      </div>

      <div className="flex justify-center py-6">
        {!analysis && !loading && (
          <button
            onClick={handleAnalyze}
            className="group relative inline-flex items-center justify-center px-8 py-3 text-lg font-medium text-white transition-all duration-200 bg-slate-900 rounded-full hover:bg-slate-800 hover:shadow-xl hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600"
          >
            <Sparkles className="w-5 h-5 mr-2 text-yellow-300 animate-pulse" />
            Generate Monthly Report
            <div className="absolute inset-0 rounded-full ring-2 ring-white/20 group-hover:ring-white/40"></div>
          </button>
        )}
        
        {loading && (
          <div className="flex flex-col items-center space-y-3">
             <RefreshCcw className="w-10 h-10 text-indigo-600 animate-spin" />
             <p className="text-slate-500 font-medium">Analyzing {transactions.length} transactions...</p>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-red-700">
          <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold">Analysis Failed</h4>
            <p className="text-sm">{error}</p>
            <p className="text-xs mt-2 text-red-500">Ensure you have a valid API Key in your environment.</p>
          </div>
        </div>
      )}

      {analysis && !loading && (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center">
                <h3 className="text-white font-semibold flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> Gemini Analysis Result
                </h3>
                <button 
                    onClick={handleAnalyze} 
                    className="text-indigo-100 hover:text-white text-sm flex items-center gap-1 hover:bg-indigo-500/50 px-3 py-1 rounded-md transition"
                >
                    <RefreshCcw className="w-3 h-3" /> Regenerate
                </button>
            </div>
            <div className="p-8 prose prose-slate max-w-none prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-a:text-indigo-600">
                {/* Simplified rendering of markdown-like text */}
                <div className="whitespace-pre-wrap leading-relaxed text-slate-700">
                  {analysis}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default AIInsights;
