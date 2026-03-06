import { useEffect, useRef, useMemo, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
// @ts-ignore
import "leaflet.heat";

// ─── Types ────────────────────────────────────────────────
interface DiseaseHeatmapProps {
    records: Array<{
        patient_id: string;
        icd_label?: string;
        diagnosis?: string;
        created_at: string;
    }>;
    patients: Array<{
        id: string;
        patient_id?: string;
        latitude?: number;
        longitude?: number;
        city?: string;
        state?: string;
    }>;
    selectedState?: string;
    selectedCity?: string;
    selectedWard?: string;
    clusters?: Array<{
        id: string;
        size: number;
        center: { lat: number; lng: number; };
        points: Array<{ lat: number; lng: number; patient_id: string; }>;
    }>;
    showClusters?: boolean;
}

// ─── Bounding Boxes ───────────────────────────────────────
const BOUNDS: Record<string, L.LatLngBoundsExpression> = {
    // Cities
    "Mumbai": [[18.89, 72.77], [19.27, 72.98]],
    "Kalyan": [[19.230, 73.120], [19.258, 73.150]],
    "Dombivli": [[19.208, 73.076], [19.228, 73.098]],
    "Navi Mumbai": [[19.000, 72.980], [19.200, 73.100]], // rough approx
    "Vashi": [[19.068, 72.990], [19.086, 73.008]],
    "Belapur": [[19.014, 73.030], [19.032, 73.048]],
    "Pune": [[18.490, 73.820], [18.560, 73.960]],

    // Mumbai Wards
    "Wadala": [[19.005, 72.835], [19.030, 72.860]],
    "Antop Hill": [[19.018, 72.836], [19.028, 72.848]],
    "Sewri": [[19.004, 72.840], [19.014, 72.852]],
    "Colaba": [[18.900, 72.808], [18.916, 72.822]],
    "Fort": [[18.928, 72.820], [18.938, 72.832]],

    // States (Approximate)
    "Maharashtra": [[15.60, 72.63], [22.03, 80.89]],
    "India": [[8.4, 68.7], [37.6, 97.2]] // Global fallback
};

// ─── Main Component (pure Leaflet — gradient heatmap) ─────
export default function DiseaseHeatmap({ records, patients, selectedState, selectedCity, selectedWard, clusters, showClusters }: DiseaseHeatmapProps) {
    const mapRef = useRef<L.Map | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const heatLayerRef = useRef<any>(null); // Reference to the heat layer
    const clusterLayerRef = useRef<L.LayerGroup | null>(null); // Reference to cluster layer
    const [isZooming, setIsZooming] = useState(false);

    // Extract exact points for true gradient heatmap
    const heatmapPoints = useMemo(() => {
        const points: [number, number, number][] = [];

        records.forEach((rec) => {
            const patient = patients.find(
                (p) => p.id === rec.patient_id || p.patient_id === rec.patient_id
            );
            if (!patient?.latitude || !patient?.longitude) return;

            // Add a small spatial jitter (~1km) so cases in the same ward don't stack exactly on top of each other, creating a realistic spread
            const jitterLat = patient.latitude + (Math.random() - 0.5) * 0.015;
            const jitterLng = patient.longitude + (Math.random() - 0.5) * 0.015;

            points.push([jitterLat, jitterLng, 0.6]);
        });

        return points;
    }, [records, patients]);

    // Initialize map
    useEffect(() => {
        if (!containerRef.current) return;

        if (!mapRef.current) {
            mapRef.current = L.map(containerRef.current, {
                center: [20.5937, 78.9629], // Center of India default
                zoom: 5,
                scrollWheelZoom: true,
                zoomControl: true,
            });

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>',
                maxZoom: 18,
            }).addTo(mapRef.current);
        }

        const map = mapRef.current;

        // Update Heatmap/Cluster Layer
        if (heatLayerRef.current) {
            map.removeLayer(heatLayerRef.current);
            heatLayerRef.current = null;
        }
        if (clusterLayerRef.current) {
            map.removeLayer(clusterLayerRef.current);
            clusterLayerRef.current = null;
        }

        if (showClusters && clusters && clusters.length > 0) {
            const group = L.layerGroup().addTo(map);
            clusters.forEach((c) => {
                L.circle([c.center.lat, c.center.lng], {
                    color: '#ef4444',
                    fillColor: '#ef4444',
                    fillOpacity: 0.4,
                    radius: c.size * 300 // Scale radius by cluster size
                })
                    .bindPopup(`<div class="text-xs p-1"><b>Cluster ${c.id}</b><br/>${c.size} localized cases</div>`)
                    .addTo(group);
            });
            clusterLayerRef.current = group;
        } else if (!showClusters && heatmapPoints.length > 0) {
            // @ts-ignore
            heatLayerRef.current = L.heatLayer(heatmapPoints, {
                radius: selectedWard ? 15 : 25, // Tighten radius for wards
                blur: 15,
                maxZoom: 14,
                gradient: {
                    0.4: "blue",
                    0.6: "lime",
                    0.8: "yellow",
                    1.0: "red"
                }
            }).addTo(map);
        }

        // Handle Auto-Zoom based on bounds
        setIsZooming(true);
        let targetBounds: L.LatLngBoundsExpression | null = null;

        if (selectedWard && BOUNDS[selectedWard]) {
            targetBounds = BOUNDS[selectedWard];
        } else if (selectedCity && BOUNDS[selectedCity]) {
            targetBounds = BOUNDS[selectedCity];
        } else if (selectedState && BOUNDS[selectedState]) {
            targetBounds = BOUNDS[selectedState];
        } else if (showClusters && clusters && clusters.length > 0) {
            targetBounds = clusters.map(c => [c.center.lat, c.center.lng] as [number, number]);
        } else if (!showClusters && heatmapPoints.length > 0) {
            // Fallback: zoom to points if no specific geo-filter matches
            targetBounds = heatmapPoints.map(p => [p[0], p[1]] as [number, number]);
        } else {
            targetBounds = BOUNDS["India"];
        }

        if (targetBounds) {
            try {
                const lBounds = L.latLngBounds(targetBounds as L.LatLngExpression[]);
                if (lBounds.isValid()) {
                    map.flyToBounds(lBounds, { padding: [30, 30], duration: 1.5 });
                }
            } catch (e) {
                console.error("Invalid bounds", e);
            }
        }

        // Clear zooming state after animation finishes
        const zoomTimeout = setTimeout(() => setIsZooming(false), 1500);

        // Fix tile rendering
        setTimeout(() => map.invalidateSize(), 200);

        return () => clearTimeout(zoomTimeout);

    }, [heatmapPoints, selectedState, selectedCity, selectedWard, showClusters, clusters]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    // NEVER unmount the map. Provide overlays instead.
    return (
        <div className="w-full h-full relative border rounded-lg overflow-hidden card-shadow">
            <div ref={containerRef} className="w-full h-full" style={{ minHeight: 480, zIndex: 0 }} />

            {/* Loading Overlay */}
            {isZooming && (
                <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-[1000] flex items-center justify-center transition-all duration-300">
                    <div className="bg-card shadow-lg px-4 py-2 rounded-full border flex items-center gap-2 text-sm font-medium text-foreground">
                        <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                        Zooming to selected area...
                    </div>
                </div>
            )}

            {/* Zero Cases Overlay */}
            {!isZooming && heatmapPoints.length === 0 && (
                <div className="absolute inset-0 z-[500] pointer-events-none flex items-center justify-center">
                    <div className="bg-card/90 shadow-lg px-6 py-3 rounded-lg border backdrop-blur-md text-sm font-medium text-foreground text-center">
                        <span className="text-xl block mb-1">📍</span>
                        No cases recorded in this area yet
                    </div>
                </div>
            )}

            {/* Legend Overlay */}
            {heatmapPoints.length > 0 && (
                <div
                    className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-md border rounded-lg p-2.5 text-xs shadow-lg"
                    style={{ zIndex: 400 }}
                >
                    <div className="font-semibold mb-1.5 text-foreground flex items-center justify-between">
                        Density Gradient
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground font-medium">Low</span>
                        <div className="h-2 w-32 rounded-full bg-gradient-to-r from-blue-500 via-lime-400 via-yellow-400 to-red-500 shadow-inner"></div>
                        <span className="text-[10px] text-muted-foreground font-medium">High</span>
                    </div>
                </div>
            )}
        </div>
    );
}
