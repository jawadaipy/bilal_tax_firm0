/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LayoutDashboard, Users, FileSpreadsheet, CreditCard, Folder, BellDot, Settings, LogOut } from 'lucide-react';
import { motion } from 'motion/react';

export type TabID = 'dashboard' | 'clients' | 'filings' | 'fees' | 'documents' | 'notices' | 'settings';

interface SidebarProps {
  activeTab: TabID;
  setActiveTab: (tab: TabID) => void;
  userEmail: string;
  onLogout: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, userEmail, onLogout }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard' as TabID, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clients' as TabID, label: 'Clients', icon: Users },
    { id: 'filings' as TabID, label: 'Tax Filings', icon: FileSpreadsheet },
    { id: 'fees' as TabID, label: 'Billing & Fees', icon: CreditCard },
    { id: 'documents' as TabID, label: 'Documents', icon: Folder },
    { id: 'notices' as TabID, label: 'FBR Notices', icon: BellDot },
    { id: 'settings' as TabID, label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0F2C5C] text-slate-300 flex flex-col justify-between shrink-0 border-r border-slate-200 select-none h-screen sticky top-0">
      {/* Brand Header */}
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-[#10B981] text-white font-bold text-xl shadow-md shrink-0">
            BTF
          </div>
          <div>
            <h1 className="text-white font-bold text-base leading-tight tracking-tight">Bilal Tax Firm</h1>
            <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">Staff Portal</span>
          </div>
        </div>
      </div>

      {/* Navigation Links with animated slider */}
      <nav className="flex-1 px-0 py-2 space-y-1 relative overflow-y-auto">
        <div className="px-6 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-widest">Main Menu</div>
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          const IconComponent = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full group relative flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors duration-150 text-left cursor-pointer ${
                isActive ? 'text-white font-bold' : 'hover:text-white text-slate-400'
              }`}
            >
              {/* Sliding background indicator */}
              {isActive && (
                <motion.div
                  layoutId="active-sidebar-pill"
                  className="absolute inset-0 bg-white/10 border-r-4 border-[#10B981]"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}

              <IconComponent
                className={`h-5 w-5 shrink-0 relative z-10 transition-transform group-hover:scale-105 duration-150 ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                }`}
              />
              <span className="relative z-10">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Staff footer */}
      <div className="p-6 border-t border-slate-700/50 bg-[#07132F]/10">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-400 font-medium truncate">Logged in as</p>
            <p className="text-xs font-semibold text-white truncate" title={userEmail}>
              {userEmail}
            </p>
          </div>
          <button
            onClick={onLogout}
            title="Log Out"
            className="p-1.5 rounded-md hover:bg-white/10 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer shrink-0"
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
