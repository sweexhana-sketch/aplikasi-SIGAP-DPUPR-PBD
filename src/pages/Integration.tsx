import { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { integrationService, OAPContractor, OAPStats } from "@/lib/integrationService";
import { 
  RefreshCw, Link2, ExternalLink, CheckCircle2, XCircle, 
  AlertTriangle, Clock, Database, Users, Building2,
  FileText, Activity, Loader2, Info, Wifi, WifiOff,
  Search, Eye, Copy, ChevronRight, Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

const OAP_URL = "https://data-kontraktor-oap-web.vercel.app";
const SIGAP_URL = "https://aplikasi-sigap-dpupr-pbd.vercel.app";

const IntegrationPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [contractors, setContractors] = useState<OAPContractor[]>([]);
  const [stats, setStats] = useState<OAPStats | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{ online: boolean; latency?: number; error?: string } | null>(null);
  const [search, setSearch] = useState("");

  // Role Validation
  useEffect(() => {
    if (user && user.role !== "ADMIN") {
      toast.error("Akses Ditolak: Hanya Admin yang dapat mengakses halaman integrasi OAP.");
      navigate("/");
    }
  }, [user, navigate]);

  // Load cached data on mount
  useEffect(() => {
    setContractors(integrationService.getLocalContractors());
    setStats(integrationService.getLocalStats());
    setLastSync(integrationService.getLastSync());
    checkConnection();
  }, []);

  const checkConnection = useCallback(async () => {
    setIsChecking(true);
    const status = await integrationService.checkConnection();
    setConnectionStatus(status);
    setIsChecking(false);
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    toast.info("Menyinkronkan data dari DATA-KONTRAKTOR-OAP...");
    try {
      const result = await integrationService.syncAll();
      if (result.success) {
        setContractors(result.contractors);
        setStats(result.stats);
        setLastSync(result.timestamp);
        toast.success(`Berhasil! ${result.contractors.length} kontraktor disinkronkan.`);
      } else {
        toast.error(`Sinkronisasi gagal: ${result.error}`);
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredContractors = contractors.filter(c =>
    !search || 
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.classification?.toLowerCase().includes(search.toLowerCase()) ||
    c.npwp?.includes(search)
  );

  const formatDate = (iso: string) => {
    if (!iso) return "-";
    return new Date(iso).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      {/* Hero Banner */}
      <div className="relative border-b border-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-accent/10 via-primary/10 to-secondary/10" />
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(ellipse at 20% 50%, hsl(250 89% 65% / 0.1) 0%, transparent 60%), radial-gradient(ellipse at 80% 50%, hsl(214 100% 60% / 0.1) 0%, transparent 60%)`,
        }} />
        <div className="container relative py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-accent/20 border border-accent/30">
                  <Link2 className="h-5 w-5 text-accent" />
                </div>
                <Badge className="bg-accent/20 text-accent border-accent/30 text-xs font-semibold">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Fitur Integrasi
                </Badge>
              </div>
              <h1 className="text-3xl font-black font-outfit gradient-text mb-1">Integrasi OAP</h1>
              <p className="text-muted-foreground text-sm">
                Sinkronisasi data kontraktor antara <strong className="text-accent">DATA-KONTRAKTOR-OAP</strong> dengan sistem <strong className="text-primary">SI PRO</strong>
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={checkConnection}
                disabled={isChecking}
                className="border-white/10 bg-white/5 hover:bg-white/10"
              >
                {isChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
                <span className="ml-1.5">Cek Koneksi</span>
              </Button>
              <Button
                onClick={handleSync}
                disabled={isSyncing}
                size="sm"
                className="bg-gradient-to-r from-accent to-primary text-white border-0 shadow-lg"
              >
                {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                <span className="ml-1.5">Sinkronkan Sekarang</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8 space-y-6">

        {/* Status Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Connection Status */}
          <div className={cn("glass-card rounded-xl p-4 border", 
            connectionStatus === null ? "border-white/10" :
            connectionStatus.online ? "border-green-500/30" : "border-red-500/30"
          )}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status Koneksi</span>
              {connectionStatus?.online ? 
                <Wifi className="h-4 w-4 text-green-400" /> : 
                <WifiOff className="h-4 w-4 text-red-400" />
              }
            </div>
            {connectionStatus === null ? (
              <p className="text-sm text-muted-foreground">Memeriksa...</p>
            ) : connectionStatus.online ? (
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-sm font-bold text-green-400">Online</span>
                </div>
                {connectionStatus.latency && (
                  <p className="text-xs text-muted-foreground mt-1">Latensi: {connectionStatus.latency}ms</p>
                )}
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <span className="text-sm font-bold text-red-400">Offline / CORS Error</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{connectionStatus.error}</p>
              </div>
            )}
          </div>

          {/* Last Sync */}
          <div className="glass-card rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sinkronisasi Terakhir</span>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            {lastSync ? (
              <div>
                <p className="text-sm font-bold text-foreground">{formatDate(lastSync)}</p>
                <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Data tersimpan lokal
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Belum pernah disinkronkan</p>
            )}
          </div>

          {/* Data Summary */}
          <div className="glass-card rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Data Tersinkron</span>
              <Database className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-2xl font-black gradient-text">{contractors.length}</p>
                <p className="text-xs text-muted-foreground">Kontraktor</p>
              </div>
              {stats && (
                <div>
                  <p className="text-2xl font-black text-secondary">{stats.totalCertifications || 0}</p>
                  <p className="text-xs text-muted-foreground">Sertifikasi</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* OAP System Link */}
          <div className="glass-card rounded-xl p-5 border border-accent/20 group hover:border-accent/40 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-md bg-accent/20">
                    <Database className="h-4 w-4 text-accent" />
                  </div>
                  <Badge className="bg-accent/20 text-accent border-accent/30 text-xs">Sistem Sumber</Badge>
                </div>
                <h3 className="font-bold text-foreground mb-1">DATA-KONTRAKTOR-OAP</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Sistem pendataan kontraktor OAP (Orang Asli Papua) dengan database lengkap, sertifikasi, dan manajemen akun.
                </p>
                <div className="flex flex-wrap gap-2">
                  <a href={OAP_URL} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="border-accent/30 text-accent hover:bg-accent/10 text-xs">
                      <ExternalLink className="h-3 w-3 mr-1" /> Buka Sistem
                    </Button>
                  </a>
                  <a href={`${OAP_URL}/account/signin`} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="border-white/10 text-muted-foreground hover:bg-white/5 text-xs">
                      <Users className="h-3 w-3 mr-1" /> Login OAP
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* SI PRO System Link */}
          <div className="glass-card rounded-xl p-5 border border-primary/20 group hover:border-primary/40 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-md bg-primary/20">
                    <Activity className="h-4 w-4 text-primary" />
                  </div>
                  <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">Sistem Ini</Badge>
                </div>
                <h3 className="font-bold text-foreground mb-1">SI PRO — Aplikasi Ini</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Sistem Informasi Proyek DPUPR Papua Barat Daya. Menggunakan data kontraktor dari OAP untuk monitoring proyek.
                </p>
                <div className="flex flex-wrap gap-2">
                  <a href={SIGAP_URL} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="border-primary/30 text-primary hover:bg-primary/10 text-xs">
                      <ExternalLink className="h-3 w-3 mr-1" /> Vercel Live
                    </Button>
                  </a>
                  <a href="https://github.com/sweexhana-sketch/DATA-KONTRAKTOR-OAP" target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="border-white/10 text-muted-foreground hover:bg-white/5 text-xs">
                      <FileText className="h-3 w-3 mr-1" /> GitHub OAP
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* API Endpoints Info */}
        <div className="glass-card rounded-xl p-5 border border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <Info className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">API Endpoints DATA-KONTRAKTOR-OAP</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
            {[
              { method: "GET", path: "/api/contractors", desc: "Daftar kontraktor OAP" },
              { method: "GET", path: "/api/stats", desc: "Statistik platform" },
              { method: "GET", path: "/api/certifications", desc: "Data sertifikasi" },
              { method: "GET", path: "/api/projects", desc: "Proyek terkait" },
              { method: "POST", path: "/api/auth/callback/credentials", desc: "Autentikasi" },
              { method: "POST", path: "/api/signup", desc: "Registrasi akun" },
            ].map(ep => (
              <div key={ep.path} className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/5">
                <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", 
                  ep.method === "GET" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
                )}>
                  {ep.method}
                </span>
                <span className="text-primary/80 flex-1 truncate">{ep.path}</span>
                <span className="text-muted-foreground text-[10px] hidden md:block">{ep.desc}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-yellow-400" />
            Beberapa endpoint memerlukan autentikasi. Jika CORS error, sinkronisasi manual via Import JSON.
          </p>
        </div>

        {/* Contractor Data Table */}
        <div className="glass-card rounded-xl border border-white/10 overflow-hidden">
          <div className="p-5 border-b border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="font-bold text-base">Data Kontraktor OAP</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{contractors.length} kontraktor tersinkronkan</p>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari kontraktor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 w-48"
              />
            </div>
          </div>

          {contractors.length === 0 ? (
            <div className="p-12 text-center">
              <Database className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-semibold text-muted-foreground">Belum ada data tersinkronkan</p>
              <p className="text-xs text-muted-foreground/60 mt-1 mb-4">
                Klik "Sinkronkan Sekarang" untuk mengambil data dari DATA-KONTRAKTOR-OAP
              </p>
              <Button onClick={handleSync} disabled={isSyncing} size="sm" className="bg-gradient-to-r from-accent to-primary text-white">
                {isSyncing ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <RefreshCw className="h-4 w-4 mr-1.5" />}
                Mulai Sinkronisasi
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm premium-table">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">No</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nama Kontraktor</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">NPWP</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Klasifikasi</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status OAP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredContractors.slice(0, 50).map((c, idx) => (
                    <tr key={c.id || idx} className="group">
                      <td className="px-4 py-3 text-muted-foreground text-xs">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                            {c.name?.[0] || "?"}
                          </div>
                          <div>
                            <p className="font-semibold text-xs text-foreground">{c.name || "-"}</p>
                            {c.email && <p className="text-[10px] text-muted-foreground">{c.email}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{c.npwp || "-"}</td>
                      <td className="px-4 py-3">
                        {c.classification ? (
                          <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px]">{c.classification}</Badge>
                        ) : <span className="text-xs text-muted-foreground">-</span>}
                      </td>
                      <td className="px-4 py-3">
                        {c.isOAP ? (
                          <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-[10px]">
                            <CheckCircle2 className="h-2.5 w-2.5 mr-1" /> OAP
                          </Badge>
                        ) : (
                          <Badge className="bg-white/5 text-muted-foreground border-white/10 text-[10px]">Non-OAP</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredContractors.length > 50 && (
                <div className="p-3 text-center text-xs text-muted-foreground border-t border-white/5">
                  Menampilkan 50 dari {filteredContractors.length} kontraktor
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default IntegrationPage;
