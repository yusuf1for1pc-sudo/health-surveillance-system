import { useEffect, useRef, useMemo } from "react";
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
}

// ─── Main Component (pure Leaflet — gradient heatmap) ─────
export default function DiseaseHeatmap({ records, patients }: DiseaseHeatmapProps) {
    const mapRef = useRef<L.Map | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const heatLayerRef = useRef<any>(null); // Reference to the heat layer

    // Extract exact points for true gradient heatmap
    const heatmapPoints = useMemo(() => {
        const points: [number, number, number][] = [];

        records.forEach((rec) => {
            const patient = patients.find(
                (p) => p.id === rec.patient_id || p.patient_id === rec.patient_id
            );
            if (!patient?.latitude || !patient?.longitude) return;

            // Intensity: 0.5 base, higher for critical diseases if needed
            // For now, simpler intensity based on count overlapping naturally
            points.push([patient.latitude, patient.longitude, 0.6]);
        });

        return points;
    }, [records, patients]);

    // Initialize map
    useEffect(() => {
        if (!containerRef.current) return;

        if (!mapRef.current) {
            mapRef.current = L.map(containerRef.current, {
                center: [19.076, 72.8777], // Mumbai
                zoom: 11,
                scrollWheelZoom: true,
                zoomControl: true,
            });

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>',
                maxZoom: 18,
            }).addTo(mapRef.current);
        }

        const map = mapRef.current;

        // Update Heatmap Layer
        if (heatLayerRef.current) {
            map.removeLayer(heatLayerRef.current);
            heatLayerRef.current = null;
        }

        if (heatmapPoints.length > 0) {
            // @ts-ignore
            heatLayerRef.current = L.heatLayer(heatmapPoints, {
                radius: 25,
                blur: 15,
                maxZoom: 14,
                gradient: {
                    0.4: "blue",
                    0.6: "lime",
                    0.8: "yellow",
                    1.0: "red"
                }
            }).addTo(map);

            // Fit bounds to points if any
            const bounds = L.latLngBounds(heatmapPoints.map(p => [p[0], p[1]]));
            if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [30, 30] });
            }
        }

        // Fix tile rendering
        setTimeout(() => map.invalidateSize(), 200);

    }, [heatmapPoints]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    if (heatmapPoints.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                No geographic data available. Add patients with location data.
            </div>
        );
    }

    return (
        <div className="w-full h-full relative">
            <div ref={containerRef} className="w-full h-full rounded-lg" style={{ minHeight: 300, zIndex: 0 }} />

            {/* Legend Overlay */}
            <div
                className="absolute bottom-3 left-3 bg-card/90 backdrop-blur border rounded-lg p-2 text-xs shadow-sm"
                style={{ zIndex: 1000 }}
            >
                <div className="font-semibold mb-1">Density Gradient</div>
                <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">Low</span>
                    <div className="h-2 w-24 rounded-full bg-gradient-to-r from-blue-500 via-lime-400 via-yellow-400 to-red-500"></div>
                    <span className="text-[10px] text-muted-foreground">High</span>
                </div>
            </div>
        </div>
    );
}
