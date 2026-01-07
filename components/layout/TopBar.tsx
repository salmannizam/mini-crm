"use client";

import { ThemeToggle } from "@/components/theme/theme-toggle";

interface TopBarProps {
  title: string;
  children?: React.ReactNode;
}

export function TopBar({ title, children }: TopBarProps) {
  return (
    <div className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
      <div className="flex items-center gap-4">
        {children}
        <ThemeToggle />
      </div>
    </div>
  );
}
