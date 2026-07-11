/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { 
  Settings, 
  Database, 
  RefreshCw, 
  ShieldCheck, 
  Info, 
  HardDrive, 
  Check, 
  HelpCircle,
  Clock,
  Briefcase
} from 'lucide-react';
import { motion } from 'motion/react';
import { Client, Filing, Fee, Document, Notice } from '../types';

interface SettingsViewProps {
  clients: Client[];
  filings: Filing[];
  fees: Fee[];
  documents: Document[];
  notices: Notice[];
  userEmail: string;
  onResetToDefaults: () => Promise<void>;
}

export default function SettingsView({
  clients,
  filings,
  fees,
  documents,
  notices,
  userEmail,
  onResetToDefaults
}: SettingsViewProps) {
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleReset = async () => {
    if (confirm('Are you absolutely sure you want to reset the CRM database? This will delete all custom tax clients, returns, fee payments, and notices, restoring the original initial seed data.')) {
      setIsResetting(true);
      setTimeout(async () => {
        try {
          await onResetToDefaults();
          setResetSuccess(true);
          setTimeout(() => setResetSuccess(false), 3000);
        } catch (e) {
          console.error(e);
        } finally {
          setIsResetting(false);
        }
      }, 800);
    }
  };

  return (
    <div className="space-y-6 font-sans max-w-4xl pb-12">
      {/* Header Area */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">System Settings</h2>
        <p className="text-sm text-slate-500">Configure CRM parameters, inspect local storage quotas, and manage staff credentials.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left pane: account details */}
        <div className="md:col-span-2 space-y-6">
          {/* User Profile Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="h-12 w-12 rounded-full bg-[#10B981] text-white flex items-center justify-center font-bold text-lg shadow-inner">
                {userEmail.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Staff Account Profile</h3>
                <p className="text-xs text-slate-400 font-medium font-mono">{userEmail}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-600">
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100 flex items-center gap-2.5">
                <ShieldCheck className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Authorized Role</span>
                  <span className="text-slate-800 font-bold">Firm Principal Administrator</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100 flex items-center gap-2.5">
                <Clock className="h-4.5 w-4.5 text-indigo-500 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Active System Session</span>
                  <span className="text-slate-800 font-bold">Automatic Refresh Enabled</span>
                </div>
              </div>
            </div>
          </div>

          {/* Data layer isolation architecture */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <Database className="h-5 w-5 text-[#0F2C5C]" />
              <h3 className="font-bold text-slate-900 text-sm">Offline Database Transition (SQLite-Ready)</h3>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              This CRM implements an abstracted, decoupled data layer inside <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-rose-600">src/services/db.ts</code>. All database operations return Standard JS Promises, allowing seamless integration with an offline-first SQLite-backed desktop API or real cloud databases (Supabase / Firebase) without modifying frontend presentation components.
            </p>

            <div className="flex items-start gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100 text-slate-500">
              <Info className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
              <span>
                All client entries, return filing board columns, billing balance logs, and notice histories are persisted locally in browser LocalStorage, preventing accidental data loss on refreshing the viewport.
              </span>
            </div>
          </div>

          {/* DB Reset Action */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">System Maintenance</h3>
              <p className="text-xs text-slate-400 mt-0.5">Wipe custom state and restore standard initial taxpayers seed database.</p>
            </div>

            <button
              onClick={handleReset}
              disabled={isResetting}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                resetSuccess 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 active:bg-slate-100'
              }`}
            >
              {isResetting ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-slate-400" />
                  Wiping CRM Database...
                </>
              ) : resetSuccess ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  Seed Database Successfully Restored!
                </>
              ) : (
                <>
                  <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
                  Restore Initial Seed Data
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right pane: stat summaries */}
        <div className="space-y-6">
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b pb-2">CRM Quota Audit</h3>
            
            <div className="space-y-3.5 text-xs text-slate-700 font-semibold">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Taxpayers Registered:</span>
                <span className="font-mono">{clients.length} Clients</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Return Filings Programmed:</span>
                <span className="font-mono">{filings.length} Filings</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Fee Invoices Created:</span>
                <span className="font-mono">{fees.length} Invoices</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Archived Document Attachments:</span>
                <span className="font-mono">{documents.length} Files</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Active FBR Notice Records:</span>
                <span className="font-mono">{notices.length} Notices</span>
              </div>

              <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <span>Database Health:</span>
                <span className="text-emerald-600 font-bold">100% Operational</span>
              </div>
            </div>
          </div>

          <div className="bg-[#0F2C5C] text-slate-300 rounded-xl p-5 border border-slate-700/50 space-y-3 shadow-lg shadow-[#0F2C5C]/10">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest border-b border-white/10 pb-2">CRM Licensing</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
              Licensed exclusively for <strong>Bilal Tax Firm Co. Pakistan</strong>. Authorized for secure commercial use on FBR IRIS and Sales Tax declarations.
            </p>
            <div className="text-[10px] text-slate-400/80 font-mono flex items-center gap-1.5 pt-2">
              <HardDrive className="h-3.5 w-3.5 text-emerald-400" />
              <span>Ver: 3.4.1 (Stable Build)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
