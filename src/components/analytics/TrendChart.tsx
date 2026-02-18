import { useState, useMemo } from 'react';
import {
    ComposedChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Scatter
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format, startOfWeek, startOfMonth, parseISO } from 'date-fns';
import { TrendingUp, AlertTriangle } from 'lucide-react';

interface MedicalRecord {
    id: string;
    created_at: string; // ISO string
    diagnosis?: string;
    icd_label?: string;
}

interface TrendChartProps {
    records: MedicalRecord[];
    title?: string;
}

const COLORS = [
    "#ef4444", // Red (Dengue/Critical)
    "#f97316", // Orange
    "#eab308", // Yellow
    "#22c55e", // Green
    "#06b6d4", // Cyan
    "#8b5cf6", // Purple
];

const MA_WINDOW = 3;
const OUTBREAK_THRESHOLD = 1.5; // 50% increase over baseline

export default function TrendChart({ records, title = "Disease Trends & Spikes" }: TrendChartProps) {
    const [period, setPeriod] = useState<'weekly' | 'monthly'>('monthly');

    const chartData = useMemo(() => {
        if (!records.length) return [];

        // 1. Group by period
        const grouped: Record<string, Record<string, number>> = {};
        const allDiseases = new Set<string>();

        // Sort records by date ascending
        const sortedRecords = [...records].sort((a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

        sortedRecords.forEach(rec => {
            const date = parseISO(rec.created_at);
            let key = '';

            if (period === 'weekly') {
                key = format(startOfWeek(date), 'yyyy-MM-dd');
            } else {
                key = format(startOfMonth(date), 'yyyy-MM');
            }

            const disease = rec.icd_label || rec.diagnosis || 'Unknown';
            allDiseases.add(disease);

            if (!grouped[key]) grouped[key] = { timestamp: date.getTime() };
            grouped[key][disease] = (grouped[key][disease] || 0) + 1;
        });

        // 2. Convert to array and sort
        let data = Object.entries(grouped).map(([dateKey, values]) => ({
            date: dateKey,
            ...values,
        })).sort((a: any, b: any) => a.timestamp - b.timestamp);

        // 3. Calculate Moving Average & Spikes for top diseases
        const topDiseases = Array.from(allDiseases)
            .sort((a, b) => {
                const totalA = data.reduce((sum, row) => sum + (row[a] || 0), 0);
                const totalB = data.reduce((sum, row) => sum + (row[b] || 0), 0);
                return totalB - totalA;
            })
            .slice(0, 5); // Focus on top 5

        // Enrich data with analytics
        return data.map((row, index, array) => {
            const enrichedRow: any = { ...row };

            topDiseases.forEach(disease => {
                const cases = row[disease] || 0;

                // Moving Average
                let sum = 0;
                let count = 0;
                for (let i = Math.max(0, index - MA_WINDOW + 1); i <= index; i++) {
                    sum += (array[i][disease] || 0);
                    count++;
                }
                const ma = count > 0 ? sum / count : 0;
                enrichedRow[`${disease}_MA`] = ma;

                // Spike Detection
                // Baseline is average of previous MA_WINDOW periods (excluding current)
                let baselineSum = 0;
                let baselineCount = 0;
                for (let i = Math.max(0, index - MA_WINDOW); i < index; i++) {
                    baselineSum += (array[i][disease] || 0);
                    baselineCount++;
                }
                const baseline = baselineCount > 0 ? baselineSum / baselineCount : 0;

                // Flag spike if cases > threshold * baseline AND cases > 2 (ignore noise)
                if (baseline > 0 && cases > baseline * OUTBREAK_THRESHOLD && cases > 2) {
                    enrichedRow[`${disease}_Spike`] = cases;
                }
            });

            // Format date for display
            if (period === 'weekly') {
                enrichedRow.displayDate = `W${format(parseISO(row.date), 'w')} ${format(parseISO(row.date), 'MMM')}`;
            } else {
                enrichedRow.displayDate = format(parseISO(row.date), 'MMM yyyy');
            }

            return enrichedRow;
        });

    }, [records, period]);

    const topDiseases = useMemo(() => {
        if (!chartData.length) return [];
        const keys = Object.keys(chartData[0]).filter(k =>
            !['date', 'timestamp', 'displayDate'].includes(k) && !k.endsWith('_MA') && !k.endsWith('_Spike')
        );
        return keys.slice(0, 5); // Top 5
    }, [chartData]);

    // Count total spikes for badge
    const totalSpikes = chartData.reduce((sum, row) => {
        return sum + topDiseases.reduce((dSum, disease) =>
            dSum + (row[`${disease}_Spike`] ? 1 : 0), 0
        );
    }, 0);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        {title}
                        {totalSpikes > 0 && (
                            <span className="flex items-center gap-1 text-sm bg-destructive/10 text-destructive px-2 py-1 rounded-full border border-destructive/20 animate-pulse">
                                <AlertTriangle className="h-4 w-4" />
                                {totalSpikes} Potential Outbreaks
                            </span>
                        )}
                    </CardTitle>
                    <CardDescription>
                        Moving averages ({MA_WINDOW}-period) and anomaly detection
                    </CardDescription>
                </div>
                <div className="flex bg-muted rounded-lg p-1">
                    <Button
                        variant={period === 'weekly' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setPeriod('weekly')}
                        className="h-8"
                    >
                        Weekly
                    </Button>
                    <Button
                        variant={period === 'monthly' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setPeriod('monthly')}
                        className="h-8"
                    >
                        Monthly
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis
                                dataKey="displayDate"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={10}
                                className="text-xs"
                            />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                className="text-xs"
                                label={{ value: 'Cases', angle: -90, position: 'insideLeft', style: { fill: '#6b7280' } }}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                labelStyle={{ color: '#111827', fontWeight: 600, marginBottom: '0.5rem' }}
                                formatter={(value: number, name: string) => {
                                    if (name.includes('_MA')) return [value.toFixed(1), `${name.replace('_MA', '')} (Avg)`];
                                    if (name.includes('_Spike')) return [value, `${name.replace('_Spike', '')} ⚠️ ALERT`];
                                    return [value, name];
                                }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />

                            {topDiseases.map((disease, idx) => (
                                <Line
                                    key={disease}
                                    type="monotone"
                                    dataKey={disease}
                                    stroke={COLORS[idx % COLORS.length]}
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: COLORS[idx % COLORS.length], strokeWidth: 0 }}
                                    activeDot={{ r: 6 }}
                                />
                            ))}

                            {/* Moving Average Lines (Dashed) */}
                            {topDiseases.map((disease, idx) => (
                                <Line
                                    key={`${disease}_MA`}
                                    type="monotone"
                                    dataKey={`${disease}_MA`}
                                    stroke={COLORS[idx % COLORS.length]}
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                    dot={false}
                                    legendType="none"
                                    className="opacity-50"
                                />
                            ))}

                            {/* Spikes (Warning Icons) */}
                            {topDiseases.map((disease, idx) => (
                                <Scatter
                                    key={`${disease}_Spike`}
                                    dataKey={`${disease}_Spike`}
                                    fill="red"
                                    shape={(props: any) => {
                                        const { cx, cy } = props;
                                        return (
                                            <svg x={cx - 10} y={cy - 10} width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="red" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                                <line x1="12" y1="9" x2="12" y2="13" />
                                                <line x1="12" y1="17" x2="12.01" y2="17" />
                                            </svg>
                                        );
                                    }}
                                    legendType="none"
                                />
                            ))}
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
