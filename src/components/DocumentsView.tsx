/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, ChangeEvent, FormEvent } from 'react';
import { 
  Search, 
  Filter, 
  Upload, 
  Folder, 
  Download, 
  Trash2, 
  Plus, 
  X, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Client, Document } from '../types';

interface DocumentsViewProps {
  documents: Document[];
  clients: Client[];
  onAddDocument: (doc: Omit<Document, 'id' | 'uploaded_at'>) => Promise<Document>;
  onDeleteDocument: (id: string) => Promise<boolean>;
  onSelectClient: (clientId: string) => void;
}

export default function DocumentsView({
  documents,
  clients,
  onAddDocument,
  onDeleteDocument,
  onSelectClient
}: DocumentsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form states
  const [formClientId, setFormClientId] = useState('');
  const [formFileName, setFormFileName] = useState('');
  const [formType, setFormType] = useState('CNIC');
  const [formError, setFormError] = useState('');

  // Enriched document list
  const enrichedDocs = documents.map(d => {
    const client = clients.find(c => c.id === d.client_id);
    return {
      ...d,
      clientName: client ? client.name : 'Unknown Taxpayer',
      clientType: client ? client.client_type : 'Individual'
    };
  });

  // Filter list
  const filteredDocs = enrichedDocs.filter(d => {
    const matchesSearch = d.file_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      d.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.file_type.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'All' || d.file_type === typeFilter;

    return matchesSearch && matchesType;
  });

  const handleCreateDocument = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formClientId) {
      setFormError('Please select a taxpayer.');
      return;
    }

    if (!formFileName.trim()) {
      setFormError('Please enter a file name.');
      return;
    }

    try {
      await onAddDocument({
        client_id: formClientId,
        file_name: formFileName.trim().endsWith('.pdf') ? formFileName.trim() : formFileName.trim() + '.pdf',
        file_type: formType,
        file_url: '#'
      });
      setIsFormOpen(false);
      setFormClientId('');
      setFormFileName('');
    } catch (err: any) {
      setFormError(err.message || 'Error occurred');
    }
  };

  const handleDropUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    // Default upload form open but pre-fill name
    setFormFileName(file.name);
    
    // Auto guess type
    const fn = file.name.toLowerCase();
    if (fn.includes('cnic')) setFormType('CNIC');
    else if (fn.includes('salary') || fn.includes('certificate')) setFormType('Salary Certificate');
    else if (fn.includes('statement') || fn.includes('bank')) setFormType('Bank Statement');
    else if (fn.includes('challan') || fn.includes('tax')) setFormType('Tax Challan');
    else if (fn.includes('rent') || fn.includes('agreement')) setFormType('Rent Agreement');
    
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Documents Repository</h2>
          <p className="text-sm text-slate-500">Secure digital archive of taxpayer CNICs, bank statements, income certificates, and receipts.</p>
        </div>

        <button
          onClick={() => {
            setFormFileName('');
            setFormClientId('');
            setIsFormOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-[#10B981] hover:bg-[#0da473] text-white text-xs font-bold rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer self-start sm:self-auto"
        >
          <Upload className="h-3.5 w-3.5" />
          Upload Document
        </button>
      </div>

      {/* Upload Drag Box */}
      <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-white hover:bg-slate-50/50 transition-all relative">
        <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
        <p className="text-sm font-semibold text-slate-700">Drag & drop tax documents here</p>
        <p className="text-xs text-slate-400 mt-1">Accepts PDFs, scans, tax receipts, and Excel statements up to 15MB.</p>
        <input
          type="file"
          onChange={handleDropUpload}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          title=""
        />
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute inset-y-0 left-3 h-4 w-4 text-slate-400 my-auto" />
          <input
            type="text"
            placeholder="Search documents by file name, taxpayer name, category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#0F2C5C]"
          />
        </div>

        {/* Category Type Filter */}
        <div className="w-full md:w-52">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full py-2 px-3 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:outline-hidden"
          >
            <option value="All">All Categories</option>
            <option value="CNIC">CNIC Copy</option>
            <option value="Salary Certificate">Salary Certificate</option>
            <option value="Bank Statement">Bank Statement</option>
            <option value="Rent Agreement">Rent Agreement</option>
            <option value="Tax Challan">FBR Tax Challan</option>
            <option value="Other">Other Miscellaneous</option>
          </select>
        </div>
      </div>

      {/* Documents List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredDocs.length === 0 ? (
          <div className="col-span-full bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 text-sm">
            No tax documents archived in this section.
          </div>
        ) : (
          filteredDocs.map((doc) => (
            <div 
              key={doc.id}
              onClick={() => onSelectClient(doc.client_id)}
              className="bg-white p-4 border border-slate-200 hover:border-slate-300 rounded-xl flex flex-col justify-between hover:shadow-md transition-all group relative cursor-pointer"
            >
              <div className="space-y-1 pr-6 min-w-0">
                <FileText className="h-5 w-5 text-slate-400 mb-2" />
                <p className="text-xs font-bold text-slate-800 truncate block group-hover:text-[#0F2C5C]" title={doc.file_name}>
                  {doc.file_name}
                </p>
                <p className="text-[11px] font-semibold text-slate-500 truncate">{doc.clientName}</p>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono pt-2">
                  <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-sm">{doc.file_type}</span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 mt-4 pt-3 text-[10px] text-slate-400 font-mono">
                <span>{new Date(doc.uploaded_at).toLocaleDateString('en-PK')}</span>
                
                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => alert('Downloading requires server sync. Mock file download completed successfully!')}
                    className="p-1 hover:bg-slate-100 rounded-md text-slate-500 transition-colors cursor-pointer"
                    title="Download Copy"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm(`Delete the archived file "${doc.file_name}"?`)) {
                        await onDeleteDocument(doc.id);
                      }
                    }}
                    className="p-1 hover:bg-rose-50 rounded-md text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Delete File"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* --- UPLOAD DOCUMENT MODAL --- */}
      <AnimatePresence>
        {isFormOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFormOpen(false)}
              className="fixed inset-0 bg-black z-40"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-x-0 top-20 mx-auto w-full max-w-md bg-white border border-slate-200 shadow-2xl rounded-2xl z-50 overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h4 className="font-bold text-slate-900 text-sm">Archive Taxpayer File</h4>
                <button onClick={() => setIsFormOpen(false)} className="p-1.5 hover:bg-slate-200 text-slate-400 rounded-md">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateDocument} className="p-5 space-y-4">
                {formError && (
                  <div className="rounded-lg bg-rose-50 p-3.5 border border-rose-100 text-xs font-semibold text-rose-700 flex items-start gap-2">
                    <AlertCircle className="h-4.5 w-4.5 text-rose-500 shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Taxpayer select */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Select Taxpayer Client <span className="text-rose-500">*</span></label>
                  <select
                    value={formClientId}
                    required
                    onChange={(e) => setFormClientId(e.target.value)}
                    className="mt-1 block w-full px-2.5 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-[#0F2C5C]"
                  >
                    <option value="">-- Choose Client --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.client_type})</option>
                    ))}
                  </select>
                </div>

                {/* File Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Document Type Category</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="mt-1 block w-full px-2.5 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700"
                  >
                    <option value="CNIC">CNIC Copy</option>
                    <option value="Salary Certificate">Salary Certificate</option>
                    <option value="Bank Statement">Bank Statement</option>
                    <option value="Rent Agreement">Rent Agreement</option>
                    <option value="Tax Challan">FBR Tax Challan Copy</option>
                    <option value="Other">Other Document</option>
                  </select>
                </div>

                {/* File Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">File Name / Label <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={formFileName}
                    onChange={(e) => setFormFileName(e.target.value)}
                    placeholder="e.g. Standard_Chartered_Salary_Statement_2025"
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-[#0F2C5C]"
                  />
                </div>

                <div className="pt-3 border-t flex justify-end gap-2">
                  <button type="button" onClick={() => setIsFormOpen(false)} className="px-3.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors">Cancel</button>
                  <button type="submit" className="px-4.5 py-2 bg-[#0F2C5C] text-white text-xs font-bold rounded-lg shadow-sm hover:shadow-md transition-all">Archive Document</button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
