import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { Panel, PanelGrid } from "@/components/layout/Modular";
import { Button } from "@/components/ui/button";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Legend, Area, AreaChart,
} from "recharts";
import { Loader2, AlertTriangle, CheckCircle2, Bot, Send, Shield } from "lucide-react";
import {
    getForecast, getRValue, getRecommendedIntervention, getSIRSimulation,
    type ForecastResponse, type InterventionRecommendation, type SIRSimulationResponse, type RValueResponse,
} from "@/lib/mlApi";
import GeoFilterBar from "@/components/gov/GeoFilterBar";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { logSurveillanceAccess } from "@/lib/accessLogger";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

const DISEASES = ["Dengue", "Malaria", "Leptospirosis", "Typhoid", "Tuberculosis", "Gastroenteritis", "Chikungunya"];

const GovSimulator = () => {
    const [disease, setDisease] = useState("Dengue");
    const [state, setState] = useState("");
    const [city, setCity] = useState("");
    const [ward, setWard] = useState("");

    // Step 1: Configuration
    const [days, setDays] = useState(30);
    const [interventionDay, setInterventionDay] = useState(7);

    // Live R-value
    const [liveR, setLiveR] = useState<RValueResponse | null>(null);
    const [loadingR, setLoadingR] = useState(false);

    // Step 2 & 3: Results & Deployment
    const [loading, setLoading] = useState(false);
    const [recommendation, setRecommendation] = useState<InterventionRecommendation | null>(null);
    const [sirBaseline, setSirBaseline] = useState<SIRSimulationResponse | null>(null);
    const [sirIntervention, setSirIntervention] = useState<SIRSimulationResponse | null>(null);
    const [prophetBaseline, setProphetBaseline] = useState<ForecastResponse | null>(null);
    const [isDeployed, setIsDeployed] = useState(false);
    const [deploying, setDeploying] = useState(false);
    const [step, setStep] = useState(1); // 1=config, 2=analysis, 3=deploy

    // ── Live R-value on disease/city change ──
    useEffect(() => {
        const fetchR = async () => {
            if (!disease) return;
            setLoadingR(true);
            try {
                const r = await getRValue(disease, 7, state || undefined, city || undefined, ward || undefined);
                setLiveR(r);
            } catch {
                setLiveR(null);
            } finally {
                setLoadingR(false);
            }
        };
        fetchR();
    }, [disease, state, city, ward]);

    // Clear ML results if disease or horizon changes to force re-analysis
    useEffect(() => {
        setRecommendation(null);
        setProphetBaseline(null);
        setSirBaseline(null);
        setSirIntervention(null);
        setIsDeployed(false);
        setStep(1);
    }, [disease, days]);

    // ── Step 2: Full ML Analysis ──
    const analyzeIntervention = async () => {
        setLoading(true);
        setIsDeployed(false);
        setStep(2);
        try {
            // 1. Prophet baseline forecast
            const base = await getForecast(disease || undefined, days, state || undefined, city || undefined, ward || undefined);
            setProphetBaseline(base);

            const currentCases = base.predictions.reduce((s, v) => s + v, 0);

            // 2. ML recommendation (rule-based + SIR + Gemini)
            const rec = await getRecommendedIntervention(
                disease,
                Math.max(1, Math.round(currentCases / days)),
                city || undefined,
                liveR?.current_r ?? undefined,
            );
            setRecommendation(rec);

            // 3. SIR baseline simulation
            const sirBase = await getSIRSimulation(disease, ward, days);
            setSirBaseline(sirBase);

            // 4. SIR with intervention
            const sirInt = await getSIRSimulation(
                disease,
                ward,
                days,
                interventionDay,
                rec.effectiveness_pct / 100,
            );
            setSirIntervention(sirInt);

            // Removed manual setProphetScenario here, computing on the fly
            logSurveillanceAccess("intervention_analyzed", { disease, city, ward, strategy: rec.strategy });
        } catch (err: any) {
            console.error(err);
            toast.error("Analysis failed", { description: err.message || "Check ML backend connection" });
        } finally {
            setLoading(false);
        }
    };

    // ── Step 3: Deploy → insert into intervention_tracker ──
    const handleDeploy = async () => {
        if (!recommendation) return;
        setDeploying(true);
        try {
            const { error } = await supabase.from("intervention_tracker").insert({
                disease_name: disease,
                ward_name: ward || null,
                city: city || "Mumbai",
                intervention_type: recommendation.strategy,
                initial_r_value: liveR?.current_r ?? null,
                expected_reduction_pct: recommendation.effectiveness_pct,
                status: "active",
            });
            if (error) throw error;

            setIsDeployed(true);
            setStep(3);
            logSurveillanceAccess("intervention_deployed", { disease, city, ward, strategy: recommendation.strategy });
            toast.success(`Deployed: ${recommendation.strategy}`, {
                description: "Field teams notified. Tracking initiated in intervention_tracker.",
                duration: 5000,
            });
        } catch (err: any) {
            toast.error("Deploy failed", { description: err.message });
        } finally {
            setDeploying(false);
        }
    };

    // ── Dynamic Prophet Scenario ──
    const prophetScenario = useMemo(() => {
        if (!prophetBaseline || !recommendation) return null;
        const reductionPct = recommendation.effectiveness_pct;
        // The array has 7 days of history prepended.
        // So day 1 of the simulation is index 7.
        const simPredictions = prophetBaseline.predictions.map((p, i) => {
            const historyPadding = 7;
            const absoluteInterventionIndex = historyPadding + (interventionDay - 1);
            if (i >= absoluteInterventionIndex) {
                const reduction = 1 - (reductionPct / 100) * Math.min(1, (i - absoluteInterventionIndex + 1) / 7);
                return Math.max(0, Math.round(p * reduction));
            }
            return p;
        });
        return {
            dates: prophetBaseline.dates,
            predictions: simPredictions,
            lower: simPredictions.map(p => Math.max(0, Math.round(p * 0.85))),
            upper: simPredictions.map(p => Math.round(p * 1.15)),
        };
    }, [prophetBaseline, recommendation, interventionDay]);

    // ── Chart data ──
    const prophetChartData = prophetBaseline
        ? prophetBaseline.dates.map((d, i) => ({
            date: d.slice(5),
            "No Intervention": prophetBaseline.predictions[i],
            "With Intervention": prophetScenario?.predictions[i] ?? prophetBaseline.predictions[i],
        }))
        : [];

    const sirChartData = sirBaseline
        ? sirBaseline.days.map((d, i) => {
            const date = new Date();
            date.setDate(date.getDate() + d);
            const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            return {
                day: dateStr,
                "Baseline Infected": Math.round(sirBaseline.infected[i]),
                "With Intervention": sirIntervention ? Math.round(sirIntervention.infected[i]) : Math.round(sirBaseline.infected[i]),
            };
        })
        : [];

    // ── Computed stats ──
    // Slice off the 7 days of history so we only sum the actual simulation horizon
    const futureBaseline = prophetBaseline ? prophetBaseline.predictions.slice(7) : [];
    const futureScenario = prophetScenario ? prophetScenario.predictions.slice(7) : [];

    const totalBaseline = futureBaseline.reduce((s, v) => s + v, 0);
    const totalScenario = futureScenario.reduce((s, v) => s + v, 0);
    const casesSaved = totalBaseline - totalScenario;

    const rTone = (status: string) =>
        status === "Growing" ? "border-danger/40 text-danger" : status === "Declining" ? "border-success/40 text-success" : "border-warning/40 text-warning";

    const tooltipStyle = { background: "hsl(var(--card))", color: "hsl(var(--card-foreground))", border: "1px solid hsl(var(--border))", borderRadius: 2, fontSize: 11 };

    const fieldClass = "mt-1.5 w-full rounded-sm border border-border bg-card px-3 py-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-ring/20";

    return (
        <DashboardLayout role="gov" fit>
            <PageHeader compact title="Outbreak Simulator" description="Model ML-recommended 'what if' scenarios and deploy field strategies." />

            {/* Area filter with the live Rt as its right-hand badge */}
            <div className="mb-3 shrink-0">
                <GeoFilterBar
                    state={state}
                    city={city}
                    ward={ward}
                    onStateChange={setState}
                    onCityChange={setCity}
                    onWardChange={setWard}
                    actions={
                        <div className="flex items-center gap-2 text-sm">
                            <span className="eyebrow">Live Rt</span>
                            {loadingR ? (
                                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Fetching</span>
                            ) : liveR && typeof liveR.current_r === "number" ? (
                                <span className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 font-medium ${rTone(liveR.current_status || "Stable")}`}>
                                    {liveR.current_r.toFixed(2)}
                                    <span className="text-[10px] uppercase tracking-wider opacity-80">{liveR.current_status || "Stable"}</span>
                                </span>
                            ) : (
                                <span className="text-xs text-muted-foreground">Unavailable</span>
                            )}
                            {liveR && typeof liveR.current_r === "number" && liveR.current_r > 1.0 && (
                                <span className="hidden text-[11px] text-danger xl:inline">Above threshold: intervention recommended</span>
                            )}
                        </div>
                    }
                />
            </div>

            <PanelGrid className="lg:min-h-0 lg:flex-1 lg:grid-cols-[340px_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)]">
                {/* Left: scenario setup, then the recommendation once it exists */}
                <div className="space-y-4 lg:min-h-0 lg:overflow-y-auto lg:pr-1">
                    <Panel title="1 · Scenario" bodyClassName="space-y-3 p-4">
                        <div>
                            <label className="eyebrow" htmlFor="sim-disease">Disease</label>
                            <select id="sim-disease" className={fieldClass} value={disease} onChange={(e) => setDisease(e.target.value)}>
                                {DISEASES.map((d) => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="eyebrow" htmlFor="sim-days">Horizon (days)</label>
                                <input id="sim-days" type="number" min={7} max={90} className={fieldClass} value={days} onChange={(e) => setDays(Number(e.target.value))} />
                            </div>
                            <div>
                                <label className="eyebrow" htmlFor="sim-day">Deploy on day</label>
                                <input id="sim-day" type="number" min={1} max={days} className={fieldClass} value={interventionDay} onChange={(e) => setInterventionDay(Number(e.target.value))} />
                            </div>
                        </div>
                        <Button onClick={analyzeIntervention} disabled={loading} className="h-10 w-full gap-2">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
                            {loading ? "Running ML pipeline…" : "Analyze best intervention"}
                        </Button>
                    </Panel>

                    {recommendation && prophetBaseline && (
                        <Panel
                            title="2 · Recommended strategy"
                            icon={<Shield className="h-5 w-5" />}
                            description={recommendation.source === "gemini" ? "Gemini + SIR" : "Rule-based + SIR"}
                            bodyClassName="space-y-3 p-4"
                        >
                            <p className="font-serif text-xl font-medium leading-snug">{recommendation.strategy}</p>
                            <p className="text-sm text-muted-foreground">
                                Targets a <b className="text-foreground">{recommendation.effectiveness_pct}%</b> transmission reduction.
                                {sirBaseline && sirIntervention && (
                                    <> Peak {sirIntervention.peak_day - sirBaseline.peak_day < 0 ? "accelerated" : "delayed"} by <b className="text-foreground">{Math.abs(sirIntervention.peak_day - sirBaseline.peak_day)} days</b>.</>
                                )}
                            </p>
                            {recommendation.gemini_recommendation && (
                                <p className="border-l-2 pl-3 text-xs italic text-muted-foreground">
                                    {recommendation.gemini_recommendation.slice(0, 260)}{recommendation.gemini_recommendation.length > 260 ? "…" : ""}
                                </p>
                            )}
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                <span>Cost: {recommendation.cost_level}</span>
                                <span>R₀ {sirBaseline?.R0?.toFixed(2) ?? "—"}</span>
                                <span>R₀ after {sirIntervention?.R0_post_intervention?.toFixed(2) ?? "—"}</span>
                            </div>
                            <Button
                                onClick={handleDeploy}
                                disabled={isDeployed || deploying}
                                variant={isDeployed ? "outline" : "default"}
                                className="h-10 w-full gap-2"
                            >
                                {deploying ? <Loader2 className="h-4 w-4 animate-spin" /> : isDeployed ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Send className="h-4 w-4" />}
                                {deploying ? "Deploying…" : isDeployed ? "Strategy deployed" : "3 · Deploy strategy"}
                            </Button>
                        </Panel>
                    )}
                </div>

                {/* Right: results fill the height */}
                <div className="flex min-h-0 flex-col gap-3">
                    {recommendation && prophetBaseline ? (
                        <>
                            <div className="grid shrink-0 grid-cols-3 gap-2 sm:gap-3">
                                <div className="rounded-sm border bg-card px-3 py-2">
                                    <p className="eyebrow">Baseline</p>
                                    <p className="font-serif text-2xl font-medium leading-tight text-danger">{totalBaseline}</p>
                                </div>
                                <div className="rounded-sm border bg-card px-3 py-2">
                                    <p className="eyebrow">With intervention</p>
                                    <p className="font-serif text-2xl font-medium leading-tight text-success">{totalScenario}</p>
                                </div>
                                <div className="rounded-sm border bg-card px-3 py-2">
                                    <p className="eyebrow">Cases averted</p>
                                    <p className="font-serif text-2xl font-medium leading-tight">{casesSaved}</p>
                                </div>
                            </div>

                            <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-2">
                                <Panel
                                    title="Prophet case forecast"
                                    description="Daily cases, baseline vs with intervention"
                                    className="flex min-h-[260px] flex-col lg:min-h-0"
                                    bodyClassName="min-h-0 flex-1 p-3"
                                    action={isDeployed ? <span className="inline-flex items-center gap-1 rounded-sm border border-success/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-success"><CheckCircle2 className="h-3 w-3" /> Deployed</span> : undefined}
                                >
                                    <ErrorBoundary title="Failed to load Prophet forecast">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={prophetChartData} margin={{ top: 5, right: 16, bottom: 5, left: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                                                <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                                                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickLine={false} axisLine={false} />
                                                <Tooltip contentStyle={tooltipStyle} />
                                                <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                                                <Line type="monotone" dataKey="No Intervention" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                                                <Line type="monotone" dataKey="With Intervention" stroke="#10b981" strokeWidth={2.5} activeDot={{ r: 5, strokeWidth: 0, fill: "#10b981" }} dot={false} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </ErrorBoundary>
                                </Panel>

                                <Panel
                                    title="SIR compartmental model"
                                    description="Infected curve, baseline vs post-intervention"
                                    className="flex min-h-[260px] flex-col lg:min-h-0"
                                    bodyClassName="min-h-0 flex-1 p-3"
                                >
                                    <ErrorBoundary title="Failed to load SIR simulation">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={sirChartData} margin={{ top: 5, right: 16, bottom: 5, left: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                                                <XAxis dataKey="day" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                                                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickLine={false} axisLine={false} />
                                                <Tooltip contentStyle={tooltipStyle} />
                                                <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                                                <Area type="monotone" dataKey="Baseline Infected" stroke="#ef4444" fill="#ef444420" strokeWidth={2} dot={false} />
                                                <Area type="monotone" dataKey="With Intervention" stroke="#10b981" fill="#10b98120" strokeWidth={2} dot={false} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </ErrorBoundary>
                                </Panel>
                            </div>

                            <p className="flex shrink-0 items-start gap-2 text-xs text-muted-foreground">
                                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                                Modeled on day {interventionDay} with a {recommendation.effectiveness_pct}% efficacy ramp over 7 days. SIR R₀ falls from {sirBaseline?.R0?.toFixed(2) ?? "—"} to {sirIntervention?.R0_post_intervention?.toFixed(2) ?? "—"}.
                            </p>
                        </>
                    ) : loading ? (
                        <Panel className="m-auto w-full max-w-xl" bodyClassName="p-10 text-center">
                            <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin" />
                            <p className="font-serif text-xl">Running ML pipeline</p>
                            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">Prophet forecast → SIR simulation → Gemini recommendation. This may take 10–15 seconds…</p>
                        </Panel>
                    ) : (
                        <Panel className="m-auto w-full max-w-xl" bodyClassName="p-10 text-center">
                            <Bot className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                            <p className="font-serif text-xl">Set up a scenario</p>
                            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">Choose a disease, horizon and deployment day, then run “Analyze best intervention”. The engine combines Prophet forecasting, SIR modeling and Gemini to recommend a response.</p>
                        </Panel>
                    )}
                </div>
            </PanelGrid>
        </DashboardLayout>
    );
};

export default GovSimulator;
