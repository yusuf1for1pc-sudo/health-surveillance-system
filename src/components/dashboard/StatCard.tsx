import { ReactNode, useEffect, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  /** Colours the figure so status is readable at a glance. */
  tone?: "default" | "good" | "warn" | "alert" | "info";
}

/** Counts up to numeric values (keeps any suffix/prefix such as % or commas). */
const CountUp = ({ value }: { value: string | number }) => {
  const reduce = useReducedMotion();
  const match = typeof value === "string" ? value.match(/^([^\d-]*)(-?[\d,]*\.?\d+)(.*)$/) : null;
  const target = typeof value === "number" ? value : match ? parseFloat(match[2].replace(/,/g, "")) : NaN;
  const [shown, setShown] = useState<number>(reduce || Number.isNaN(target) ? target : 0);

  useEffect(() => {
    if (reduce || Number.isNaN(target)) { setShown(target); return; }
    const c = animate(0, target, { duration: 1.4, delay: 0.2, ease: [0.2, 0.7, 0.2, 1], onUpdate: setShown });
    return () => c.stop();
  }, [target, reduce]);

  if (Number.isNaN(target)) return <>{value}</>;
  const decimals = typeof value === "string" && /\.\d+/.test(match?.[2] ?? "") ? (match![2].split(".")[1] || "").length : Number.isInteger(target) ? 0 : 1;
  // `shown` can still be NaN for a frame when the value switches from text ("...") to a number
  const safe = Number.isFinite(shown) ? shown : 0;
  const text = safe.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return <>{match ? match[1] : ""}{text}{match ? match[3] : ""}</>;
};

const toneText: Record<string, string> = {
  default: "text-foreground",
  good: "text-success",
  warn: "text-warning",
  alert: "text-danger",
  info: "text-info",
};
const toneBar: Record<string, string> = {
  default: "bg-role-accent",
  good: "bg-success",
  warn: "bg-warning",
  alert: "bg-danger",
  info: "bg-info",
};

const StatCard = ({ title, value, subtitle, icon, tone = "default" }: StatCardProps) => (
  <div className="group relative bg-card rounded-sm border px-4 py-3 sm:p-6 transition-all duration-300 hover:-translate-y-1 hover:border-foreground/40 hover:shadow-[var(--shadow-card-hover)] overflow-hidden">
    <span className={`absolute left-0 top-0 h-full w-0.5 ${toneBar[tone]} origin-top scale-y-50 transition-transform duration-500 group-hover:scale-y-100`} />
    <div className="flex items-start justify-between gap-3">
      <div className="grid min-w-0 grid-cols-[auto_1fr] items-center gap-x-4 sm:block">
        <p className="eyebrow col-start-2 row-start-1 truncate sm:col-auto">{title}</p>
        <p className={`col-start-1 ${subtitle ? "row-span-2" : ""} row-start-1 font-serif text-3xl sm:text-5xl font-medium sm:mt-2 ${toneText[tone]} leading-none tabular-nums`}>
          <CountUp value={value} />
        </p>
        {subtitle && <p className="col-start-2 row-start-2 truncate text-xs text-muted-foreground sm:mt-2 sm:text-sm">{subtitle}</p>}
      </div>
      {icon && <div className="text-muted-foreground shrink-0 transition-transform duration-500 group-hover:rotate-12 group-hover:text-foreground">{icon}</div>}
    </div>
  </div>
);

export default StatCard;
