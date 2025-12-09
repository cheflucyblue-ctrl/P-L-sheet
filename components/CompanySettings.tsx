import React, { useState, useEffect, useRef } from 'react';
import { CompanyProfile } from '../types';
import { Building, Phone, Mail, User, FileText, MapPin, Save, CheckCircle, Database, Download, Upload, Cloud, RefreshCw, FolderInput, Copy, FileSpreadsheet } from 'lucide-react';
import { storageService } from '../services/storage';

interface CompanySettingsProps {
  profile: CompanyProfile;
  onSave: (profile: CompanyProfile) => void;
  onDataRestored?: () => void;
}

const CompanySettings: React.FC<CompanySettingsProps> = ({ profile, onSave, onDataRestored }) => {
  const [formData, setFormData] = useState<CompanyProfile>(profile);
  const [isSaved, setIsSaved] = useState(false);
  const [driveEmail, setDriveEmail] = useState('chef.lucy.blue@gmail.com');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileCsvInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setIsSaved(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  // --- PROFILE CSV HANDLERS ---
  const handleDownloadProfileTemplate = () => {
    const headers = ['Company Name', 'Physical Address', 'Phone Number', 'Owner Name', 'Registration Number', 'Company Email'];
    const sampleRow = ['"Sunny Side Up Diner"', '"45 Morning Ave, Cape Town, 8001"', '"021 555 1234"', '"Sarah Smith"', '"2023/555555/07"', '"hello@sunnyside.co.za"'];
    const csvContent = [headers.join(','), sampleRow.join(',')].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'company_details_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportProfileCsv = () => {
    const headers = ['Company Name', 'Physical Address', 'Phone Number', 'Owner Name', 'Registration Number', 'Company Email'];
    // Handle quotes for CSV safety
    const safeData = [
      `"${formData.name.replace(/"/g, '""')}"`,
      `"${formData.address.replace(/"/g, '""')}"`,
      `"${formData.phone.replace(/"/g, '""')}"`,
      `"${formData.owner.replace(/"/g, '""')}"`,
      `"${formData.registrationNumber.replace(/"/g, '""')}"`,
      `"${formData.email.replace(/"/g, '""')}"`
    ];
    
    const csvContent = [headers.join(','), safeData.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${formData.name.replace(/[^a-z0-9]/gi, '_')}_profile.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleProfileCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split('\n').filter(l => l.trim().length > 0);
      if (lines.length < 2) {
        alert("Invalid CSV format. Please use the template.");
        return;
      }

      // Simple CSV parser for single line
      const parseLine = (line: string) => {
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
        return values.map(v => v.replace(/^"|"$/g, '').trim().replace(/""/g, '"'));
      };

      // Assuming row 1 is data (index 1)
      const dataRow = parseLine(lines[1]);
      
      if (dataRow.length >= 6) {
        setFormData({
          name: dataRow[0] || '',
          address: dataRow[1] || '',
          phone: dataRow[2] || '',
          owner: dataRow[3] || '',
          registrationNumber: dataRow[4] || '',
          email: dataRow[5] || ''
        });
        alert("Profile data imported! Review the form and click 'Save Changes' to apply.");
      } else {
         alert("CSV structure does not match expected format.");
      }
    };
    reader.readAsText(file);
    if (profileCsvInputRef.current) profileCsvInputRef.current.value = '';
  };

  // --- FULL BACKUP HANDLERS ---
  const handleDownloadBackup = () => {
    const json = storageService.exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    // Updated filename to match requested folder naming
    const date = new Date().toISOString().split('T')[0];
    link.download = `Mark_se_POS_Backup_${date}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRestoreClick = () => {
    if (confirm("WARNING: Restoring from a backup will OVERWRITE all current data. Are you sure you want to proceed?")) {
      fileInputRef.current?.click();
    }
  };

  const handleRestoreFromAutoSave = () => {
     const autoBackup = storageService.getAutoBackup();
     if (!autoBackup) {
        alert("No auto-save data found.");
        return;
     }

     if (confirm(`Found Auto-Save from: ${new Date(autoBackup.timestamp).toLocaleString()}\n\nRestoring this will overwrite your current session. Proceed?`)) {
        const success = storageService.importData(JSON.stringify(autoBackup));
        if (success) {
            if (onDataRestored) onDataRestored();
        } else {
            alert("Failed to restore auto-save.");
        }
     }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = storageService.importData(content);
        if (success) {
          if (onDataRestored) onDataRestored();
        } else {
          alert("Failed to restore data. Invalid file format.");
        }
      }
    };
    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const copyPathToClipboard = () => {
      navigator.clipboard.writeText('C:\\Users\\Chef Mark\\Desktop\\Mark se POS');
      alert('Folder path copied to clipboard!');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-slate-900 rounded-lg">
            <Building className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Company Configuration</h2>
            <p className="text-slate-500">Manage your restaurant's legal and contact details</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Profile CSV Actions Toolbar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-500 uppercase">Profile Details</span>
            <div className="flex gap-2">
                <input 
                    type="file" 
                    accept=".csv" 
                    ref={profileCsvInputRef}
                    onChange={handleProfileCsvImport}
                    className="hidden"
                />
                <button 
                    type="button"
                    onClick={handleDownloadProfileTemplate}
                    className="text-xs flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 rounded text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-colors"
                    title="Download Template"
                >
                    <FileSpreadsheet className="w-3 h-3" /> Template
                </button>
                <button 
                    type="button"
                    onClick={handleExportProfileCsv}
                    className="text-xs flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 rounded text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-colors"
                    title="Export Profile CSV"
                >
                    <Download className="w-3 h-3" /> Export
                </button>
                <button 
                    type="button"
                    onClick={() => profileCsvInputRef.current?.click()}
                    className="text-xs flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 rounded text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-colors"
                    title="Import Profile CSV"
                >
                    <Upload className="w-3 h-3" /> Import
                </button>
            </div>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Company Name */}
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Company Name</label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  placeholder="e.g. BistroBalance LLC"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Owner */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Owner Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  name="owner"
                  value={formData.owner}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  placeholder="e.g. Jane Doe"
                />
              </div>
            </div>

            {/* Registration Number */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Registration No.</label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  name="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  placeholder="e.g. 2023/123456/07"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  placeholder="e.g. +27 11 123 4567"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Company Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  placeholder="e.g. accounts@restaurant.com"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Physical Address</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
              <textarea
                name="address"
                rows={3}
                value={formData.address}
                onChange={(e: any) => handleChange(e)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none"
                placeholder="123 Street Name, Suburb, City, Postal Code"
              />
            </div>
          </div>

        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
           {isSaved && (
              <span className="text-emerald-600 flex items-center text-sm font-medium mr-4 animate-in fade-in duration-300">
                <CheckCircle className="w-4 h-4 mr-1.5" />
                Settings Saved Successfully
              </span>
           )}
          <button
            type="submit"
            className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-lg font-medium transition-all shadow-lg shadow-slate-200 hover:shadow-slate-400"
          >
            <Save className="w-5 h-5" />
            <span>Save Changes</span>
          </button>
        </div>
      </form>

      {/* CLOUD & AUTO BACKUP SECTION */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-sky-50 flex items-center gap-2">
            <Cloud className="w-5 h-5 text-sky-600" />
            <h3 className="text-lg font-bold text-slate-800">Cloud & Auto-Backup</h3>
        </div>
        <div className="p-6">
            <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Google Drive Backup Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="email"
                    value={driveEmail}
                    onChange={(e) => setDriveEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Backup files will include this email in the filename for easier identification in Drive.
                </p>
            </div>

            {/* DESIGNATED FOLDER PATH INSTRUCTIONS */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <FolderInput className="w-5 h-5 text-amber-700 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-bold text-amber-900 text-sm">Designated Backup Location</h4>
                  <p className="text-sm text-amber-800 mt-1">
                    Please ensure downloaded backups are saved to:
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <code className="bg-white px-3 py-1.5 rounded border border-amber-200 font-mono text-xs text-slate-700 block w-full">
                      C:\Users\Chef Mark\Desktop\Mark se POS
                    </code>
                    <button 
                        onClick={copyPathToClipboard}
                        className="p-1.5 bg-white border border-amber-200 rounded hover:bg-amber-100 text-amber-700"
                        title="Copy path"
                    >
                        <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-amber-700/80 mt-2 italic">
                    *Browser security restricts direct saving. Files will download to your default folder first.*
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 border-t border-slate-100 pt-6">
                 <button 
                    type="button"
                    onClick={handleDownloadBackup}
                    className="flex-1 flex items-center justify-center space-x-2 bg-sky-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-sky-700 transition-colors shadow-sm"
                >
                    <Download className="w-5 h-5" />
                    <span>Download Backup File</span>
                </button>
                <button 
                    type="button"
                    onClick={handleRestoreFromAutoSave}
                    className="flex-1 flex items-center justify-center space-x-2 bg-white border border-slate-300 text-slate-700 px-4 py-3 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                >
                    <RefreshCw className="w-5 h-5" />
                    <span>Restore Last Auto-Save</span>
                </button>
            </div>
        </div>
      </div>

      {/* MANUAL DATA MANAGEMENT SECTION */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <Database className="w-5 h-5 text-slate-600" />
            <h3 className="text-lg font-bold text-slate-800">Manual Data Management</h3>
        </div>
        <div className="p-6">
            <p className="text-sm text-slate-600 mb-4">
                Manually export your full database to a JSON file or restore from a previous export.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
                <button 
                    type="button"
                    onClick={handleDownloadBackup}
                    className="flex-1 flex items-center justify-center space-x-2 bg-indigo-50 border border-indigo-200 text-indigo-700 px-4 py-3 rounded-lg font-medium hover:bg-indigo-100 transition-colors"
                >
                    <Download className="w-5 h-5" />
                    <span>Export Full Database</span>
                </button>
                
                <div className="flex-1">
                    <input 
                        type="file" 
                        accept=".json"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    <button 
                        type="button"
                        onClick={handleRestoreClick}
                        className="w-full flex items-center justify-center space-x-2 bg-white border border-slate-300 text-slate-700 px-4 py-3 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                    >
                        <Upload className="w-5 h-5" />
                        <span>Restore from File</span>
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CompanySettings;