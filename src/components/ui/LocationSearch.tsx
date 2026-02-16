import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Loader2 } from "lucide-react";

interface AddressData {
    display_name: string;
    address: {
        road?: string;
        suburb?: string;
        city?: string;
        town?: string;
        village?: string;
        state?: string;
        postcode?: string;
        country?: string;
        neighbourhood?: string;
        residential?: string;
    };
    lat: string;
    lon: string;
}

interface LocationSearchProps {
    city?: string;
    state?: string;
    onLocationSelect: (data: {
        address: string;
        city: string;
        state: string;
        pincode: string;
        country: string;
        latitude: number;
        longitude: number;
    }) => void;
}

const LocationSearch = ({ city, state, onLocationSelect }: LocationSearchProps) => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<AddressData[]>([]);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

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
            if (query.length < 3) return;

            setLoading(true);
            console.log("Searching for:", query, "Context:", city, state);

            // Build query string
            // If city/state provided, use structured search or append to q
            // Using 'q' is often more flexible for fuzzy matching streets
            const searchQuery = `${query}, ${city || ""}, ${state || ""}, India`
                .replace(/, ,/g, ",")
                .replace(/^, /, "")
                .replace(/, $/, "");

            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                        searchQuery
                    )}&countrycodes=in&addressdetails=1&limit=5`,
                    {
                        headers: {
                            "User-Agent": "TempestHealthcareApp/1.0",
                            "Accept-Language": "en-US,en;q=0.9"
                        }
                    }
                );

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                console.log("Search results:", data);
                setResults(data);
                setShowDropdown(true);
            } catch (error) {
                console.error("Error fetching location:", error);
            } finally {
                setLoading(false);
            }
        }, 1000); // Debounce

        return () => clearTimeout(timer);
    }, [query, city, state]);

    const handleSelect = (item: AddressData) => {
        setShowDropdown(false);

        // Construct address string
        const parts = [
            item.address.road,
            item.address.suburb,
            item.address.neighbourhood,
            item.address.residential,
            item.address.village || item.address.town // Keep city separate if possible
        ].filter(Boolean);

        // Join unique parts
        const addressLine = [...new Set(parts)].join(", ");

        setQuery(item.display_name.split(",")[0]);

        onLocationSelect({
            address: addressLine || item.display_name.split(",")[0],
            city: item.address.city || item.address.town || item.address.village || city || "",
            state: item.address.state || state || "",
            pincode: item.address.postcode || "",
            country: item.address.country || "India",
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
        });
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <Label>Search Area / Street</Label>
            <div className="relative mt-1.5">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder={city ? `Search within ${city}...` : "Type street/area name..."}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
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
                            <div className="font-medium truncate">{item.display_name.split(",")[0]}</div>
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

export default LocationSearch;
