import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Legend, Area, AreaChart,
} from "recharts";
import { Loader2, AlertTriangle, CheckCircle2, Bot, Send, Activity, TrendingDown, Shield } from "lucide-react";
import {
    getForecast, getRValue, getRecommendedIntervention, getSIRSimulation,
    type ForecastResponse, type InterventionRecommendation, type SIRSimulationResponse, type RValueResponse,
} from "@/lib/mlApi";
import GeoFilterBar from "@/components/gov/GeoFilterBar";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { logSurveillanceAccess } from "@/lib/accessLogger";

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
    const [prophetScenario, setProphetScenario] = useState<ForecastResponse | null>(null);
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

            // 5. Simulated Prophet intervention scenario
            const reductionPct = rec.effectiveness_pct;
            const simPredictions = base.predictions.map((p, i) => {
                if (i >= interventionDay) {
                    const reduction = 1 - (reductionPct / 100) * Math.min(1, (i - interventionDay + 1) / 7);
                    return Math.max(0, Math.round(p * reduction));
                }
                return p;
            });

            logSurveillanceAccess("intervention_analyzed", { disease, city, ward, strategy: rec.strategy });
            setProphetScenario({
                dates: base.dates,
                predictions: simPredictions,
                lower: simPredictions.map(p => Math.max(0, Math.round(p * 0.85))),
                upper: simPredictions.map(p => Math.round(p * 1.15)),
            });
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
    const totalBaseline = prophetBaseline ? prophetBaseline.predictions.reduce((s, v) => s + v, 0) : 0;
    const totalScenario = prophetScenario ? prophetScenario.predictions.reduce((s, v) => s + v, 0) : 0;
    const casesSaved = totalBaseline - totalScenario;
    const costPerCase = 2500;
    const bedDaysPerCase = 3;

    const getRStatusColor = (status: string) => {
        if (status === "Growing") return "text-red-600 bg-red-50 border-red-200";
        if (status === "Declining") return "text-emerald-600 bg-emerald-50 border-emerald-200";
        return "text-amber-600 bg-amber-50 border-amber-200";
    };

    return (
        <DashboardLayout role="gov">
            <PageHeader title="Outbreak Simulator" description="Model ML‑recommended 'What If' scenarios and deploy field strategies." />

            <div className="mb-6">
                <GeoFilterBar
                    state={state}
                    city={city}
                    ward={ward}
                    onStateChange={setState}
                    onCityChange={setCity}
                    onWardChange={setWard}
                />
            </div>

            {/* ── Live R-value Badge ── */}
            <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-500" />
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Live R(t)</span>
                </div>
                {loadingR ? (
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Fetching...
                    </div>
                ) : liveR ? (
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-bold ${getRStatusColor(liveR.current_status)}`}>
                        {liveR.current_r.toFixed(2)}
                        <span className="text-[10px] font-semibold uppercase opacity-70">{liveR.current_status}</span>
                    </div>
                ) : (
                    <span className="text-xs text-slate-400">Unavailable</span>
                )}
                {liveR && liveR.current_r > 1.0 && (
                    <span className="text-[10px] font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded">⚠ Above threshold — intervention recommended</span>
                )}
            </div>

            {/* ── Step 1: Controls ── */}
            <div className="bg-card rounded-xl card-shadow p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <span className={`flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs ${step === 1 ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-700"}`}>1</span>
                    <h2 className="text-sm font-semibold text-foreground">Configure Scenario Context</h2>
                </div>

                <div className="grid sm:grid-cols-1 lg:grid-cols-4 gap-5 items-end">
                    {/* Disease */}
                    <div className="lg:col-span-1">
                        <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Disease</label>
                        <select
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium text-slate-700"
                            value={disease}
                            onChange={(e) => setDisease(e.target.value)}
                        >
                            {DISEASES.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    {/* Forecast Days */}
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Simulation Horizon (Days)</label>
                        <input
                            type="number"
                            min={7}
                            max={90}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium text-slate-700"
                            value={days}
                            onChange={(e) => setDays(Number(e.target.value))}
                        />
                    </div>
                    {/* Intervention Day */}
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Deploy On Day</label>
                        <input
                            type="number"
                            min={1}
                            max={days}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium text-slate-700"
                            value={interventionDay}
                            onChange={(e) => setInterventionDay(Number(e.target.value))}
                        />
                    </div>
                    {/* Run */}
                    <Button onClick={analyzeIntervention} disabled={loading} className="gap-2 h-10 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
                        {loading ? "Running ML Pipeline..." : "Analyze Best Intervention"}
                    </Button>
                </div>
            </div>

            {/* ── Step 2 & 3: Results ── */}
            {recommendation && prophetBaseline && (
                <div className="space-y-6">
                    {/* Strategy Overview Card */}
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl" />

                        <div className="flex items-center gap-2 mb-3">
                            <span className={`flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs ${step >= 2 ? "bg-blue-600 text-white" : "bg-blue-200 text-blue-800"}`}>2</span>
                            <h2 className="text-sm font-semibold text-blue-900">ML‑Recommended Strategy</h2>
                            <span className="text-[10px] bg-blue-200/60 text-blue-700 px-2 py-0.5 rounded font-bold uppercase tracking-wide">
                                {recommendation.source === "gemini" ? "Gemini + SIR" : "Rule-Based + SIR"}
                            </span>
                        </div>

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-blue-950 flex items-center gap-2 flex-wrap">
                                    <Shield className="h-5 w-5 text-blue-600" />
                                    {recommendation.strategy}
                                    <span className="text-[10px] uppercase tracking-wide bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                                        {disease}
                                    </span>
                                </h3>
                                <p className="text-sm text-blue-800/80 mt-1 max-w-xl">
                                    Predicted <span className="font-bold text-blue-900">{recommendation.effectiveness_pct}%</span> transmission reduction.
                                    {recommendation.impact && (
                                        <> Peak delayed by <span className="font-bold">{recommendation.impact.peak_delay_days} days</span>, averting <span className="font-bold text-emerald-700">{recommendation.impact.cases_averted}</span> cases.</>
                                    )}
                                </p>
                                {recommendation.gemini_recommendation && (
                                    <p className="text-xs text-blue-700/70 mt-2 italic border-l-2 border-blue-300 pl-3">
                                        {recommendation.gemini_recommendation.slice(0, 300)}{recommendation.gemini_recommendation.length > 300 ? "..." : ""}
                                    </p>
                                )}
                                <div className="flex gap-4 mt-3 text-xs text-blue-700/60 font-semibold">
                                    <span>Cost: {recommendation.cost_level}</span>
                                    <span>R₀: {recommendation.sir_baseline?.R0?.toFixed(2) ?? "—"}</span>
                                    <span>R₀ Post: {recommendation.sir_with_intervention?.R0_post?.toFixed(2) ?? "—"}</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 min-w-[200px]">
                                <Button
                                    onClick={handleDeploy}
                                    disabled={isDeployed || deploying}
                                    className={`gap-2 h-11 w-full font-bold transition-all shadow-md ${isDeployed
                                        ? "bg-emerald-100 text-emerald-800 cursor-not-allowed hover:bg-emerald-100"
                                        : "bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-lg"
                                        }`}
                                >
                                    {deploying ? <Loader2 className="h-5 w-5 animate-spin" /> : isDeployed ? <CheckCircle2 className="h-5 w-5" /> : <Send className="h-5 w-5" />}
                                    {deploying ? "Deploying..." : isDeployed ? "Strategy Deployed ✓" : "Deploy Strategy Now"}
                                </Button>
                                {!isDeployed && (
                                    <div className="flex items-center gap-2 justify-center text-[10px] font-semibold uppercase tracking-wider text-blue-700/60">
                                        <span className="w-4 border-t border-blue-700/30" /> Step 3 <span className="w-4 border-t border-blue-700/30" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Dual Charts: Prophet + SIR ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Prophet Forecast Chart */}
                        <div className="bg-card rounded-xl card-shadow p-5 relative">
                            {isDeployed && (
                                <div className="absolute top-4 right-4 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-3 py-1 rounded shadow-sm z-10 flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> DEPLOYED
                                </div>
                            )}
                            <h3 className="text-sm font-semibold text-foreground mb-1">Prophet Case Forecast</h3>
                            <p className="text-[10px] text-muted-foreground mb-3">Daily predicted cases — baseline vs with intervention</p>
                            <div className="h-56">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={prophetChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                                        <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                                        <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickLine={false} axisLine={false} />
                                        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11, boxShadow: '0 4px 6px -1px rgb(0 0 0/0.1)' }} />
                                        <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                                        <Line type="monotone" dataKey="No Intervention" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                                        <Line type="monotone" dataKey="With Intervention" stroke="#10b981" strokeWidth={2.5} activeDot={{ r: 5, strokeWidth: 0, fill: '#10b981' }} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* SIR Compartmental Chart */}
                        <div className="bg-card rounded-xl card-shadow p-5 relative">
                            <h3 className="text-sm font-semibold text-foreground mb-1">SIR Compartmental Model</h3>
                            <p className="text-[10px] text-muted-foreground mb-3">Infected curve — baseline vs post-intervention</p>
                            <div className="h-56">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={sirChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                                        <XAxis dataKey="day" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                                        <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickLine={false} axisLine={false} />
                                        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11, boxShadow: '0 4px 6px -1px rgb(0 0 0/0.1)' }} />
                                        <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                                        <Area type="monotone" dataKey="Baseline Infected" stroke="#ef4444" fill="#ef444420" strokeWidth={2} dot={false} />
                                        <Area type="monotone" dataKey="With Intervention" stroke="#10b981" fill="#10b98120" strokeWidth={2} dot={false} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Annotation bar */}
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                        <span>Intervention modeled on <strong>Day {interventionDay}</strong> with <strong>{recommendation.effectiveness_pct}%</strong> efficacy ramp over 7 days. SIR R₀ dropped from <strong>{sirBaseline?.R0?.toFixed(2) ?? "—"}</strong> → <strong>{sirIntervention?.R0_post_intervention?.toFixed(2) ?? "—"}</strong>.</span>
                    </div>

                    {/* Cost / Resource Estimates */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-red-50/50 border border-red-100 rounded-xl p-4 text-center">
                            <p className="text-xs font-semibold text-red-700/70 uppercase tracking-wider mb-1">Total Baseline</p>
                            <p className="text-2xl font-bold text-red-600">{totalBaseline}</p>
                            <p className="text-[10px] text-red-600/60 font-medium">Cases Estimated</p>
                        </div>
                        <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 text-center">
                            <p className="text-xs font-semibold text-emerald-700/70 uppercase tracking-wider mb-1">Post-Intervention</p>
                            <p className="text-2xl font-bold text-emerald-600">{totalScenario}</p>
                            <p className="text-[10px] text-emerald-600/60 font-medium">Cases Estimated</p>
                        </div>
                        <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-center">
                            <p className="text-xs font-semibold text-blue-700/70 uppercase tracking-wider mb-1">Averted Cases</p>
                            <p className="text-2xl font-bold text-blue-600">{casesSaved}</p>
                            <p className="text-[10px] text-blue-600/60 font-bold whitespace-nowrap">₹{(casesSaved * costPerCase).toLocaleString()} Saved</p>
                        </div>
                        <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-4 text-center">
                            <p className="text-xs font-semibold text-purple-700/70 uppercase tracking-wider mb-1">Bed-Days Freed</p>
                            <p className="text-2xl font-bold text-purple-600">{casesSaved * bedDaysPerCase}</p>
                            <p className="text-[10px] text-purple-600/60 font-medium">@{bedDaysPerCase} days/case avg</p>
                        </div>
                    </div>
                </div>
            )}

            {!recommendation && !loading && (
                <div className="bg-slate-50 rounded-xl p-12 text-center text-slate-400 border border-slate-100 shadow-sm">
                    <Bot className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-semibold text-slate-600">Configure your parameters and run "Analyze Best Intervention"</p>
                    <p className="text-xs mt-1.5 font-medium max-w-sm mx-auto leading-relaxed">The ML engine runs Prophet forecasting, SIR compartmental modeling, and Gemini to recommend the optimal response strategy.</p>
                </div>
            )}

            {loading && (
                <div className="bg-blue-50/50 rounded-xl p-12 text-center border border-blue-100 shadow-sm">
                    <Loader2 className="h-10 w-10 mx-auto mb-3 text-blue-500 animate-spin" />
                    <p className="font-semibold text-blue-700">Running ML Pipeline</p>
                    <p className="text-xs mt-1.5 font-medium text-blue-600/70 max-w-sm mx-auto">Prophet forecast → SIR simulation → Gemini recommendation. This may take 10–15 seconds...</p>
                </div>
            )}
        </DashboardLayout>
    );
};

export default GovSimulator;
