import { Badge } from "@/components/ui/badge";

type StatusType = "approved" | "pending" | "rejected" | "verified" | "active";

const statusStyles: Record<StatusType, string> = {
  approved: "bg-success/15 text-success border-success/30",
  verified: "bg-success/15 text-success border-success/30",
  active: "bg-success/15 text-success border-success/30",
  pending: "bg-warning/15 text-warning border-warning/30",
  rejected: "bg-danger/15 text-danger border-danger/30",
};

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
}

const StatusBadge = ({ status, label }: StatusBadgeProps) => {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-sm text-[11px] uppercase tracking-wider font-medium border ${statusStyles[status] || statusStyles.pending}`}>
      {label || status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

export default StatusBadge;
