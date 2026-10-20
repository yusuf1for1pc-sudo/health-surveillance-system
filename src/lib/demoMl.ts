import { mockPatients, mockRecords } from '@/lib/mockData';

/**
 * Offline stand-in for the FastAPI ML backend, used only while a built-in demo account is
 * signed in. Responses have the same shape as the real endpoints; values are generated
 * deterministically from the demo dataset so the government portal looks coherent.
 */

// Small deterministic PRNG so charts don't jump on every call
const seeded = (seed: string) => {
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
    return () => { h += 0x6d2b79f5; let t = Math.imul(h ^ (h >>> 15), 1 | h); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
};

type P = Record<string, string | number | undefined>;
const str = (v: unknown) => (v === undefined || v === null ? '' : String(v));
const iso = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (n: number) => new Date(Date.now() + n * 86400000);

// Daily case-count baseline, scaled by how narrow the filter is
const scaleFor = (p: P) => (str(p.ward) ? 0.12 : str(p.city) ? 0.3 : str(p.state) ? 0.6 : 1);
const diseaseFactor = (d: string) => ({ dengue: 1.4, malaria: 0.8, typhoid: 0.7, tuberculosis: 0.6, influenza: 1.1 } as Record<string, number>)[d.toLowerCase().split(' ')[0]] ?? 1;

const dailySeries = (p: P, days: number, ahead = false) => {
    const rnd = seeded(`${str(p.disease)}|${str(p.state)}|${str(p.city)}|${str(p.ward)}`);
    const scale = scaleFor(p) * diseaseFactor(str(p.disease));
    const out: { date: string; v: number }[] = [];
    for (let i = 0; i < days; i++) {
        const offset = ahead ? i + 1 : i - days + 1;
        const t = offset / 14;
        const v = (22 + 9 * Math.sin(t) + (ahead ? i * 0.35 : offset * 0.12)) * scale + rnd() * 5 * scale;
        out.push({ date: iso(addDays(offset)), v: Math.max(1, Math.round(v)) });
    }
    return out;
};

const forecast = (p: P) => {
    const days = Number(p.days) || 30;
    const s = dailySeries(p, days, true);
    return {
        dates: s.map(x => x.date),
        predictions: s.map(x => x.v),
        lower: s.map((x, i) => Math.max(0, Math.round(x.v * (1 - 0.1 - i * 0.004)))),
        upper: s.map((x, i) => Math.round(x.v * (1 + 0.1 + i * 0.006))),
    };
};

const anomalies = (p: P) => {
    const s = dailySeries(p, 60);
    const mean = s.reduce((a, b) => a + b.v, 0) / s.length;
    const sd = Math.sqrt(s.reduce((a, b) => a + (b.v - mean) ** 2, 0) / s.length) || 1;
    const rnd = seeded(`anom|${str(p.disease)}|${str(p.city)}`);
    const spikes = [11, 23, 38, 52].map(i => ({ date: s[i].date, count: Math.round(mean + sd * (2.2 + rnd() * 1.6)) }));
    return {
        anomalies: spikes.map(a => ({ ...a, severity: (a.count > mean + 3 * sd ? 'High' : 'Medium') as 'High' | 'Medium' })),
        stats: { total_days: s.length, anomaly_days: spikes.length, mean_daily_cases: +mean.toFixed(1), std_daily_cases: +sd.toFixed(1) },
    };
};

const rValue = (p: P) => {
    const rnd = seeded(`r|${str(p.disease)}|${str(p.state)}|${str(p.city)}`);
    const win = Number(p.window) || 7;
    const entries = Array.from({ length: 30 }, (_, i) => {
        const r = +(0.85 + 0.4 * Math.sin(i / 5) + i * 0.012 + rnd() * 0.08).toFixed(2);
        return { date: iso(addDays(i - 29)), r_value: r, status: (r > 1.05 ? 'Growing' : r < 0.95 ? 'Declining' : 'Stable') as 'Growing' | 'Stable' | 'Declining' };
    });
    const last = entries[entries.length - 1];
    const cur = Math.round(640 * scaleFor(p));
    return {
        r_values: entries, current_r: last.r_value, current_status: last.status, window_days: win,
        current_month_cases: cur, same_month_last_year_cases: Math.round(cur / 1.6), multiplier: '1.6', max_monsoon_cases: Math.round(cur * 1.9),
    };
};

const clusters = () => {
    const byCity = new Map<string, typeof mockPatients>();
    mockPatients.forEach(pt => { if (pt.latitude && pt.longitude) (byCity.get(pt.city) ?? byCity.set(pt.city, []).get(pt.city)!).push(pt); });
    const list = [...byCity.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 8).map(([city, pts], i) => {
        const sample = pts.slice(0, 40);
        const lat = sample.reduce((a, b) => a + (b.latitude || 0), 0) / sample.length;
        const lng = sample.reduce((a, b) => a + (b.longitude || 0), 0) / sample.length;
        return {
            id: `cluster-${i + 1}-${city}`,
            points: sample.map(pt => ({ patient_id: pt.patient_id, lat: pt.latitude as number, lng: pt.longitude as number })),
            size: pts.length,
            center: { lat, lng },
            riskLevel: (pts.length > 60 ? 'High' : pts.length > 25 ? 'Medium' : 'Low') as 'Low' | 'Medium' | 'High',
        };
    });
    return { clusters: list };
};

const DISEASES = ['Dengue', 'Malaria', 'Typhoid', 'Influenza', 'Tuberculosis'];
const rBreakdown = (p: P) => ({
    breakdown: DISEASES.map(d => {
        const r = rValue({ disease: d, city: p.city });
        return {
            disease: d, r_value: r.current_r, status: r.current_status, case_count: Math.round(180 * diseaseFactor(d) * (str(p.city) ? 0.4 : 1)),
            source: 'demo',
            gemini_recommendation: r.current_status === 'Growing'
                ? `${d}: transmission is rising. Intensify surveillance and prepare field teams in the affected wards.`
                : `${d}: transmission is stable or falling. Maintain routine surveillance.`,
        };
    }),
    city: str(p.city) || 'All cities', window_days: Number(p.window) || 7,
});

const SIR_PARAMS: Record<string, { beta: number; gamma: number; desc: string }> = {
    dengue: { beta: 0.32, gamma: 0.14, desc: 'Vector-borne; transmission peaks in the monsoon.' },
    malaria: { beta: 0.25, gamma: 0.1, desc: 'Vector-borne; slower recovery.' },
    typhoid: { beta: 0.2, gamma: 0.1, desc: 'Waterborne; linked to sanitation.' },
    influenza: { beta: 0.45, gamma: 0.3, desc: 'Airborne; fast, short epidemics.' },
};
const sir = (p: P) => {
    const key = str(p.disease).toLowerCase().split(' ')[0] || 'dengue';
    const base = SIR_PARAMS[key] ?? SIR_PARAMS.dengue;
    const days = Number(p.days) || 90;
    const N = str(p.ward) ? 50000 : 500000;
    const intDay = p.intervention_day === undefined ? null : Number(p.intervention_day);
    const eff = Number(p.intervention_effectiveness) || 0;
    let S = N - 50, I = 50, R = 0;
    const d: number[] = [], s: number[] = [], i_: number[] = [], r: number[] = [];
    let peakDay = 0, peak = 0;
    for (let t = 0; t <= days; t++) {
        d.push(t); s.push(Math.round(S)); i_.push(Math.round(I)); r.push(Math.round(R));
        if (I > peak) { peak = I; peakDay = t; }
        const beta = intDay !== null && t >= intDay ? base.beta * (1 - eff) : base.beta;
        const newI = (beta * S * I) / N, newR = base.gamma * I;
        S -= newI; I += newI - newR; R += newR;
    }
    return {
        days: d, susceptible: s, infected: i_, recovered: r,
        R0: +(base.beta / base.gamma).toFixed(2), R0_post_intervention: +((base.beta * (1 - eff)) / base.gamma).toFixed(2),
        peak_day: peakDay, peak_infections: Math.round(peak), total_infected_end: Math.round(N - S),
        parameters: { beta: base.beta, gamma: base.gamma, N, disease: str(p.disease) || 'Dengue', description: base.desc },
    };
};

const situationReport = () => {
    const total = mockRecords.length;
    return {
        source: 'structured' as const,
        report: [
            'NATIONAL HEALTH SITUATION REPORT (DEMO DATA)',
            '',
            `Surveillance is tracking ${total.toLocaleString()} records across ${new Set(mockPatients.map(p => p.state)).size} states.`,
            '',
            '1. Dengue: cases are rising in Maharashtra (Mumbai, Pune, Thane); the effective reproduction number is above 1.',
            '2. Malaria: stable, with isolated clusters in the north-east.',
            '3. Typhoid and gastroenteritis: moderate increase linked to monsoon water contamination.',
            '',
            'Recommended actions: intensify vector control in hotspot wards, pre-position hospital surge capacity, and issue public advisories on water safety.',
        ].join('\n'),
    };
};

const recommend = (body: { disease: string; current_cases: number; city?: string | null }) => {
    const base = sir({ disease: body.disease, days: 90 });
    const withInt = sir({ disease: body.disease, days: 90, intervention_day: 14, intervention_effectiveness: 0.45 });
    return {
        strategy: 'Targeted vector control and early-case isolation',
        effectiveness_pct: 45,
        cost_level: 'Medium',
        disease: body.disease,
        city: body.city || 'All cities',
        sir_baseline: { peak_day: base.peak_day, peak_infections: base.peak_infections, total_infected: base.total_infected_end, R0: base.R0 },
        sir_with_intervention: { peak_day: withInt.peak_day, peak_infections: withInt.peak_infections, total_infected: withInt.total_infected_end, R0_post: withInt.R0_post_intervention },
        impact: {
            cases_averted: Math.max(0, base.total_infected_end - withInt.total_infected_end),
            peak_reduction: Math.max(0, base.peak_infections - withInt.peak_infections),
            peak_delay_days: Math.max(0, withInt.peak_day - base.peak_day),
        },
        gemini_recommendation: `Deploy fogging and larval source reduction in the ${body.city || 'highest-burden'} wards within 7 days, and open fever clinics with rapid testing. (Demo recommendation.)`,
        source: 'demo',
    };
};

export const demoMlGet = async (endpoint: string, params: P = {}): Promise<unknown> => {
    await new Promise(r => setTimeout(r, 250)); // feel like a real request
    switch (endpoint.replace(/^\//, '')) {
        case 'forecast': return forecast(params);
        case 'forecast-nowcast': return { ...forecast(params), nowcast_adjusted: true, reporting_delay_days: 2 };
        case 'anomalies': return anomalies(params);
        case 'r-value': return rValue(params);
        case 'r-value-breakdown': return rBreakdown(params);
        case 'clusters': return clusters();
        case 'situation-report': return situationReport();
        case 'sir-simulate': return sir(params);
        default: throw new Error(`Demo ML: unknown endpoint ${endpoint}`);
    }
};

export const demoMlRecommend = async (body: { disease: string; current_cases: number; city?: string | null }) => {
    await new Promise(r => setTimeout(r, 400));
    return recommend(body);
};
