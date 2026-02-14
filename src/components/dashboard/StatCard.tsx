import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
}

const StatCard = ({ title, value, subtitle, icon }: StatCardProps) => (
  <div className="bg-card rounded-xl p-4 sm:p-6 card-shadow hover:card-shadow-hover transition-shadow">
    <div className="flex items-start justify-between">
      <div className="min-w-0">
        <p className="text-xs sm:text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl sm:text-3xl font-semibold mt-1 text-foreground">{value}</p>
        {subtitle && <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">{subtitle}</p>}
      </div>
      {icon && (
        <div className="p-2 sm:p-2.5 rounded-lg bg-accent text-accent-foreground shrink-0">
          {icon}
        </div>
      )}
    </div>
  </div>
);

export default StatCard;
