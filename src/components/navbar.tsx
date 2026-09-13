'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Code2, BookOpen, History, Check } from 'lucide-react';
import { DEMO_USERS } from '@/lib/constants';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(DEMO_USERS[0].id);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    // Read cookie on client mount
    const match = document.cookie.match(/lld_demo_user_id=([^;]+)/);
    if (match && match[1]) {
      setCurrentUser(match[1]);
    }
  }, []);

  const handleSwitchUser = async (userId: string) => {
    try {
      await fetch('/api/auth/demo-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      setCurrentUser(userId);
      setIsDropdownOpen(false);
      router.refresh();
    } catch (err) {
      console.error('Failed to switch user:', err);
    }
  };

  const navLinks = [
    { href: '/', label: 'Problem Library', icon: BookOpen },
    { href: '/history', label: 'Learning History', icon: History },
  ];

  const activeUser = DEMO_USERS.find((user) => user.id === currentUser) ?? DEMO_USERS[0];
  const initials = activeUser.name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#080a11]/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-violet-500/25 group-hover:scale-105 transition-all">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 tracking-tight text-base group-hover:text-violet-300 transition-colors">
                LLD Arena
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/25">
                Studio
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Object-Oriented Design & Rubric AI</p>
          </div>
        </Link>

        {/* Right cluster: nav + demo profile */}
        <div className="flex items-center gap-6 lg:gap-8">
          <nav className="hidden sm:flex items-center gap-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-violet-600/15 text-violet-300 shadow-sm border border-violet-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden sm:block h-7 w-px bg-white/[0.08]" aria-hidden />

          <nav className="flex sm:hidden items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-label={link.label}
                  className={`p-2 rounded-xl transition-colors ${
                    isActive
                      ? 'bg-violet-600/15 text-violet-300 border border-violet-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </Link>
              );
            })}
          </nav>

          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-white/[0.1] hover:border-violet-500/40 text-xs text-slate-300 transition-all hover:bg-slate-800/80"
            >
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500/30 to-cyan-500/30 text-violet-300 flex items-center justify-center font-bold text-[10px] border border-violet-500/30">
                {initials}
              </div>
              <span className="font-medium text-slate-200 max-w-[9rem] truncate">{activeUser.name}</span>
              <span className="text-[10px] text-slate-400">▼</span>
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#0e121d] border border-white/[0.1] shadow-2xl p-1.5 z-50 backdrop-blur-xl">
                <div className="px-2.5 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Switch learner
                </div>
                {DEMO_USERS.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleSwitchUser(user.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs text-left transition-colors ${
                      currentUser === user.id
                        ? 'bg-violet-600/20 text-violet-300 font-semibold border border-violet-500/30'
                        : 'text-slate-300 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-[10px] text-slate-400">{user.email}</p>
                    </div>
                    {currentUser === user.id && <Check className="w-4 h-4 text-violet-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
