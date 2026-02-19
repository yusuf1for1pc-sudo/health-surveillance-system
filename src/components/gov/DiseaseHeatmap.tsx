import { useMemo } from "react";

// ─── Types ───────────────────────────────────────────────
export interface HeatmapDisease {
    name: string;
    cases: Record<string, number>;
}

export interface HeatmapData {
    title: string;
    subtitle: string;
    cities: string[];
    diseases: HeatmapDisease[];
}

// ─── Color helpers ───────────────────────────────────────
function getCellColor(value: number, max: number): string {
    if (value === 0) return "transparent";
    const ratio = value / max;
    if (ratio >= 0.75) return "#ef4444";     // red
    if (ratio >= 0.5) return "#f59e0b";     // amber/orange
    if (ratio >= 0.3) return "#eab308";     // yellow
    if (ratio >= 0.15) return "#84cc16";     // lime
    return "#22c55e";                         // green
}

function getTextColor(value: number, max: number): string {
    if (value === 0) return "hsl(var(--muted-foreground))";
    const ratio = value / max;
    if (ratio >= 0.75) return "#fff";
    return "#1a2e05";
}

// ─── Component ───────────────────────────────────────────
interface DiseaseHeatmapProps {
    data: HeatmapData;
}

const DiseaseHeatmap = ({ data }: DiseaseHeatmapProps) => {
    const { cities, diseases, title, subtitle } = data;

    // Pre-compute totals & max value
    const { cityTotals, rowTotals, totalCases, globalMax } = useMemo(() => {
        const ct: Record<string, number> = {};
        cities.forEach(c => (ct[c] = 0));

        const rt: number[] = [];
        let total = 0;
        let gMax = 0;

        diseases.forEach(d => {
            let rowSum = 0;
            cities.forEach(c => {
                const v = d.cases[c] || 0;
                ct[c] += v;
                rowSum += v;
                if (v > gMax) gMax = v;
            });
            rt.push(rowSum);
            total += rowSum;
        });

        return { cityTotals: ct, rowTotals: rt, totalCases: total, globalMax: gMax };
    }, [cities, diseases]);

    // Sort diseases by total descending
    const sortedIndices = useMemo(() => {
        return diseases
            .map((_, i) => i)
            .sort((a, b) => rowTotals[b] - rowTotals[a]);
    }, [diseases, rowTotals]);

    return (
        <div className="bg-card rounded-xl p-4 sm:p-6 card-shadow">
            {/* Header */}
            <div className="mb-4">
                <h3 className="text-sm font-medium text-foreground">{title}</h3>
                <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
                <span>Low</span>
                <div className="flex h-3">
                    <div className="w-5 rounded-l" style={{ background: "#22c55e" }} />
                    <div className="w-5" style={{ background: "#84cc16" }} />
                    <div className="w-5" style={{ background: "#eab308" }} />
                    <div className="w-5" style={{ background: "#f59e0b" }} />
                    <div className="w-5 rounded-r" style={{ background: "#ef4444" }} />
                </div>
                <span>High</span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm" style={{ tableLayout: 'fixed', minWidth: 700 }}>
                    <colgroup>
                        <col style={{ width: '12%' }} />
                        {cities.map(c => (
                            <col key={c} style={{ width: `${76 / cities.length}%` }} />
                        ))}
                        <col style={{ width: '12%' }} />
                    </colgroup>
                    <thead>
                        <tr>
                            <th className="text-left py-3 pr-2 font-medium text-muted-foreground">
                                Disease
                            </th>
                            {cities.map(city => (
                                <th key={city} className="text-center py-3 px-2 font-medium text-muted-foreground">
                                    <div className="text-sm">{city}</div>
                                    <div className="font-normal text-[10px] opacity-60 mt-0.5">{cityTotals[city]}</div>
                                </th>
                            ))}
                            <th className="text-center py-3 px-2 font-semibold text-foreground">
                                Total
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedIndices.map(idx => {
                            const disease = diseases[idx];
                            const rowTotal = rowTotals[idx];
                            return (
                                <tr key={disease.name} className="border-t border-border/30">
                                    <td className="py-3 pr-2 font-medium text-foreground truncate text-sm">
                                        {disease.name}
                                    </td>
                                    {cities.map(city => {
                                        const val = disease.cases[city] || 0;
                                        const bg = getCellColor(val, globalMax);
                                        const color = getTextColor(val, globalMax);
                                        return (
                                            <td key={city} className="py-2.5 px-2">
                                                <div
                                                    className="flex items-center justify-center rounded-lg font-semibold tabular-nums"
                                                    style={{
                                                        background: bg,
                                                        color,
                                                        height: 36,
                                                        fontSize: 14,
                                                        width: '100%',
                                                    }}
                                                >
                                                    {val === 0 ? "–" : val}
                                                </div>
                                            </td>
                                        );
                                    })}
                                    <td className="py-3 px-2 text-center font-bold text-foreground text-sm">
                                        {rowTotal}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
                <span>{diseases.length} diseases across {cities.length} cities</span>
                <span>Total: <strong className="text-foreground">{totalCases}</strong> cases</span>
            </div>
        </div>
    );
};

export default DiseaseHeatmap;
