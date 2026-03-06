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
                <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                    type="text"
                    placeholder={placeholder}
                    className="w-full border border-gray-200 rounded-lg pl-9 pr-8 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
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
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>
            {open && filtered.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-auto">
                    {filtered.map((opt) => (
                        <button
                            key={opt}
                            type="button"
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 transition-colors ${opt === value ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700"
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

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-4 w-4 text-blue-500" />
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Geographic Filter</span>
                {hasFilters && (
                    <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                        Filtered
                    </span>
                )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                {/* State */}
                <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1.5">State</label>
                    <div className="relative">
                        <Map className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        <select
                            className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all appearance-none"
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
                </div>

                {/* City */}
                <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1.5">City</label>
                    <SearchableSelect
                        value={city}
                        onChange={(v) => {
                            onCityChange(v);
                            onWardChange("");
                        }}
                        options={availableCities}
                        placeholder={state ? `Cities in ${state}` : "All Cities"}
                        icon={Building2}
                    />
                </div>

                {/* Ward */}
                <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1.5">Ward</label>
                    <SearchableSelect
                        value={ward}
                        onChange={onWardChange}
                        options={availableWards}
                        placeholder={city ? `Wards in ${city}` : "All Wards"}
                        icon={MapPin}
                    />
                </div>
            </div>

            {hasFilters && (
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-400">
                        {[state, city, ward].filter(Boolean).join(" → ") || "All India"}
                    </span>
                    <button
                        onClick={() => { onStateChange(""); onCityChange(""); onWardChange(""); }}
                        className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                    >
                        Clear All Filters
                    </button>
                </div>
            )}
        </div>
    );
};

export default GeoFilterBar;
