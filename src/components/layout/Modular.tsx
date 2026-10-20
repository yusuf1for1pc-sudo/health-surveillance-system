import { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Small building blocks for desktop-first, modular pages. A page is a `PanelGrid` of `Panel`
 * modules; each module owns its own title, actions and content, so layouts can be rearranged
 * by changing column spans instead of rewriting markup.
 */

interface PanelProps {
  title?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}

export const Panel = ({ title, description, icon, action, className, bodyClassName, children }: PanelProps) => (
  <section className={cn("rounded-sm border bg-card text-card-foreground", className)}>
    {(title || action) && (
      <header className="flex items-start justify-between gap-3 border-b px-4 py-3">
        <div className="min-w-0">
          {title && (
            <h3 className="flex items-center gap-2 font-serif text-lg font-medium leading-tight">
              {icon && <span className="text-muted-foreground">{icon}</span>}
              {title}
            </h3>
          )}
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {action}
      </header>
    )}
    <div className={cn("p-4", bodyClassName)}>{children}</div>
  </section>
);

/** Responsive grid for panels. Pass column templates through `className`, e.g. `lg:grid-cols-[340px_1fr]`. */
export const PanelGrid = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn("grid grid-cols-1 gap-5 [&>*]:min-w-0", className)}>{children}</div>
);

interface FieldProps {
  icon?: ReactNode;
  label: string;
  value: ReactNode;
  tone?: "default" | "alert";
  /** One slim row (label left, value right) instead of a boxed tile; used in side panels. */
  inline?: boolean;
  className?: string;
}

/** A labelled value tile used inside panels (contact details, health facts, settings). */
export const Field = ({ icon, label, value, tone = "default", inline = false, className }: FieldProps) =>
  inline ? (
    <div className={cn("flex items-center justify-between gap-3 border-b py-2 last:border-b-0", className)}>
      <div className="flex shrink-0 items-center gap-2 text-muted-foreground">
        {icon}
        <span className="eyebrow">{label}</span>
      </div>
      <div className={cn("min-w-0 truncate text-right text-sm font-medium", tone === "alert" ? "text-danger" : "text-foreground")}>{value}</div>
    </div>
  ) : (
  <div
    className={cn(
      "relative rounded-sm border px-3 py-2.5 transition-colors hover:border-foreground/40",
      tone === "alert" ? "border-danger/40 bg-danger/10" : "bg-muted/30",
      className,
    )}
  >
    <div className="flex items-center gap-2 text-muted-foreground">
      {icon}
      <span className="eyebrow">{label}</span>
    </div>
    <div className={cn("mt-1 break-words text-sm font-medium", tone === "alert" ? "text-danger" : "text-foreground")}>{value}</div>
  </div>
);
