import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
}

const StatCard = ({ title, value, subtitle, icon }: StatCardProps) => (
  <div className="glass-card-green rounded-2xl p-6 sm:p-7 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl relative overflow-hidden group">
    <div className="absolute inset-0 bg-green-500/[0.05] group-hover:bg-green-500/[0.08] transition-colors" />
    <div className="flex items-start justify-between relative z-10">
      <div className="min-w-0">
        <p className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
        <p className="text-3xl sm:text-4xl font-bold mt-2 text-foreground tracking-tight">{value}</p>
        {subtitle && <p className="text-xs sm:text-sm text-muted-foreground/80 mt-1.5">{subtitle}</p>}
      </div>
      {icon && (
        <div className="p-3 sm:p-3.5 rounded-2xl bg-primary/10 text-primary shrink-0 shadow-inner">
          {icon}
        </div>
      )}
    </div>
  </div>
);

export default StatCard;
