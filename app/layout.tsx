import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { ThemeProvider } from "@/components/theme/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mini CRM - Lead Management System",
  description: "Role-based lead management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              !(function() {
                try {
                  const storageKey = 'mini-crm-theme';
                  const theme = localStorage.getItem(storageKey) || 'system';
                  const root = document.documentElement;
                  
                  console.log('Theme script running, theme:', theme);
                  
                  // Always remove dark class first
                  root.classList.remove('dark');
                  
                  let shouldBeDark = false;
                  
                  if (theme === 'system') {
                    shouldBeDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    console.log('System theme detected:', shouldBeDark ? 'dark' : 'light');
                  } else if (theme === 'dark') {
                    shouldBeDark = true;
                    console.log('Dark theme selected');
                  } else {
                    console.log('Light theme selected');
                  }
                  
                  if (shouldBeDark) {
                    root.classList.add('dark');
                    console.log('Added dark class to html element');
                  } else {
                    root.classList.remove('dark');
                    console.log('Removed dark class from html element');
                  }
                  
                  console.log('HTML classes after theme application:', root.className);
                } catch (e) {
                  console.error('Theme script error:', e);
                }
              })();
            `,
          }}
        />
        <ThemeProvider defaultTheme="system" storageKey="mini-crm-theme">
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
