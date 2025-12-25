import React, { useState, useRef } from 'react';

type Progress = { current: number; total: number };

const tabs = [
  { id: 'overview', label: 'Overview', icon: 'fa-chart-area' },
  { id: 'invoices', label: 'Invoices', icon: 'fa-file-invoice' },
  { id: 'settings', label: 'Settings', icon: 'fa-cog' },
];

export default function InvoiceVision() {
  const [activeSubTab, setActiveSubTab] = useState<string>(tabs[0].id);
  const [processing, setProcessing] = useState(false);
  const processingProgress = useRef<Progress>({ current: 0, total: 0 });

  return (
    <div className="space-y-8">
      <div className="flex gap-4 border-b border-gray-100 overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`pb-4 px-2 text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === tab.id
                ? 'border-b-4 border-red-600 text-red-600'
                : 'text-gray-500'
            }`}
          >
            <i className={`fas ${tab.icon}`} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="space-y-10">
        <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm text-center">
          {processing ? (
            <div className="py-10">
              <div className="relative w-16 h-16 mx-auto mb-6">
                <div className="absolute inset-0 border-4 border-red-50 rounded-full" />
                <div className="absolute inset-0 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="text-red-500 font-black uppercase tracking-widest text-[10px]">
                Auditing Invoice {processingProgress.current.current} of {processingProgress.current.total}...
              </p>
            </div>
          ) : (
            <>
              <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase italic tracking-tight">Invoice Vision</h3>
              <p className="text-sm text-gray-600">Analyze invoices and surface insights.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
