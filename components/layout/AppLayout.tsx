"use client";

import { SidebarProvider } from "./sidebar-provider";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return <SidebarProvider>{children}</SidebarProvider>;
}
