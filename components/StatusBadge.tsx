import { Badge } from "@/components/ui/badge";
import { LeadStatus, STATUS_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: LeadStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const colorMap: Record<LeadStatus, "blue" | "yellow" | "purple" | "emerald" | "teal" | "cyan" | "amber" | "orange" | "green" | "red" | "slate" | "default"> = {
    [LeadStatus.NEW]: "blue",
    [LeadStatus.CONTACTED]: "yellow",
    [LeadStatus.FOLLOW_UP]: "purple",
    [LeadStatus.INTERESTED]: "emerald",
    [LeadStatus.NOT_INTERESTED]: "default",
    [LeadStatus.QUALIFIED]: "teal",
    [LeadStatus.PROPOSAL_SENT]: "cyan",
    [LeadStatus.NEGOTIATION]: "amber",
    [LeadStatus.NO_RESPONSE]: "orange",
    [LeadStatus.CONVERTED]: "green",
    [LeadStatus.LOST]: "red",
    [LeadStatus.INVALID_DUPLICATE]: "slate",
  };

  // Format status display name
  const formatStatusName = (status: string): string => {
    return status
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <Badge variant={colorMap[status] || "default"} className={className}>
      {formatStatusName(status)}
    </Badge>
  );
}
