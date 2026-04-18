import Header from "@/components/Header";
import ProjectCard from "@/components/ProjectCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Save } from "lucide-react";
import { storage, Project } from "@/lib/storage";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Edit } from "lucide-react";

const Projects = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    // Load projects from storage
    const data = storage.getProjects();
    setProjects(data);
  }, []);

  const canCreateProject = user?.role === "ADMIN" || user?.role === "PPTK" || user?.role === "PPK";

  // FILTER LOGIC
  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleExportLaporanPPK = async () => {
    try {
      const XLSX = await import("xlsx");
      const { terbilang } = await import("@/lib/terbilang");

      // HEADER KOP SURAT (Simplified for CSV/Excel data export)
      // Row 1-16 skipped usually, so we start at row 17 equivalent

      const headers = [
        "NO", "URAIAN/KEGIATAN/PAKET PEKERJAAN", "LOKASI PEKERJAAN", "NAMA PENYEDIA/ PELAKSANA",
        "NOMOR DAN TANGGAL KONTRAK/SPK", "NOMOR DAN TANGGAL SPMK", "JANGKA WAKTU PELAKSANAAN",
        "NILAI KONTRAK", "TERBILANG", "KETERANGAN"
      ];

      const dataRows = filteredProjects.map((p, idx) => {
        const ppn = p.contractValue - (p.contractValue / 1.11); // If stored inclusive
        // Or if stored inclusive, just use it. CreateProject saves inclusive.

        return [
          idx + 1,
          p.name,
          p.location,
          p.contractorName,
          `${p.contractNo} / ${p.contractDate}`,
          `${p.spmkNumber || '-'} / ${p.spmkDate || '-'}`,
          p.executionDuration || '-',
          p.contractValue,
          terbilang(p.contractValue) + " Rupiah",
          ""
        ];
      });

      const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "DATA KONTRAK");
      XLSX.writeFile(wb, "FORM_LAP_PPK_DATA_KONTRAK.xlsx");

    } catch (err) {
      console.error(err);
      alert("Gagal export Laporan PPK");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="container py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Daftar Proyek</h1>
            <p className="text-muted-foreground">Kelola dan monitor semua proyek PUPR Papua Barat</p>
          </div>
          {canCreateProject && (
            <div className="flex gap-2">
              <Button onClick={handleExportLaporanPPK} variant="outline" className="border-green-600 text-green-700 hover:bg-green-50">
                <Save className="mr-2 h-4 w-4" />
                Export Laporan PPK
              </Button>
              <Button onClick={() => navigate("/projects/create")} className="bg-primary">
                <Plus className="mr-2 h-4 w-4" />
                Buat Proyek Baru
              </Button>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari proyek..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            // Adapting the Project Interface to the Card Props
            <ProjectCard
              key={project.id}
              id={project.id}
              name={project.name}
              location={project.location}
              progress={0} // Default for now
              startDate={project.startDate}
              endDate={project.endDate}
              status="active"
              budget={`Rp ${(project.contractValue / 1000000000).toFixed(1)}M`}
              spent="Rp 0"
              onExport={
                // Only show for PPTK, ADMIN, PPK (Authorized roles)
                (user?.role === 'PPTK' || user?.role === 'ADMIN' || user?.role === 'PPK')
                  ? async () => {
                    try {
                      const XLSX = await import("xlsx");

                      // Prepare Header Info
                      const headerInfo = [
                        ["PEMERINTAH PROVINSI PAPUA BARAT DAYA"],
                        ["DINAS PEKERJAAN UMUM DAN PERUMAHAN RAKYAT"],
                        [""],
                        ["DAFTAR KUANTITAS DAN HARGA (BOQ)"],
                        [""],
                        ["NAMA PAKET", ":", project.name],
                        ["NOMOR KONTRAK", ":", project.contractNo],
                        ["LOKASI", ":", project.location],
                        ["KONTRAKTOR", ":", project.contractorName],
                        [""],
                        ["NO", "ITEM PEKERJAAN", "SATUAN", "VOLUME", "HARGA SATUAN", "JUMLAH HARGA"]
                      ];

                      // Prepare Items Data
                      const itemsData = (project.dkhItems || []).map((item, idx) => [
                        idx + 1,
                        item.description,
                        item.unit,
                        item.contractVol,
                        item.unitPrice,
                        item.totalPrice
                      ]);

                      // Calculate Breakdown
                      const subtotal = (project.dkhItems || []).reduce((sum, item) => sum + (item.totalPrice || 0), 0);
                      const ppn = subtotal * 0.11;
                      const total = subtotal + ppn;

                      // Total Rows
                      const footerRows = [
                        ["", "", "", "", "JUMLAH HARGA", subtotal],
                        ["", "", "", "", "PPN 11%", ppn],
                        ["", "", "", "", "TOTAL HPS", total]
                      ];

                      // Create Worksheet
                      const ws = XLSX.utils.aoa_to_sheet([...headerInfo, ...itemsData, [], ...footerRows]);

                      // Set Column Widths (optional simple visual fix)
                      ws['!cols'] = [
                        { wch: 5 },  // No
                        { wch: 50 }, // Desc
                        { wch: 10 }, // Unit
                        { wch: 15 }, // Vol
                        { wch: 20 }, // Price
                        { wch: 25 }, // Total
                      ];

                      const wb = XLSX.utils.book_new();
                      XLSX.utils.book_append_sheet(wb, ws, "RAB_DKH");

                      XLSX.writeFile(wb, `DKH_${project.name.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);

                    } catch (err) {
                      console.error(err);
                      // Using console error as simple fallback if toast not imported or just standard alert
                      alert("Gagal export Excel");
                    }
                  }
                  : undefined
              }
              onManage={() => navigate(`/projects/${project.id}/manage`)}
            />
          ))}
          {filteredProjects.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              Belum ada proyek yang ditemukan.
            </div>
          )}
        </div>
      </section >
    </div >
  );
};

export default Projects;
