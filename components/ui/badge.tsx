import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
        blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
        yellow: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
        purple: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300",
        green: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
        red: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
