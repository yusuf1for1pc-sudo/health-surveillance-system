import { useState, useEffect, useMemo, useRef } from "react";
import { INDIAN_STATES } from "@/lib/india-states";
import { useData } from "@/contexts/DataContext";
import { MapPin, Building2, Map, X } from "lucide-react";

interface GeoFilterBarProps {
    state: string;
    city: string;
    ward: string;
    onStateChange: (v: string) => void;
    onCityChange: (v: string) => void;
    onWardChange: (v: string) => void;
    /** Rendered at the right end of the bar (e.g. the page's main action button). */
    actions?: React.ReactNode;
}

/** Searchable dropdown for city/ward with auto-suggestions from patient data */
function SearchableSelect({
    value,
    onChange,
    options,
    placeholder,
    icon: Icon,
}: {
    value: string;
    onChange: (v: string) => void;
    options: string[];
    placeholder: string;
    icon: React.ComponentType<{ className?: string }>;
}) {
    const [query, setQuery] = useState(value);
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => setQuery(value), [value]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const filtered = useMemo(() => {
        if (!query) return options.slice(0, 15);
        const q = query.toLowerCase();
        return options.filter((o) => o.toLowerCase().includes(q)).slice(0, 15);
    }, [query, options]);

    return (
        <div className="relative" ref={ref}>
            <div className="relative">
                <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                    type="text"
                    placeholder={placeholder}
                    className="w-full rounded-sm border border-border bg-muted py-1.5 pl-9 pr-8 text-sm transition-all focus:bg-background focus:outline-none focus:ring-2 focus:ring-ring/20"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                />
                {value && (
                    <button
                        onClick={() => { onChange(""); setQuery(""); }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>
            {open && filtered.length > 0 && (
                <div className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-sm border border-border bg-card shadow-lg">
                    {filtered.map((opt) => (
                        <button
                            key={opt}
                            type="button"
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors ${opt === value ? "bg-muted text-foreground font-medium" : "text-foreground"
                                }`}
                            onClick={() => {
                                onChange(opt);
                                setQuery(opt);
                                setOpen(false);
                            }}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

const GeoFilterBar = ({
    state,
    city,
    ward,
    onStateChange,
    onCityChange,
    onWardChange,
    actions,
}: GeoFilterBarProps) => {
    const { patients } = useData();

    // Derive available cities and wards from patient data
    const availableCities = useMemo(() => {
        const cities = new Set<string>();
        patients.forEach((p) => {
            if (p.city && (!state || p.state === state)) {
                cities.add(p.city);
            }
        });
        return Array.from(cities).sort();
    }, [patients, state]);

    const availableWards = useMemo(() => {
        const wards = new Set<string>();
        patients.forEach((p) => {
            if (p.ward_name && (!state || p.state === state) && (!city || p.city === city)) {
                wards.add(p.ward_name);
            }
        });
        return Array.from(wards).sort();
    }, [patients, state, city]);

    const hasFilters = state || city || ward;

    // One slim row: place filter, the three pickers, a clear link, and the page's action on the right
    return (
        <div className="geo-filter relative z-30 flex flex-wrap items-center gap-2 rounded-sm border bg-card px-3 py-2">
            <span className="flex items-center gap-1.5 pr-1 text-muted-foreground" title="Geographic filter">
                <MapPin className="h-4 w-4" />
                <span className="eyebrow hidden sm:inline">Area</span>
            </span>

            <div className="relative min-w-[150px] flex-1 sm:max-w-[200px]">
                <Map className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <select
                    aria-label="State"
                    className="w-full appearance-none rounded-sm border border-border bg-muted py-1.5 pl-9 pr-3 text-sm transition-all focus:bg-background focus:outline-none focus:ring-2 focus:ring-ring/20"
                    value={state}
                    onChange={(e) => {
                        onStateChange(e.target.value);
                        onCityChange("");
                        onWardChange("");
                    }}
                >
                    <option value="">All States</option>
                    {INDIAN_STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
            </div>

            <div className="min-w-[150px] flex-1 sm:max-w-[200px]">
                <SearchableSelect
                    value={city}
                    onChange={(v) => { onCityChange(v); onWardChange(""); }}
                    options={availableCities}
                    placeholder={state ? `Cities in ${state}` : "All Cities"}
                    icon={Building2}
                />
            </div>

            <div className="min-w-[150px] flex-1 sm:max-w-[200px]">
                <SearchableSelect
                    value={ward}
                    onChange={onWardChange}
                    options={availableWards}
                    placeholder={city ? `Wards in ${city}` : "All Wards"}
                    icon={MapPin}
                />
            </div>

            {hasFilters && (
                <button
                    onClick={() => { onStateChange(""); onCityChange(""); onWardChange(""); }}
                    className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                    Clear
                </button>
            )}

            {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
        </div>
    );
};

export default GeoFilterBar;
