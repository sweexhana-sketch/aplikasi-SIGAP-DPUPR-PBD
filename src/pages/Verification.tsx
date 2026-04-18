import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import { storage, Project, DailyReport } from "@/lib/storage";
import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Eye, Calendar, User, Clock, Printer, FileText } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const Verification = () => {
    const { user } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [reports, setReports] = useState<DailyReport[]>([]);
    const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    useEffect(() => {
        setProjects(storage.getProjects());
        // In real app, we would fetch ALL reports or filter by assignment
        // For mock, we iterate all projects and get reports
        const allProjects = storage.getProjects();
        let allReports: DailyReport[] = [];
        allProjects.forEach(p => {
            const projReports = storage.getReports(p.id);
            allReports = [...allReports, ...projReports];
        });
        // Sort by date desc
        setReports(allReports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }, []);

    const handleVerify = (reportId: string) => {
        // In a real app we would call an API
        // Here we need to update the local storage. 
        // Since our storage helper is simple, we might need a dedicated 'updateReport' method or just hack it.

        // Hack for mock storage update:
        const data = localStorage.getItem("sipro_reports_v1");
        if (data) {
            let all: DailyReport[] = JSON.parse(data);
            all = all.map(r => r.id === reportId ? { ...r, isVerified: true } : r);
            localStorage.setItem("sipro_reports_v1", JSON.stringify(all));

            // Update local state
            setReports(prev => prev.map(r => r.id === reportId ? { ...r, isVerified: true } : r));
            toast.success("Laporan berhasil diverifikasi");
        }
    };

    const handlePreview = (report: DailyReport) => {
        toast.info("Memuat detail laporan...");
        try {
            let project = projects.find(p => p.id === report.projectId);

            // Fallback: try to get from storage if not in current state
            if (!project) {
                project = storage.getProjectById(report.projectId);
            }

            if (!project) {
                toast.error("Data proyek tidak ditemukan for ID: " + report.projectId);
                return;
            }

            setSelectedReport(report);
            setSelectedProject(project);
            setIsPreviewOpen(true);
        } catch (error) {
            console.error(error);
            toast.error("Gagal membuka detail: " + error);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const getProjectName = (id: string) => projects.find(p => p.id === id)?.name || "Unknown";

    if (user?.role !== "PPK" && user?.role !== "STAF_DINAS" && user?.role !== "ADMIN" && user?.role !== "PPTK") {
        return <div className="p-10 text-center">Akses Khusus Verifikator (PPK/PPTK/Staf)</div>;
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            <Header />
            <section className="container py-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-slate-900">Verifikasi Laporan Lapangan</h1>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Daftar Laporan Masuk</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Proyek</TableHead>
                                    <TableHead>Cuaca / TK</TableHead>
                                    <TableHead>Jml Item</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reports.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            Belum ada laporan masuk.
                                            <br />
                                            <span className="text-xs">Pastikan Staf Dinas telah menginput laporan harian.</span>
                                        </TableCell>
                                    </TableRow>
                                )}
                                {reports.map((report) => (
                                    <TableRow key={report.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-slate-400" />
                                                {report.date}
                                            </div>
                                        </TableCell>
                                        <TableCell>{getProjectName(report.projectId)}</TableCell>
                                        <TableCell>
                                            <div className="text-xs">
                                                <div>{report.weather}</div>
                                                <div className="text-muted-foreground">{report.manpower} Personil</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{report.items.length} Item Pekerjaan</TableCell>
                                        <TableCell>
                                            {report.isVerified ? (
                                                <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
                                                    <CheckCircle className="w-3 h-3 mr-1" /> Terverifikasi
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200">
                                                    <Clock className="w-3 h-3 mr-1" /> Menunggu
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button variant="outline" size="sm" onClick={() => handlePreview(report)}>
                                                <Eye className="h-4 w-4 mr-1" /> Detail
                                            </Button>
                                            {!report.isVerified && (
                                                <Button size="sm" onClick={() => handleVerify(report.id)} className="bg-blue-600 hover:bg-blue-700">
                                                    Setujui
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </section>

            {/* PREVIEW MODAL - Custom Implementation */}
            {isPreviewOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 print:bg-white" onClick={() => setIsPreviewOpen(false)}>
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] flex flex-col print:max-w-none print:max-h-none print:shadow-none" onClick={(e) => e.stopPropagation()}>
                        {/* Header with Controls */}
                        <div className="print:hidden border-b p-4 flex-shrink-0">
                            <h2 className="text-xl font-bold mb-4">Preview Laporan Pengawasan</h2>
                            <div className="flex gap-2">
                                <Button onClick={handlePrint} className="flex-1">
                                    <Printer className="mr-2 h-4 w-4" /> Cetak Laporan
                                </Button>
                                <Button variant="outline" onClick={() => setIsPreviewOpen(false)} className="flex-1">
                                    Tutup
                                </Button>
                            </div>
                        </div>

                        {/* Scrollable Content */}
                        <div className="overflow-y-auto flex-1 print:overflow-visible">
                            {selectedReport && selectedProject ? (
                                <div className="bg-white p-8 text-black">
                                    {/* KOP SURAT */}
                                    <div className="border-b-2 border-black pb-4 mb-6 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <img src="/logo-pbd.png" alt="Logo" className="h-16 w-16" />
                                            <div>
                                                <h2 className="text-lg font-bold uppercase">Dinas Pekerjaan Umum dan Perumahan Rakyat</h2>
                                                <p className="text-sm">Pemerintah Provinsi Papua Barat Daya</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <h1 className="text-xl font-bold uppercase">Laporan Pengawasan Lapangan</h1>
                                            <p className="text-sm">Tanggal: {new Date(selectedReport.date).toLocaleDateString('id-ID')}</p>
                                        </div>
                                    </div>

                                    {/* INFO PROYEK */}
                                    <div className="mb-6 text-sm">
                                        <h3 className="font-bold border-b border-black mb-2 pb-1">I. INFORMASI PROYEK</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <div className="grid grid-cols-[140px_1fr]">
                                                    <span className="font-semibold">Nama Paket</span>
                                                    <span>: {selectedProject.name}</span>
                                                </div>
                                                <div className="grid grid-cols-[140px_1fr]">
                                                    <span className="font-semibold">Nomor Kontrak</span>
                                                    <span>: {selectedProject.contractNo}</span>
                                                </div>
                                                <div className="grid grid-cols-[140px_1fr]">
                                                    <span className="font-semibold">Lokasi</span>
                                                    <span>: {selectedProject.location}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="grid grid-cols-[140px_1fr]">
                                                    <span className="font-semibold">Kontraktor</span>
                                                    <span>: {selectedProject.contractorName}</span>
                                                </div>
                                                <div className="grid grid-cols-[140px_1fr]">
                                                    <span className="font-semibold">Nilai Kontrak</span>
                                                    <span>: Rp {selectedProject.contractValue.toLocaleString('id-ID')}</span>
                                                </div>
                                                <div className="grid grid-cols-[140px_1fr]">
                                                    <span className="font-semibold">Koordinat GPS</span>
                                                    <span>: {selectedReport.coords}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* KONDISI LAPANGAN */}
                                    <div className="mb-6 text-sm">
                                        <h3 className="font-bold border-b border-black mb-2 pb-1">II. KONDISI LAPANGAN</h3>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="grid grid-cols-[100px_1fr]">
                                                <span className="font-semibold">Cuaca</span>
                                                <span>: {selectedReport.weather}</span>
                                            </div>
                                            <div className="grid grid-cols-[100px_1fr]">
                                                <span className="font-semibold">Tenaga Kerja</span>
                                                <span>: {selectedReport.manpower} Orang</span>
                                            </div>
                                            <div className="grid grid-cols-[100px_1fr]">
                                                <span className="font-semibold">Status</span>
                                                <span>: {selectedReport.isVerified ? 'Terverifikasi' : 'Menunggu Verifikasi'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* DETAIL PEKERJAAN */}
                                    <div className="mb-6">
                                        <h3 className="font-bold border-b border-black mb-2 pb-1 text-sm">III. DETAIL PEKERJAAN HARI INI</h3>
                                        <table className="w-full text-xs border-collapse border border-black">
                                            <thead>
                                                <tr className="bg-slate-100">
                                                    <th className="border border-black p-2 text-left">No</th>
                                                    <th className="border border-black p-2 text-left">Uraian Pekerjaan</th>
                                                    <th className="border border-black p-2 text-right">Volume Hari Ini</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedReport.items.map((item, idx) => {
                                                    const dkhItem = selectedProject.dkhItems.find(d => d.id === item.dkhId);
                                                    return (
                                                        <tr key={item.dkhId}>
                                                            <td className="border border-black p-2 text-center">{idx + 1}</td>
                                                            <td className="border border-black p-2">
                                                                <div className="font-medium">{dkhItem?.description || 'Unknown'}</div>
                                                                <div className="text-[10px] text-muted-foreground">{dkhItem?.itemCode}</div>
                                                            </td>
                                                            <td className="border border-black p-2 text-right">
                                                                {item.dayVol.toLocaleString('id-ID')} {dkhItem?.unit}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* DOKUMENTASI */}
                                    <div className="mb-6">
                                        <h3 className="font-bold border-b border-black mb-2 pb-1 text-sm">IV. DOKUMENTASI FOTO</h3>
                                        {(() => {
                                            const photos = selectedReport.photoUrls && selectedReport.photoUrls.length > 0
                                                ? selectedReport.photoUrls
                                                : (selectedReport.photoUrl && selectedReport.photoUrl !== "https://placehold.co/600x400?text=No+Image" ? [selectedReport.photoUrl] : []);

                                            if (photos.length > 0) {
                                                return (
                                                    <div className="grid grid-cols-2 gap-4">
                                                        {photos.map((url, idx) => (
                                                            <div key={idx} className="border border-slate-300 overflow-hidden break-inside-avoid">
                                                                <img src={url} alt={`Dokumentasi ${idx + 1}`} className="w-full h-48 object-cover" />
                                                                <div className="bg-slate-100 p-2 text-[10px]">
                                                                    <p><strong>Lokasi:</strong> {selectedReport.coords}</p>
                                                                    <p><strong>Waktu:</strong> {new Date(selectedReport.date).toLocaleDateString('id-ID')}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div className="border border-slate-300 h-40 flex items-center justify-center bg-slate-50">
                                                    <span className="text-slate-400 text-xs">Tidak ada foto dokumentasi</span>
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    {/* CATATAN */}
                                    <div className="mb-8">
                                        <h3 className="font-bold border-b border-black mb-2 pb-1 text-sm">V. CATATAN / TEMUAN LAPANGAN</h3>
                                        <div className="border border-black p-4 min-h-[80px] text-sm">
                                            {selectedReport.findings ? (
                                                <p>{selectedReport.findings}</p>
                                            ) : (
                                                <p className="text-slate-500 italic">Tidak ada catatan khusus</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* SIGNATURES */}
                                    <div className="grid grid-cols-3 gap-8 mt-12 text-center text-sm">
                                        <div>
                                            <div className="mb-16">Dilaporkan Oleh,<br /><strong>Staf Dinas / Pengawas</strong></div>
                                            <div className="border-b border-black w-3/4 mx-auto"></div>
                                            <div className="mt-1">{user?.name || 'Staf Dinas'}</div>
                                        </div>
                                        <div>
                                            <div className="mb-16">Diperiksa Oleh,<br /><strong>Pejabat Pelaksana Teknis</strong></div>
                                            <div className="border-b border-black w-3/4 mx-auto"></div>
                                            <div className="mt-1">PPTK</div>
                                        </div>
                                        <div>
                                            <div className="mb-16">Mengetahui,<br /><strong>Pejabat Pembuat Komitmen</strong></div>
                                            <div className="border-b border-black w-3/4 mx-auto"></div>
                                            <div className="mt-1">PPK</div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-8 text-center text-slate-500">
                                    <p>Tidak ada data laporan yang dipilih.</p>
                                    <p className="text-sm mt-2">Silakan klik tombol Preview pada laporan di tabel.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Verification;
