import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Loader2, Building2 } from "lucide-react";

interface CityData {
    display_name: string;
    address: {
        city?: string;
        town?: string;
        village?: string;
        state?: string;
        state_district?: string;
        postcode?: string;
    };
}

interface CitySearchProps {
    state?: string;
    initialValue?: string;
    onCitySelect: (data: { city: string; state?: string; pincode?: string }) => void;
}

const CitySearch = ({ state, initialValue, onCitySelect }: CitySearchProps) => {
    const [query, setQuery] = useState(initialValue || "");
    const [results, setResults] = useState<CityData[]>([]);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setQuery(initialValue || "");
    }, [initialValue]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.length < 2) return; // Search starts at 2 chars for cities

            setLoading(true);

            // Query structured for cities
            let q = query;
            if (state) {
                q = `${query}, ${state}`;
            }

            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                        q
                    )}&countrycodes=in&addressdetails=1&limit=10`,
                    {
                        headers: {
                            "User-Agent": "TempestHealthcareApp/1.0",
                            "Accept-Language": "en-US,en;q=0.9"
                        }
                    }
                );

                const data = await response.json();

                // Filter to ensure we get relevant results, but don't be too strict about 'city' key
                // as sometimes it's under town/village or even strict address
                const filtered = data.filter((item: CityData) =>
                    item.address && (item.address.city || item.address.town || item.address.village || item.address.state_district)
                );

                setResults(filtered);
                setShowDropdown(true);
            } catch (error) {
                console.error("Error fetching cities:", error);
            } finally {
                setLoading(false);
            }
        }, 600);

        return () => clearTimeout(timer);
    }, [query, state]);

    const handleSelect = (item: CityData) => {
        const cityName = item.address.city || item.address.town || item.address.village || "";
        const stateName = item.address.state;
        const pincode = item.address.postcode;

        setQuery(cityName);
        setShowDropdown(false);

        onCitySelect({
            city: cityName,
            state: stateName,
            pincode: pincode
        });
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <Label>City</Label>
            <div className="relative mt-1.5">
                <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder={state ? `Search city in ${state}` : "Search city..."}
                    value={query}
                    onChange={(e) => {
                        const val = e.target.value;
                        setQuery(val);
                        // For free text, we only send the city name, no state/pin context
                        onCitySelect({ city: val });
                    }}
                    className="pl-9"
                />
                {loading && (
                    <div className="absolute right-3 top-3">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                )}
            </div>

            {showDropdown && results.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-popover text-popover-foreground border rounded-md shadow-lg max-h-60 overflow-auto">
                    {results.map((item, index) => (
                        <button
                            key={index}
                            type="button"
                            className="w-full text-left px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors border-b last:border-0"
                            onClick={() => handleSelect(item)}
                        >
                            <div className="font-medium">
                                {item.address.city || item.address.town || item.address.village}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                                {item.display_name}
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CitySearch;
