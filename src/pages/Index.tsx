import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import SCurveChart from "@/components/SCurveChart";
import { useAuth } from "@/context/AuthContext";
import { storage, Project } from "@/lib/storage";
import { useEffect, useState } from "react";
import { 
  ArrowUpRight, ArrowDownRight, AlertTriangle, CheckCircle, 
  Clock, TrendingUp, Zap, Activity, BarChart2, Target
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const projects = storage.getProjects();
    if (projects.length > 0) {
      const p = projects[0];
      setProject(p);
      setStats(storage.getProjectAnalytics(p.id));
    }
  }, []);

  if (!project || !stats) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-20 text-center">
          {/* Empty state */}
          <div className="max-w-md mx-auto">
            <div className="relative mb-6">
              <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-primary/20">
                <BarChart2 className="h-10 w-10 text-primary/60" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-muted rounded-full" style={{ left: 'calc(50% + 24px)', top: '-4px' }}>
                <div className="w-full h-full rounded-full bg-yellow-400/50 animate-ping" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Belum Ada Data Proyek</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Mulai dengan membuat proyek baru untuk memantau progress dan pelaporan.
            </p>
            {user?.role === "PPTK" && (
              <Button 
                onClick={() => navigate("/projects/create")}
                className="bg-gradient-to-r from-primary to-accent text-white border-0"
              >
                Buat Proyek Baru
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const deviationColor = stats.deviation < -5 ? "text-red-400" : stats.deviation < 0 ? "text-yellow-400" : "text-green-400";
  const deviationBg = stats.deviation < -5 ? "from-red-500/10 to-red-500/5 border-red-500/20" : stats.deviation < 0 ? "from-yellow-500/10 to-yellow-500/5 border-yellow-500/20" : "from-green-500/10 to-green-500/5 border-green-500/20";

  const kpiCards = [
    {
      title: "Progres Fisik",
      value: `${stats.overallProgress.toFixed(2)}%`,
      sub: "Realisasi Lapangan",
      icon: CheckCircle,
      gradient: "from-blue-500 to-cyan-500",
      bg: "from-blue-500/10 to-cyan-500/5",
      border: "border-blue-500/20",
    },
    {
      title: "Target Rencana",
      value: `${stats.plannedProgress.toFixed(2)}%`,
      sub: "Berdasarkan Jadwal",
      icon: Target,
      gradient: "from-purple-500 to-violet-500",
      bg: "from-purple-500/10 to-violet-500/5",
      border: "border-purple-500/20",
    },
    {
      title: "Deviasi",
      value: `${stats.deviation >= 0 ? "+" : ""}${stats.deviation.toFixed(2)}%`,
      sub: stats.deviation < -5 ? "⚠ KRITIS" : stats.deviation < 0 ? "Sedikit Terlambat" : "On Track",
      icon: stats.deviation < 0 ? ArrowDownRight : ArrowUpRight,
      gradient: stats.deviation < -5 ? "from-red-500 to-rose-500" : stats.deviation < 0 ? "from-yellow-500 to-orange-500" : "from-green-500 to-emerald-500",
      bg: deviationBg,
      border: stats.deviation < -5 ? "border-red-500/20" : stats.deviation < 0 ? "border-yellow-500/20" : "border-green-500/20",
      valueColor: deviationColor,
    },
    {
      title: "Sisa Waktu",
      value: `${stats.daysRemaining}`,
      sub: "Hari Kalender",
      icon: Clock,
      gradient: "from-orange-500 to-amber-500",
      bg: "from-orange-500/10 to-amber-500/5",
      border: "border-orange-500/20",
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      {/* Hero Banner */}
      <div className="relative border-b border-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/8 to-accent/8" />
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(ellipse at 10% 50%, hsl(214 100% 60% / 0.08) 0%, transparent 60%)`,
        }} />
        <div className="container relative py-7">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Activity className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">Dashboard Monitoring</span>
              </div>
              <h1 className="text-2xl font-black font-outfit text-foreground">{project.name}</h1>
              <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
                {project.location} · TA {project.fiscalYear}
              </p>
            </div>
            <div className="glass-card rounded-xl px-5 py-3 border border-white/10 text-right">
              <p className="text-xs text-muted-foreground font-medium">Nilai Kontrak</p>
              <p className="text-xl font-black font-outfit gradient-text">
                Rp {(project.contractValue / 1e9).toFixed(2)} M
              </p>
              <p className="text-xs text-muted-foreground">{project.contractorName}</p>
            </div>
          </div>
        </div>
      </div>

      <section className="container py-8 space-y-6">

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {kpiCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className={cn("glass-card rounded-xl p-5 border bg-gradient-to-br transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl animate-slide-up", card.bg, card.border)}
                style={{ animationDelay: `${idx * 0.08}s` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-muted-foreground">{card.title}</span>
                  <div className={cn("w-7 h-7 rounded-lg bg-gradient-to-br flex items-center justify-center", card.gradient)}>
                    <Icon className="h-3.5 w-3.5 text-white" />
                  </div>
                </div>
                <div className={cn("text-3xl font-black font-outfit mb-1", card.valueColor || "text-foreground")}>
                  {card.value}
                </div>
                <p className="text-xs text-muted-foreground">{card.sub}</p>

                {/* Progress Bar for Progres Fisik */}
                {idx === 0 && (
                  <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-1000 progress-bar-animated"
                      style={{ width: `${Math.min(100, stats.overallProgress)}%` }}
                    />
                  </div>
                )}
                {idx === 1 && (
                  <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-violet-500"
                      style={{ width: `${Math.min(100, stats.plannedProgress)}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* S-Curve Chart */}
        <div className="glass-card rounded-xl border border-white/10 overflow-hidden animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <SCurveChart projectId={project.id} />
        </div>

        {/* Items Table */}
        <div className="glass-card rounded-xl border border-white/10 overflow-hidden animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <div className="p-5 border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/20">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-base">Pantauan Item Pekerjaan</h3>
                <p className="text-xs text-muted-foreground">Statistik realisasi per item pekerjaan</p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm premium-table">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Uraian Pekerjaan</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bobot</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vol. Kontrak</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Terpasang</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Progres</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.itemsStats.map((item: any) => {
                  let statusStyle = "bg-green-500/10 text-green-400 border-green-500/20";
                  let statusText = "On Track";
                  if (item.progressPercent === 0) {
                    statusStyle = "bg-red-500/10 text-red-400 border-red-500/20";
                    statusText = "Belum Mulai";
                  } else if (item.progressPercent < 50) {
                    statusStyle = "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
                    statusText = "Berjalan";
                  } else if (item.progressPercent >= 100) {
                    statusStyle = "bg-blue-500/10 text-blue-400 border-blue-500/20";
                    statusText = "Selesai";
                  }

                  const progressPct = Math.min(100, item.progressPercent);
                  const barColor = item.progressPercent >= 100 ? "from-blue-500 to-cyan-500"
                    : item.progressPercent >= 50 ? "from-green-500 to-emerald-500"
                    : item.progressPercent > 0 ? "from-yellow-500 to-orange-500"
                    : "from-red-500 to-rose-500";

                  return (
                    <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-foreground text-sm">{item.description}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{item.itemCode}</p>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-muted-foreground">{item.weight?.toFixed(2)}%</td>
                      <td className="px-4 py-3 text-right text-sm text-muted-foreground">{item.contractVol} {item.unit}</td>
                      <td className="px-4 py-3 text-right text-sm text-foreground font-medium">{item.volReal}</td>
                      <td className="px-4 py-3 text-right min-w-[120px]">
                        <div className="flex items-center gap-2 justify-end">
                          <div className="flex-1 max-w-[80px] h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className={cn("h-full rounded-full bg-gradient-to-r", barColor)}
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-foreground w-10 text-right">
                            {item.progressPercent.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border", statusStyle)}>
                          {statusText}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </section>
    </div>
  );
};

export default Index;
