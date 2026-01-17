import { Badge } from "@/components/ui/badge";
import { LeadStatus, STATUS_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: LeadStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const colorMap: Record<LeadStatus, "blue" | "yellow" | "purple" | "orange" | "green" | "red"> = {
    [LeadStatus.NEW]: "blue",
    [LeadStatus.CONTACTED]: "yellow",
    [LeadStatus.FOLLOW_UP]: "purple",
    [LeadStatus.NO_RESPONSE]: "orange",
    [LeadStatus.CONVERTED]: "green",
    [LeadStatus.LOST]: "red",
  };

  return (
    <Badge variant={colorMap[status] || "default"} className={className}>
      {status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ")}
    </Badge>
  );
}
