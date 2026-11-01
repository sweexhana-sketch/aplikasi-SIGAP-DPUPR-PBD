import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { 
  Building2, MapPin, Pickaxe, Tractor, ShieldCheck, Sparkles, User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const success = await login(email, password);
    if (success) {
      navigate("/");
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center justify-center p-4">
      
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-20 w-[600px] h-[600px] rounded-full bg-primary/10 blur-3xl animate-pulse-slow" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full bg-secondary/5 blur-3xl" />
        <div className="absolute -bottom-60 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute inset-0 opacity-10 pattern-grid" />
        
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-black/40 to-transparent mix-blend-overlay" />
        <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-black/60 to-transparent mix-blend-overlay" />

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
              <div className="flex flex-wrap items-baseline justify-center lg:justify-start gap-4">
                <h1 className="text-6xl lg:text-8xl font-black tracking-tighter font-outfit text-transparent bg-clip-text bg-gradient-to-br from-amber-400 via-yellow-300 to-orange-600 drop-shadow-[0_0_30px_rgba(245,158,11,0.3)] filter">
                  SI PRO
                </h1>
                <Badge label="v2.0" color="primary" />
              </div>
              <h2 className="text-lg lg:text-2xl font-bold text-white/90 uppercase tracking-[0.2em] font-outfit mt-2">
                Sistem Informasi <span className="text-cyan-400">Proyek</span>
              </h2>
              <p className="text-sm lg:text-base text-slate-300 max-w-md mx-auto lg:mx-0 leading-relaxed">
                Pusat kendali laporan perkembangan fisik, manajemen kontrak, dan monitoring pembangunan infrastruktur Dinas PUPR Provinsi Papua Barat Daya.
              </p>
            </div>
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4">
            <InfoItem icon={MapPin} text="Papua Barat Daya" />
            <InfoItem icon={Building2} text="Infrastruktur Maju" />
            <InfoItem icon={ShieldCheck} text="Terintegrasi Aman" />
          </div>
        </div>

        {/* Right Side - Login Panel */}
        <div className="w-full max-w-md shrink-0 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="rounded-3xl p-8 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden backdrop-blur-2xl bg-[#0f172a]/60">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-12 bg-cyan-500/20 blur-2xl" />
            
            <div className="text-center mb-6 relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-white/20">
                <User className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-black text-white font-outfit tracking-wide">Autentikasi</h3>
              <p className="text-sm text-slate-400 mt-1">Silakan masuk menggunakan Email dan Password yang terdaftar di Supabase.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@dinas.com"
                  className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Password</label>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                />
              </div>
              
              <div className="pt-4">
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-6 text-base"
                >
                  {isLoading ? "Mengautentikasi..." : "Masuk ke Sistem"}
                </Button>
              </div>
            </form>
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
