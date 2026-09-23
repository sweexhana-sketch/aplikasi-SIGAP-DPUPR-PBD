import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { 
  BarChart2, Briefcase, Wallet, Clock, Activity, ArrowRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { terbilang } from "@/lib/terbilang";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalBudget: 0,
    activeProjects: 0,
    completedProjects: 0,
  });
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('sigap_pengawasan')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Gagal mengambil data dashboard:", error);
      } else if (data) {
        const total = data.length;
        const budget = data.reduce((sum, p) => sum + (Number(p.nilai_kontrak) || 0), 0);
        const active = data.filter(p => p.status !== 'Selesai').length;
        const completed = data.filter(p => p.status === 'Selesai').length;

        setStats({
          totalProjects: total,
          totalBudget: budget,
          activeProjects: active,
          completedProjects: completed,
        });

        setRecentProjects(data.slice(0, 5)); // Ambil 5 terbaru
      }
      setLoading(false);
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Memuat Dashboard...</div>;
  }

  if (stats.totalProjects === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-20 text-center">
          <div className="max-w-md mx-auto">
            <div className="relative mb-6">
              <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-primary/20">
                <BarChart2 className="h-10 w-10 text-primary/60" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Belum Ada Data Proyek</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Mulai dengan membuat proyek baru untuk memantau progress dan pelaporan.
            </p>
            {user?.role !== "PIMPINAN" && (
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

  const kpiCards = [
    {
      title: "Total Proyek",
      value: stats.totalProjects,
      sub: "Keseluruhan Proyek",
      icon: Briefcase,
      gradient: "from-blue-500 to-cyan-500",
      bg: "from-blue-500/10 to-cyan-500/5",
      border: "border-blue-500/20",
    },
    {
      title: "Total Anggaran",
      value: `Rp ${(stats.totalBudget / 1e9).toFixed(1)} M`,
      sub: "Akumulasi Nilai Kontrak",
      icon: Wallet,
      gradient: "from-purple-500 to-violet-500",
      bg: "from-purple-500/10 to-violet-500/5",
      border: "border-purple-500/20",
    },
    {
      title: "Proyek Aktif",
      value: stats.activeProjects,
      sub: "Sedang Berjalan",
      icon: Activity,
      gradient: "from-orange-500 to-amber-500",
      bg: "from-orange-500/10 to-amber-500/5",
      border: "border-orange-500/20",
    },
    {
      title: "Proyek Selesai",
      value: stats.completedProjects,
      sub: "Telah Diserahterimakan",
      icon: CheckCircle,
      gradient: "from-green-500 to-emerald-500",
      bg: "from-green-500/10 to-emerald-500/5",
      border: "border-green-500/20",
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
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                  {user?.role === "PIMPINAN" ? "Dashboard Executive" : "Dashboard Ringkasan"}
                </span>
              </div>
              <h1 className="text-3xl font-black font-outfit text-foreground">Sistem Pengawasan Proyek</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Dinas Pekerjaan Umum dan Penataan Ruang Provinsi Papua Barat Daya
              </p>
            </div>
            {user?.role !== "PIMPINAN" && (
              <Button onClick={() => navigate("/projects/create")} className="bg-primary">
                Buat Proyek Baru
              </Button>
            )}
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
                className={cn("glass-card rounded-xl p-5 border bg-gradient-to-br transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl", card.bg, card.border)}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-muted-foreground">{card.title}</span>
                  <div className={cn("w-7 h-7 rounded-lg bg-gradient-to-br flex items-center justify-center", card.gradient)}>
                    <Icon className="h-3.5 w-3.5 text-white" />
                  </div>
                </div>
                <div className="text-3xl font-black font-outfit mb-1 text-foreground">
                  {card.value}
                </div>
                <p className="text-xs text-muted-foreground">{card.sub}</p>
              </div>
            );
          })}
        </div>

        {/* Recent Projects Table */}
        <div className="glass-card rounded-xl border border-white/10 overflow-hidden">
          <div className="p-5 border-b border-white/5 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-base">Proyek Terbaru</h3>
              <p className="text-xs text-muted-foreground">5 Proyek yang baru saja ditambahkan</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/projects')} className="text-primary hover:text-primary/80">
              Lihat Semua <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm premium-table">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nama Proyek</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Lokasi</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Penyedia Jasa</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nilai Kontrak</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentProjects.map((p: any) => (
                  <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => navigate(`/projects/${p.id}/manage`)}>
                    <td className="px-4 py-3 font-medium">{p.nama_proyek}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.lokasi}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.penyedia_jasa}</td>
                    <td className="px-4 py-3 text-right font-medium text-primary">Rp {(p.nilai_kontrak / 1e9).toFixed(1)} M</td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-blue-500/10 text-blue-400 border-blue-500/20">
                        {p.status || 'Berjalan'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </section>
    </div>
  );
};

export default Index;
