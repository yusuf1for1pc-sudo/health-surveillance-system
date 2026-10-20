import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

const ThemeToggle = ({ className, onRail = false }: { className?: string; onRail?: boolean }) => {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      title={theme === "dark" ? "Light theme" : "Dark theme"}
      className={cn(
        onRail
          ? "inline-flex h-9 w-9 items-center justify-center rounded-sm border border-sidebar-foreground/40 text-sidebar-foreground transition-colors hover:bg-rail-active hover:text-rail-active-foreground"
          : "inline-flex h-9 w-9 items-center justify-center rounded-sm border border-foreground/30 text-foreground transition-colors hover:bg-foreground hover:text-background",
        className,
      )}
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
};

export default ThemeToggle;
