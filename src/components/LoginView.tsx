/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from 'react';
import { Shield, Key, Mail, AlertCircle, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginViewProps {
  onLogin: (email: string) => void;
}

export default function LoginView({ onLogin }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail !== 'mrjawadhere@gmail.com') {
      setError('Access Denied: Only the Principal Administrator (mrjawadhere@gmail.com) is authorized to access the Bilal Tax Firm Console.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLogin(normalizedEmail);
    }, 600);
  };

  const handleQuickLogin = (testEmail: string) => {
    setEmail(testEmail);
    setPassword('••••••••');
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLogin(testEmail);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="sm:mx-auto sm:w-full sm:max-w-md text-center"
      >
        {/* Rounded BTF Icon Wordmark */}
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-xl bg-[#0F2C5C] text-white font-bold text-2xl shadow-lg mb-4">
          BTF
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          Bilal Tax Firm
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Administrative Command Portal • Master Access
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="bg-white py-8 px-4 shadow-xl border border-slate-100 sm:rounded-2xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-lg bg-red-50 p-4 border border-red-100 text-sm text-red-700 flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Administrator Email Address
              </label>
              <div className="mt-1 relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mrjawadhere@gmail.com"
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0F2C5C] focus:border-[#0F2C5C]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Console Security Password
              </label>
              <div className="mt-1 relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0F2C5C] focus:border-[#0F2C5C]"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-[#0F2C5C] hover:bg-[#1A4584] focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-[#0F2C5C] cursor-pointer transition-all duration-150 shadow-md hover:shadow-lg disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Authenticating Admin...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    Launch Admin Console <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </button>
            </div>
          </form>

          {/* Quick access for local testing - Single Master Admin portal */}
          <div className="mt-6 border-t border-slate-100 pt-6">
            <div className="flex flex-col items-center">
              <button
                onClick={() => handleQuickLogin('mrjawadhere@gmail.com')}
                type="button"
                className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/50 rounded-xl text-xs font-semibold text-emerald-800 flex items-center justify-center gap-2 cursor-pointer transition-all duration-150 shadow-xs"
              >
                <Shield className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Sign in as Principal Admin (mrjawadhere@gmail.com)</span>
              </button>
              <p className="mt-2 text-[10px] text-slate-400 text-center text-balance">
                Only the designated system owner has administrative clearance for this console.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
