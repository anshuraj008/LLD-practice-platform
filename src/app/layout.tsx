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
        className="bg-[#090d16] text-slate-100 min-h-screen flex flex-col antialiased selection:bg-blue-600 selection:text-white"
      >
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="border-t border-slate-900 bg-slate-950/60 py-6 text-center text-xs text-slate-400">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>LLD Practice Platform • CipherSchools Selection Assignment</p>
            <p className="text-slate-400">
              Clean TypeScript Modular Monolith • Deterministic + Gemini AI Rubric
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
