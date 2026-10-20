import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  /** Tighter spacing, used by fit-to-screen pages. */
  compact?: boolean;
}

const PageHeader = ({ title, description, action, compact = false }: PageHeaderProps) => {
  return (
    <div className={`flex shrink-0 flex-col gap-4 border-b sm:flex-row sm:items-end sm:justify-between ${compact ? "mb-4 pb-3" : "mb-8 pb-5"}`}>
      <div>
        <h1 className={`font-serif font-medium text-foreground leading-tight ${compact ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl"}`}>{title}</h1>
        {description && (
          <p className={`text-muted-foreground max-w-2xl ${compact ? "mt-1 text-sm" : "mt-2"}`}>{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

export default PageHeader;
