import { useAuth, UserRole } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { 
  Building2, HardHat, UserCog, Users, ClipboardCheck, 
  Wallet, FileText, ChevronRight, Sparkles, MapPin, Pickaxe, Tractor, ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const roleConfig = [
  { 
    role: "ADMIN", label: "Hak Akses Penuh", icon: UserCog, 
    desc: "Administrator Sistem Utama", 
    gradient: "from-slate-700 via-slate-600 to-slate-800",
    bg: "from-slate-500/10 to-slate-800/5",
    border: "border-slate-500/20 hover:border-slate-500/50"
  },
  { 
    role: "PPK", label: "PPK", icon: Wallet, 
    desc: "Pejabat Pembuat Komitmen", 
    gradient: "from-blue-600 via-blue-500 to-blue-700",
    bg: "from-blue-500/10 to-blue-700/5",
    border: "border-blue-500/20 hover:border-blue-500/50"
  },
  { 
    role: "PPTK", label: "PPTK", icon: ClipboardCheck, 
    desc: "Pejabat Pelaksana Teknis", 
    gradient: "from-cyan-600 via-cyan-500 to-cyan-700",
    bg: "from-cyan-500/10 to-cyan-700/5",
    border: "border-cyan-500/20 hover:border-cyan-500/50"
  },
  { 
    role: "STAF_DINAS", label: "Staf Dinas PUPR", icon: Users, 
    desc: "Monitoring & Arsip Data", 
    gradient: "from-teal-600 via-teal-500 to-teal-700",
    bg: "from-teal-500/10 to-teal-700/5",
    border: "border-teal-500/20 hover:border-teal-500/50"
  },
  { 
    role: "KONTRAKTOR_UMUM", label: "Login K. Umum", icon: Tractor, 
    desc: "Akses Kontraktor Non-OAP", 
    gradient: "from-emerald-600 via-emerald-500 to-emerald-700",
    bg: "from-emerald-500/10 to-emerald-700/5",
    border: "border-emerald-500/20 hover:border-emerald-500/50"
  },
  { 
    role: "KONSULTAN", label: "Konsultan Pengawas", icon: FileText, 
    desc: "Supervisi & Pengawasan", 
    gradient: "from-amber-500 via-yellow-500 to-amber-600",
    bg: "from-amber-500/10 to-yellow-500/5",
    border: "border-amber-500/20 hover:border-amber-500/50"
  },
];

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (role: UserRole) => {
    login(role);
    navigate("/");
  };

  const handleContractorLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Email dan password wajib diisi");
      return;
    }
    
    setIsLoading(true);
    
    // Simulate API call to OAP
    // In real app, we would POST to https://data-kontraktor-oap-web.vercel.app/api/auth/callback/credentials
    setTimeout(() => {
      // Mock successful auth for demo
      if (email.includes('@') && password.length >= 6) {
        login("KONTRAKTOR");
        navigate("/");
      } else {
        toast.error("Kredensial OAP tidak valid. Silakan coba lagi atau cek portal OAP.");
      }
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center justify-center p-4">
      
      {/* Heavy Construction & Government Themed Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Core lighting */}
        <div className="absolute -top-40 -left-20 w-[600px] h-[600px] rounded-full bg-primary/10 blur-3xl animate-pulse-slow" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full bg-secondary/5 blur-3xl" />
        <div className="absolute -bottom-60 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-3xl" />
        
        {/* Construction Grid Pattern */}
        <div className="absolute inset-0 opacity-10 pattern-grid" />
        
        {/* Structural overlays */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-black/40 to-transparent mix-blend-overlay" />
        <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-black/60 to-transparent mix-blend-overlay" />

        {/* Diagonal Warning Stripes Pattern (Subtle) */}
        <div className="absolute top-0 left-0 w-full h-2 pattern-diagonal opacity-30" />
        <div className="absolute bottom-0 left-0 w-full h-2 pattern-diagonal opacity-30" />

        {/* Floating Icons (Crane, Hardhat, Pickaxe) */}
        <div className="absolute top-[15%] left-[10%] opacity-20 text-secondary animate-float">
          <Pickaxe className="w-16 h-16" />
        </div>
        <div className="absolute bottom-[20%] right-[10%] opacity-15 text-primary animate-float" style={{ animationDelay: '1.5s' }}>
          <Building2 className="w-24 h-24" />
        </div>
        <div className="absolute top-[30%] right-[15%] opacity-10 text-secondary animate-crane">
          <Tractor className="w-20 h-20" />
        </div>
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 lg:gap-12 items-center">
        
        {/* Left Side - Brand & Info */}
        <div className="flex-1 text-center lg:text-left space-y-6 animate-slide-in-right">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-2">
            <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Sistem Monitoring Terintegrasi</span>
          </div>

          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6">
            <div className="relative shrink-0">
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl scale-125 animate-glow-pulse" />
              <img src="/logo-pbd.png" alt="Logo Papua Barat Daya" className="relative h-28 w-28 drop-shadow-2xl" />
            </div>
            
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
                <h1 className="text-5xl lg:text-7xl font-black tracking-tighter font-outfit text-white drop-shadow-md">
                  SI PRO
                </h1>
                <Badge label="v2.0" color="primary" />
              </div>
              <h2 className="text-lg lg:text-xl font-bold text-secondary uppercase tracking-widest drop-shadow-sm">
                Sistem Informasi Proyek
              </h2>
              <p className="text-sm lg:text-base text-muted-foreground max-w-md mx-auto lg:mx-0 leading-relaxed">
                Pusat kendali laporan perkembangan fisik, manajemen kontrak, dan monitoring pembangunan infrastruktur Dinas PUPR Provinsi Papua Barat Daya.
              </p>
            </div>
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4">
            <InfoItem icon={MapPin} text="Papua Barat Daya" />
            <InfoItem icon={Building2} text="Infrastruktur Maju" />
            <InfoItem icon={ShieldCheck} text="Terintegrasi OAP" />
          </div>
        </div>

        {/* Right Side - Login Panel */}
        <div className="w-full max-w-md shrink-0 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="glass-dark rounded-2xl p-6 border-t-4 border-t-secondary shadow-2xl relative overflow-hidden">
            {/* Inner top glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-4 bg-secondary/30 blur-xl" />
            
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-white font-outfit">Portal Masuk</h3>
              <p className="text-sm text-muted-foreground mt-1">Silakan pilih peran atau masuk sebagai Kontraktor</p>
            </div>

            {showPasswordForm ? (
              // Contractor Password Login Form
              <div className="space-y-4 animate-fade-in">
                <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 mb-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-orange-400 mt-0.5" />
                    <p className="text-xs text-orange-200/80 leading-relaxed">
                      Login Kontraktor terintegrasi dengan DATA-KONTRAKTOR-OAP. Gunakan email dan sandi akun OAP Anda.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleContractorLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email Akun OAP</label>
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@perusahaan.com"
                      className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50 transition-all font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sandi</label>
                    <input 
                      type="password" 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50 transition-all"
                    />
                  </div>
                  
                  <div className="pt-2 flex gap-3">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-1/3 bg-transparent border-white/10 text-muted-foreground hover:bg-white/5 hover:text-white"
                      onClick={() => setShowPasswordForm(false)}
                    >
                      Batal
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isLoading}
                      className="w-2/3 bg-gradient-to-r from-secondary to-amber-600 hover:from-amber-500 hover:to-orange-600 text-black font-bold border-none shadow-gold"
                    >
                      {isLoading ? "Mengautentikasi..." : "Masuk Kontraktor"}
                    </Button>
                  </div>
                  
                  <div className="text-center pt-2">
                    <a 
                      href="https://data-kontraktor-oap-web.vercel.app/account/signin" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-secondary/70 hover:text-secondary underline underline-offset-4"
                    >
                      Lupa Sandi? / Manajemen Akun OAP
                    </a>
                  </div>
                </form>
              </div>
            ) : (
              // General Role Cards
              <div className="space-y-2">
                {/* Contractor Special Button */}
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className="w-full group relative overflow-hidden rounded-xl p-3 border border-secondary/30 bg-secondary/10 text-left transition-all hover:bg-secondary/20 hover:border-secondary/50 hover:shadow-[0_0_20px_rgba(251,191,36,0.15)] mb-4"
                >
                  <div className="absolute inset-0 pattern-diagonal opacity-20 pointer-events-none" />
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-secondary to-orange-500 flex items-center justify-center text-black shadow-lg">
                        <HardHat className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-white">Login Kontraktor</p>
                        <p className="text-[10px] text-secondary">Via DATA-KONTRAKTOR-OAP</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-secondary opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#111622] px-2 text-muted-foreground font-semibold tracking-wider">Akses Internal</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4">
                  {roleConfig.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.role}
                        onClick={() => handleLogin(item.role as UserRole)}
                        className={cn(
                          "group relative glass rounded-xl p-3 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg",
                          item.border
                        )}
                      >
                        <div className={cn("absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br", item.bg)} />
                        <div className="relative z-10 flex flex-col gap-2">
                          <Icon className="w-5 h-5 text-muted-foreground group-hover:text-white transition-colors" />
                          <div>
                            <p className="font-semibold text-xs text-foreground/90 group-hover:text-white">{item.label}</p>
                            <p className="text-[9px] text-muted-foreground/70 mt-0.5 leading-tight">{item.desc}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
};

const Badge = ({ label, color }: { label: string, color: 'primary' | 'secondary' }) => (
  <span className={cn(
    "text-xs font-bold px-2.5 py-1 rounded-md border backdrop-blur-md flex items-center gap-1.5 shadow-lg",
    color === 'primary' 
      ? "bg-primary/20 text-primary border-primary/30" 
      : "bg-secondary/20 text-secondary border-secondary/30"
  )}>
    {color === 'primary' ? <Sparkles className="h-3 w-3" /> : null}
    {label}
  </span>
);

const InfoItem = ({ icon: Icon, text }: { icon: any, text: string }) => (
  <div className="flex items-center gap-2 text-sm text-muted-foreground">
    <div className="p-1.5 rounded-md bg-white/5 border border-white/10">
      <Icon className="w-4 h-4 text-white/70" />
    </div>
    <span className="font-medium">{text}</span>
  </div>
);

export default Login;
