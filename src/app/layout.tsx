import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import { ToastProvider } from '@/context/ToastContext';
import { ThemeProvider } from '@/context/ThemeContext';

export const metadata: Metadata = {
  title: 'TaskFlow — Project & Task Tracker',
  description: 'Office-ready project and task tracker.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <ThemeProvider>
          <AppProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
