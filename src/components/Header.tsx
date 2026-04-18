import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, LogOut, Download, LayoutDashboard, FolderOpen, FileBarChart, Map, ShieldCheck, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { storage } from "@/lib/storage";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/projects", label: "Proyek", icon: FolderOpen },
    { path: "/reports", label: "Laporan", icon: FileBarChart },
    { path: "/webgis", label: "WebGIS", icon: Map },
  ];

  const canVerify = user?.role === "PPK" || user?.role === "STAF_DINAS" || user?.role === "ADMIN" || user?.role === "PPTK";
  const canIntegrate = user?.role === "ADMIN";

  const handleBackup = () => {
    import("@/lib/storage").then(({ storage }) => {
      const json = storage.exportDatabase();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sipro_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      ADMIN: "from-red-500 to-orange-500",
      PPK: "from-purple-500 to-blue-500",
      PPTK: "from-blue-500 to-cyan-500",
      STAF_DINAS: "from-cyan-500 to-teal-500",
      KONTRAKTOR_UMUM: "from-green-500 to-emerald-500",
      KONSULTAN: "from-yellow-500 to-orange-500",
      KONTRAKTOR: "from-pink-500 to-rose-500",
    };
    return colors[role] || "from-blue-500 to-purple-500";
  };

  const getRoleBadge = (role: string) => {
    const labels: Record<string, string> = {
      ADMIN: "Admin", PPK: "PPK", PPTK: "PPTK",
      STAF_DINAS: "Staf", KONTRAKTOR_UMUM: "K. Umum",
      KONSULTAN: "Konsultan", KONTRAKTOR: "Kontraktor",
    };
    return labels[role] || role;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 glass shadow-lg">
      <div className="container flex h-16 items-center justify-between gap-4">

        {/* Logo + Brand */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="relative">
            <img src="/logo-pbd.png" alt="Logo Pemerintah Provinsi Papua Barat Daya" className="h-10 w-10 rounded-full ring-2 ring-primary/30" />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-background animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-xl font-black tracking-tight font-outfit gradient-text">SI PRO</span>
              <span className="text-[10px] font-semibold bg-primary/20 text-primary px-1.5 py-0.5 rounded-full border border-primary/30 ml-1">v2.0</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-none hidden sm:block">Sistem Informasi Proyek PUPR Papua Barat Daya</p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
                  active
                    ? "text-primary bg-primary/10 shadow-sm shadow-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
                {active && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}

          {canVerify && (
            <Link
              to="/verification"
              className={cn(
                "relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
                location.pathname === "/verification"
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Verifikasi
              {location.pathname === "/verification" && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-primary" />
              )}
            </Link>
          )}

          {canIntegrate && (
            <Link
              to="/integration"
              className={cn(
                "relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
                location.pathname === "/integration"
                  ? "text-accent bg-accent/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              <Link2 className="h-3.5 w-3.5" />
              Integrasi OAP
              {location.pathname === "/integration" && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-accent" />
              )}
            </Link>
          )}
        </nav>

        {/* User Section */}
        <div className="hidden md:flex items-center gap-2 flex-shrink-0">
          {/* User Badge */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/8">
            <div className={cn("w-7 h-7 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-xs font-bold flex-shrink-0", getRoleColor(user?.role || ""))}>
              {user?.name?.[0] || "U"}
            </div>
            <div className="hidden lg:block">
              <p className="text-xs font-semibold leading-none text-foreground">{user?.name?.split(" ")[0]}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{getRoleBadge(user?.role || "")}</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackup}
            className="h-8 px-2 text-muted-foreground hover:text-foreground hover:bg-white/5"
            title="Backup Data"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="h-8 px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            title="Keluar"
          >
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Mobile Menu */}
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/5">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="glass border-white/10 w-72">
            {/* Mobile User Info */}
            <div className="flex items-center gap-3 p-4 mb-6 rounded-xl bg-white/5 border border-white/10">
              <div className={cn("w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold", getRoleColor(user?.role || ""))}>
                {user?.name?.[0] || "U"}
              </div>
              <div>
                <p className="font-semibold text-sm">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{getRoleBadge(user?.role || "")}</p>
              </div>
            </div>

            <nav className="flex flex-col gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                      active ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
              {canVerify && (
                <Link to="/verification" className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all", location.pathname === "/verification" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-white/5")}>
                  <ShieldCheck className="h-4 w-4" />Verifikasi
                </Link>
              )}
              {canIntegrate && (
                <Link to="/integration" className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all", location.pathname === "/integration" ? "text-accent bg-accent/10" : "text-muted-foreground hover:text-foreground hover:bg-white/5")}>
                  <Link2 className="h-4 w-4" />Integrasi OAP
                </Link>
              )}
            </nav>

            <div className="mt-6 pt-4 border-t border-white/10 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 border-white/10 bg-white/5 hover:bg-white/10" onClick={handleBackup}>
                <Download className="h-3.5 w-3.5 mr-1.5" /> Backup
              </Button>
              <Button variant="outline" size="sm" className="flex-1 border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20" onClick={logout}>
                <LogOut className="h-3.5 w-3.5 mr-1.5" /> Keluar
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

export default Header;
