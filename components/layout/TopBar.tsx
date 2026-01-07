"use client";

interface TopBarProps {
  title: string;
  children?: React.ReactNode;
}

export function TopBar({ title, children }: TopBarProps) {
  return (
    <div className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
      {children && <div className="flex items-center gap-4">{children}</div>}
    </div>
  );
}
