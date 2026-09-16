import { useAuth, UserRole, User } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { 
  Building2, HardHat, UserCog, Users, ClipboardCheck, 
  Wallet, FileText, ChevronRight, Sparkles, MapPin, Pickaxe, Tractor, ShieldCheck, Crown, UserPlus, Check, X, Award
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const roleConfig = [
  { 
    role: "PIMPINAN", label: "Pimpinan / Kadis", icon: Crown, 
    desc: "Executive Oversight & Monitoring", 
    gradient: "from-amber-500 via-amber-400 to-amber-600",
    bg: "from-amber-500/10 to-amber-600/5",
    border: "border-amber-500/30 hover:border-amber-500/60 font-semibold"
  },
  { 
    role: "ADMIN", label: "Hak Akses Penuh", icon: UserCog, 
    desc: "Administrator Sistem Utama", 
    gradient: "from-slate-700 via-slate-600 to-slate-800",
    bg: "from-slate-500/10 to-slate-800/5",
    border: "border-slate-500/20 hover:border-slate-500/50"
  },
  { 
    role: "PPK", label: "PPK (SK Penetapan)", icon: Wallet, 
    desc: "Pejabat Pembuat Komitmen", 
    gradient: "from-blue-600 via-blue-500 to-blue-700",
    bg: "from-blue-500/10 to-blue-700/5",
    border: "border-blue-500/30 hover:border-blue-500/60"
  },
  { 
    role: "PPTK", label: "PPTK (SK Penetapan)", icon: ClipboardCheck, 
    desc: "Pejabat Pelaksana Teknis", 
    gradient: "from-cyan-600 via-cyan-500 to-cyan-700",
    bg: "from-cyan-500/10 to-cyan-700/5",
    border: "border-cyan-500/30 hover:border-cyan-500/60"
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
  const { login, loginWithUser, registerAccount, getRegisteredAccounts } = useAuth();
  const navigate = useNavigate();
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [selectedRoleModal, setSelectedRoleModal] = useState<UserRole | null>(null);
  const [showRegisterForm, setShowRegisterForm] = useState(false);

  // Form registration state
  const [regName, setRegName] = useState("");
  const [regNip, setRegNip] = useState("");
  const [regSkNumber, setRegSkNumber] = useState("");
  const [regRole, setRegRole] = useState<UserRole>("PPK");
  const [regBidang, setRegBidang] = useState("Bina Marga");
  const [regJabatan, setRegJabatan] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleClick = (role: UserRole) => {
    if (role === "PPK" || role === "PPTK") {
      setSelectedRoleModal(role);
      setShowRegisterForm(false);
    } else {
      login(role);
      navigate("/");
    }
  };

  const handleSelectUserAccount = (userAcc: User) => {
    loginWithUser(userAcc);
    setSelectedRoleModal(null);
    navigate("/");
  };

  const handleRegisterNewAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regNip.trim() || !regSkNumber.trim()) {
      toast.error("Nama Lengkap, NIP, dan Nomor SK Penetapan wajib diisi");
      return;
    }

    const newAcc = registerAccount({
      name: regName.trim(),
      nip: regNip.trim(),
      skNumber: regSkNumber.trim(),
      role: regRole,
      bidang: regBidang,
      jabatan: regJabatan.trim() || `Pejabat (${regRole}) Bidang ${regBidang}`
    });

    toast.success(`Akun ${regRole} a.n. ${newAcc.name} berhasil didaftarkan sesuai SK!`);
    setSelectedRoleModal(null);
    setShowRegisterForm(false);
    navigate("/");
  };

  const handleContractorLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Email dan password wajib diisi");
      return;
    }
    
    setIsLoading(true);
    setTimeout(() => {
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
        <div className="absolute -top-40 -left-20 w-[600px] h-[600px] rounded-full bg-primary/10 blur-3xl animate-pulse-slow" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full bg-secondary/5 blur-3xl" />
        <div className="absolute -bottom-60 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute inset-0 opacity-10 pattern-grid" />
        
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-black/40 to-transparent mix-blend-overlay" />
        <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-black/60 to-transparent mix-blend-overlay" />
        <div className="absolute top-0 left-0 w-full h-2 pattern-diagonal opacity-30" />
        <div className="absolute bottom-0 left-0 w-full h-2 pattern-diagonal opacity-30" />

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
            <InfoItem icon={ShieldCheck} text="Terintegrasi SK Penetapan" />
          </div>
        </div>

        {/* Right Side - Login Panel */}
        <div className="w-full max-w-md shrink-0 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="rounded-3xl p-8 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden backdrop-blur-2xl bg-[#0f172a]/60">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-12 bg-cyan-500/20 blur-2xl" />
            
            <div className="text-center mb-6 relative z-10">
              <h3 className="text-2xl font-black text-white font-outfit tracking-wide">Portal Masuk</h3>
              <p className="text-sm text-slate-400 mt-1">Pilih peran atau registrasi akun <span className="text-amber-400 font-medium">PPK/PPTK SK Penetapan</span></p>
            </div>

            {/* Direct SK Registration Button */}
            <div className="mb-4">
              <Button
                onClick={() => {
                  setRegRole("PPK");
                  setShowRegisterForm(true);
                  setSelectedRoleModal("PPK");
                }}
                className="w-full bg-gradient-to-r from-blue-600/30 via-cyan-600/30 to-teal-600/30 hover:from-blue-600/50 hover:to-teal-600/50 text-cyan-200 border border-cyan-500/40 text-xs font-bold py-2.5 rounded-xl shadow-lg flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4 text-cyan-400" />
                Registrasi Akun Pejabat (PPK / PPTK SK)
              </Button>
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
                </form>
              </div>
            ) : (
              // General Role Cards
              <div className="space-y-2">
                {/* Contractor Special Button */}
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className="w-full group relative overflow-hidden rounded-2xl p-4 border border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-orange-600/10 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(245,158,11,0.2)] mb-4"
                >
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 mix-blend-overlay transition-opacity pointer-events-none" />
                  <div className="absolute right-0 top-0 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl -mr-16 -mt-16 transition-transform group-hover:scale-150" />
                  
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 p-[1px] shadow-lg shadow-orange-500/30">
                        <div className="w-full h-full rounded-xl bg-black/20 flex items-center justify-center backdrop-blur-sm">
                          <HardHat className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <div>
                        <p className="font-bold text-base text-white font-outfit tracking-wide">Login Kontraktor</p>
                        <p className="text-xs text-amber-400 font-medium tracking-wider uppercase mt-0.5">Via DATA-KONTRAKTOR-OAP</p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-amber-500 group-hover:border-amber-500 transition-colors">
                      <ChevronRight className="w-4 h-4 text-amber-500 group-hover:text-black transition-colors" />
                    </div>
                  </div>
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#111622] px-2 text-muted-foreground font-semibold tracking-wider">Akses Peran Pejabat</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4">
                  {roleConfig.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.role}
                        onClick={() => handleRoleClick(item.role as UserRole)}
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

      {/* SK-BASED PPK & PPTK ACCOUNT SELECTION / REGISTRATION MODAL */}
      {selectedRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg glass border border-white/10 rounded-2xl p-6 shadow-2xl relative bg-[#0f172a] text-white">
            <button 
              onClick={() => setSelectedRoleModal(null)} 
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-outfit text-white">
                  Pilih / Buat Akun Pejabat {selectedRoleModal}
                </h3>
                <p className="text-xs text-slate-400">
                  Daftarkan nama lengkap pejabat sesuai SK Penetapan Kepala Dinas PUPR
                </p>
              </div>
            </div>

            {showRegisterForm ? (
              // FORM BUAT AKUN BARU SESUAI SK
              <form onSubmit={handleRegisterNewAccount} className="space-y-4">
                <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-200">
                  ⚠️ Masukkan nama lengkap beserta gelar dan NIP sesuai SK Penetapan resmi.
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Nama Lengkap (Sesuai SK Penetapan) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Ir. Alexander Kambuaya, S.T., M.T."
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">NIP (18 Digit) *</label>
                    <input
                      type="text"
                      required
                      placeholder="19800510 200604 1 002"
                      value={regNip}
                      onChange={(e) => setRegNip(e.target.value)}
                      className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Peran Pejabat *</label>
                    <select
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="PPK" className="bg-slate-900 text-white">PPK (Pejabat Pembuat Komitmen)</option>
                      <option value="PPTK" className="bg-slate-900 text-white">PPTK (Pejabat Pelaksana Teknis)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Nomor SK Penetapan *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 800.1/20/SK-PPK/PUPR/2024"
                    value={regSkNumber}
                    onChange={(e) => setRegSkNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Bidang / Sub-Dinas</label>
                    <select
                      value={regBidang}
                      onChange={(e) => setRegBidang(e.target.value)}
                      className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="Bina Marga" className="bg-slate-900">Bina Marga</option>
                      <option value="Cipta Karya" className="bg-slate-900">Cipta Karya</option>
                      <option value="Sumber Daya Air" className="bg-slate-900">Sumber Daya Air</option>
                      <option value="Perumahan & Permukiman" className="bg-slate-900">Perumahan & Permukiman</option>
                      <option value="Bina Konstruksi" className="bg-slate-900">Bina Konstruksi</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Jabatan Kegiatan SK</label>
                    <input
                      type="text"
                      placeholder="e.g. PPK Pembangunan Jalan"
                      value={regJabatan}
                      onChange={(e) => setRegJabatan(e.target.value)}
                      className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="pt-3 flex gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowRegisterForm(false)} 
                    className="w-1/3 border-white/10 text-slate-300 hover:bg-white/5"
                  >
                    Batal
                  </Button>
                  <Button 
                    type="submit" 
                    className="w-2/3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                  >
                    Daftarkan Akun SK & Masuk
                  </Button>
                </div>
              </form>
            ) : (
              // LIST AKUN TERDAFTAR SESUAI SK
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Daftar Pejabat {selectedRoleModal} Terdaftar SK
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setRegRole(selectedRoleModal);
                      setShowRegisterForm(true);
                    }}
                    className="text-xs text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> + Buat Akun Baru
                  </Button>
                </div>

                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {getRegisteredAccounts(selectedRoleModal).map((acc) => (
                    <div
                      key={acc.id}
                      onClick={() => handleSelectUserAccount(acc)}
                      className="p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/50 cursor-pointer transition-all flex items-center justify-between group"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-white group-hover:text-cyan-300 transition-colors">
                            {acc.name}
                          </p>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                            {acc.bidang || "PUPR"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-mono">NIP: {acc.nip || "-"}</p>
                        <p className="text-[10px] text-amber-400/90 font-mono">SK: {acc.skNumber || "SK Penetapan Dinas PUPR"}</p>
                      </div>

                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-cyan-500 group-hover:border-cyan-500 text-cyan-400 group-hover:text-black transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  ))}

                  {getRegisteredAccounts(selectedRoleModal).length === 0 && (
                    <div className="p-6 text-center text-slate-400 text-xs bg-white/5 rounded-xl border border-white/10">
                      Belum ada akun {selectedRoleModal} terdaftar. Silakan klik <strong>+ Buat Akun Baru</strong> di atas.
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <Button
                    onClick={() => {
                      setRegRole(selectedRoleModal);
                      setShowRegisterForm(true);
                    }}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs py-2.5 rounded-xl shadow-lg"
                  >
                    + Daftarkan Akun Nama Lengkap Sesuai SK Penetapan Baru
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
