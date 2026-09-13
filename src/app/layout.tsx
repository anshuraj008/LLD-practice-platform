import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/navbar';

export const metadata: Metadata = {
  title: 'LLD Arena - Low-Level Design Practice Platform',
  description:
    'A focused practice platform for Low-Level Design interviews with structured design authoring, deterministic validation, explainable rubric-based AI evaluations, and iterative attempt comparisons.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="bg-[#07090e] text-slate-100 min-h-screen flex flex-col antialiased selection:bg-violet-600 selection:text-white relative overflow-x-hidden"
      >
        {/* Subtle Ambient Mesh Layer */}
        <div className="fixed inset-0 ambient-aura pointer-events-none z-0" aria-hidden="true" />
        <div className="fixed inset-0 blueprint-grid opacity-40 pointer-events-none z-0" aria-hidden="true" />

        <div className="relative z-10 flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <footer className="border-t border-white/[0.06] bg-[#090b12]/80 backdrop-blur-md py-6 text-center text-xs text-slate-400">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <p className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                <span className="font-semibold text-slate-300">LLD Arena</span> • Low-Level Design Practice Platform
              </p>
              <p className="text-slate-400 font-mono text-[11px]">
                TypeScript Monolith • Deterministic + Gemini AI Rubric
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
