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
import { supabase } from "@/lib/supabase"; // Import client Supabase

const Projects = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  // Kita sesuaikan tipe data dengan yang ada di Supabase untuk sementara menggunakan any
  // Nanti Anda bisa membuat interface khusus untuk tipe Supabase jika diperlukan
  const [projects, setProjects] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fungsi untuk mengambil data dari Supabase
    const fetchProjects = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('sigap_pengawasan')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Gagal mengambil data dari Supabase:", error);
      } else {
        setProjects(data || []);
      }
      setLoading(false);
    };

    fetchProjects();
  }, []);

  const canCreateProject = user?.role === "ADMIN" || user?.role === "PPTK" || user?.role === "PPK";
  const canExportLaporanPPK = canCreateProject || user?.role === "PIMPINAN";

  // FILTER LOGIC
  const filteredProjects = projects.filter(p =>
    p.nama_proyek?.toLowerCase().includes(search.toLowerCase())
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
        const nilaiKontrak = p.nilai_kontrak || 0;

        return [
          idx + 1,
          p.nama_proyek || "-",
          p.lokasi || "-",
          p.penyedia_jasa || "-",
          "- / -", // p.contractNo / p.contractDate (nanti ditambahkan ke tabel)
          "- / -", // spmkNumber / spmkDate
          "-", // executionDuration
          nilaiKontrak,
          terbilang(nilaiKontrak) + " Rupiah",
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
          <div className="flex gap-2">
            {canExportLaporanPPK && (
              <Button onClick={handleExportLaporanPPK} variant="outline" className="border-green-600 text-green-700 hover:bg-green-50">
                <Save className="mr-2 h-4 w-4" />
                Export Laporan PPK
              </Button>
            )}
            {canCreateProject && (
              <Button onClick={() => navigate("/projects/create")} className="bg-primary">
                <Plus className="mr-2 h-4 w-4" />
                Buat Proyek Baru
              </Button>
            )}
          </div>
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
          {loading ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              Memuat data proyek...
            </div>
          ) : filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              id={project.id.toString()}
              name={project.nama_proyek || "Tanpa Nama"}
              location={project.lokasi || "-"}
              progress={project.progress_fisik || 0}
              startDate={project.tanggal_mulai || "-"}
              endDate={project.tanggal_selesai || "-"}
              status={project.status || "active"}
              budget={project.nilai_kontrak ? `Rp ${(project.nilai_kontrak / 1000000000).toFixed(1)}M` : "Rp 0"}
              spent="Rp 0"
              onExport={
                // Show for PPTK, ADMIN, PPK, PIMPINAN
                (user?.role === 'PPTK' || user?.role === 'ADMIN' || user?.role === 'PPK' || user?.role === 'PIMPINAN')
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
                        ["NAMA PAKET", ":", project.nama_proyek || "-"],
                        ["NOMOR KONTRAK", ":", "-"],
                        ["LOKASI", ":", project.lokasi || "-"],
                        ["KONTRAKTOR", ":", project.penyedia_jasa || "-"],
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

                      const fileName = project.nama_proyek ? project.nama_proyek.replace(/[^a-zA-Z0-9]/g, '_') : 'Proyek';
                      XLSX.writeFile(wb, `DKH_${fileName}.xlsx`);

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
