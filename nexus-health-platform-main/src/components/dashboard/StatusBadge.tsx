import { Badge } from "@/components/ui/badge";

type StatusType = "approved" | "pending" | "rejected" | "verified" | "active";

const statusStyles: Record<StatusType, string> = {
  approved: "bg-accent text-accent-foreground",
  verified: "bg-accent text-accent-foreground",
  active: "bg-accent text-accent-foreground",
  pending: "bg-muted text-muted-foreground",
  rejected: "bg-destructive/10 text-destructive",
};

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
}

const StatusBadge = ({ status, label }: StatusBadgeProps) => {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status] || statusStyles.pending}`}>
      {label || status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

export default StatusBadge;
