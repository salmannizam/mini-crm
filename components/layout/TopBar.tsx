"use client";

import { Menu } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { useSidebar } from "./sidebar-provider";
import { Button } from "@/components/ui/button";

interface TopBarProps {
  title: string;
  children?: React.ReactNode;
}

export function TopBar({ title, children }: TopBarProps) {
  const { toggle } = useSidebar();

  return (
    <div className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggle}
          className="lg:hidden h-9 w-9 p-0"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100 truncate">
          {title}
        </h2>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        {children}
        <ThemeToggle />
      </div>
    </div>
  );
}
