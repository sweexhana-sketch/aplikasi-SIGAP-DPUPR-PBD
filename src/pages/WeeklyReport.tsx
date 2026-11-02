import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { storage, Project } from "@/lib/storage";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Printer, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

const WeeklyReport = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>("");
    const [project, setProject] = useState<Project | null>(null);
    const [stats, setStats] = useState<any>(null); // We will reuse the analytics logic but enhance it for specific week
    const [findings, setFindings] = useState<string[]>([]);
    const [photos, setPhotos] = useState<string[]>([]);

    // REDIRECT IF NOT AUTHORIZED ROLE
    useEffect(() => {
        if (user && user.role !== 'KONTRAKTOR_UMUM' && user.role !== 'KONSULTAN' && user.role !== 'KONTRAKTOR') {
            navigate('/reports', { replace: true });
        }
    }, [user, navigate]);

    // In a real app we'd select a specific week. 
    // For this demo, we assume "Laporan Minggu Ini" means "Current State" vs "Last Week"
    // But our getProjectAnalytics returns "Cumulative". 
    // We'll just display the Cumulative view as the "Weekly Report" for now.

    // Default to Current Week
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    const monday = new Date(today.setDate(diff));
    const nextSunday = new Date(today.setDate(diff + 6));

    const [startDate, setStartDate] = useState<string>(monday.toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState<string>(nextSunday.toISOString().split('T')[0]);

    // Load proyek dari Supabase
    useEffect(() => {
        const loadProjects = async () => {
            const { data, error } = await supabase
                .from('sigap_pengawasan')
                .select('*')
                .order('created_at', { ascending: false });
            if (error || !data) {
                setProjects(storage.getProjects());
            } else {
                setProjects(data.map((p: any) => ({
                    id: p.id,
                    name: p.nama_proyek,
                    location: p.lokasi,
                    fiscalYear: p.tahun_anggaran || '',
                    contractNo: p.nomor_kontrak || '',
                    contractDate: p.tanggal_kontrak || '',
                    hpsValue: p.hps || 0,
                    contractValue: p.nilai_kontrak || 0,
                    contractorName: p.penyedia_jasa || '',
                    startDate: p.tanggal_mulai || '',
                    endDate: p.tanggal_selesai || '',
                    dkhItems: [],
                })));
            }
        };
        loadProjects();
    }, []);

    useEffect(() => {
        if (selectedProjectId && startDate && endDate) {
            const loadDetail = async () => {
                // Load DKH items
                const { data: dkhData } = await supabase
                    .from('sigap_dkh_items')
                    .select('*')
                    .eq('project_id', selectedProjectId);
                const dkhItems = (dkhData || []).map((item: any) => ({
                    id: item.id,
                    projectId: item.project_id,
                    itemCode: item.item_code || '',
                    description: item.description || '',
                    unit: item.unit || '',
                    contractVol: item.contract_vol || 0,
                    unitPrice: item.unit_price || 0,
                    totalPrice: item.total_price || 0,
                    weight: item.weight || 0,
                }));
                const base = projects.find(p => p.id === selectedProjectId);
                const fullProject = base ? { ...base, dkhItems } : null;
                setProject(fullProject);

                if (fullProject && fullProject.contractValue > 0) {
                    // Load laporan dari Supabase dalam rentang tanggal
                    const s = new Date(startDate);
                    const e = new Date(endDate);

                    const { data: reportData } = await supabase
                        .from('sigap_daily_reports')
                        .select(`id, report_date, findings, photo_urls, sigap_daily_report_items(dkh_item_id, day_vol)`)
                        .eq('project_id', selectedProjectId);

                    const allReports = (reportData || []).map((r: any) => ({
                        id: r.id,
                        date: r.report_date,
                        findings: r.findings || '',
                        photoUrls: r.photo_urls || [],
                        items: (r.sigap_daily_report_items || []).map((it: any) => ({
                            dkhId: it.dkh_item_id, dayVol: it.day_vol
                        }))
                    }));

                    const periodReports = allReports.filter(r => {
                        const d = new Date(r.date);
                        return d >= s && d <= e;
                    });
                    const prevReports = allReports.filter(r => new Date(r.date) < s);

                    // Kalkulasi analitik periode
                    const periodVolMap: Record<string, number> = {};
                    const prevVolMap: Record<string, number> = {};
                    periodReports.forEach(r => r.items.forEach((it: any) => periodVolMap[it.dkhId] = (periodVolMap[it.dkhId] || 0) + it.dayVol));
                    prevReports.forEach(r => r.items.forEach((it: any) => prevVolMap[it.dkhId] = (prevVolMap[it.dkhId] || 0) + it.dayVol));

                    let periodVal = 0, prevVal = 0, cumVal = 0;
                    const itemsStats = dkhItems.map(item => {
                        const pVol = periodVolMap[item.id] || 0;
                        const prVol = prevVolMap[item.id] || 0;
                        const cVol = pVol + prVol;
                        const pV = pVol * item.unitPrice;
                        const prV = prVol * item.unitPrice;
                        const cV = cVol * item.unitPrice;
                        periodVal += pV; prevVal += prV; cumVal += cV;
                        return {
                            ...item,
                            periodVol: pVol, prevVol: prVol, cumVol: cVol,
                            periodPct: (pV / fullProject.contractValue) * 100,
                            prevPct: (prV / fullProject.contractValue) * 100,
                            cumPct: (cV / fullProject.contractValue) * 100,
                        };
                    });

                    const tStart = new Date(fullProject.startDate);
                    const tEnd = new Date(fullProject.endDate);
                    const totalDays = Math.max(1, (tEnd.getTime() - tStart.getTime()) / 86400000);
                    const plannedCum = Math.min(100, Math.max(0, (e.getTime() - tStart.getTime()) / 86400000 / totalDays * 100));
                    const plannedPrev = Math.min(100, Math.max(0, (s.getTime() - tStart.getTime()) / 86400000 / totalDays * 100));

                    setStats({
                        itemsStats,
                        periodProgress: (periodVal / fullProject.contractValue) * 100,
                        prevProgress: (prevVal / fullProject.contractValue) * 100,
                        overallProgress: (cumVal / fullProject.contractValue) * 100,
                        plannedPeriod: Math.max(0, plannedCum - plannedPrev),
                        plannedPrev,
                        plannedCum,
                        deviation: (cumVal / fullProject.contractValue) * 100 - plannedCum,
                    });

                    setFindings(periodReports.filter(r => r.findings).map(r => `${r.date}: ${r.findings}`));
                    const allPhotos: string[] = [];
                    periodReports.forEach(r => { if (r.photoUrls?.length > 0) allPhotos.push(...r.photoUrls); });
                    setPhotos(allPhotos);
                }
            };
            loadDetail();
        }
    }, [selectedProjectId, startDate, endDate, projects]);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-slate-100 pb-20 print:bg-white print:pb-0">
            <div className="print:hidden">
                <Header />
            </div>

            <section className="container py-8 max-w-[210mm] mx-auto print:p-0 print:max-w-none">

                {/* Controls */}
                <div className="mb-6 flex justify-between items-center print:hidden">
                    <div className="flex gap-4 items-center">
                        <h1 className="text-2xl font-bold text-slate-900">Cetak Laporan Mingguan</h1>
                        <Select onValueChange={setSelectedProjectId}>
                            <SelectTrigger className="w-[300px]">
                                <SelectValue placeholder="Pilih Proyek" />
                            </SelectTrigger>
                            <SelectContent>
                                {projects.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                className="border rounded px-2 py-1 text-sm bg-white"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                            <span>s/d</span>
                            <input
                                type="date"
                                className="border rounded px-2 py-1 text-sm bg-white"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>
                    <Button onClick={handlePrint} disabled={!project}>
                        <Printer className="mr-2 h-4 w-4" /> Cetak PDF
                    </Button>
                </div>

                {/* PAPER FORMAT */}
                {project && stats && (
                    <div className="bg-white p-8 shadow-sm min-h-[297mm] print:shadow-none print:p-8 border print:border-none text-black">

                        {/* KOP SURAT */}
                        <div className="border-b-2 border-black pb-4 mb-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <img src="/logo-pbd.png" alt="Logo" className="h-16 w-16" /> {/* Logo PBD */}
                                <div>
                                    <h2 className="text-lg font-bold uppercase">Dinas Pekerjaan Umum dan Perumahan Rakyat</h2>
                                    <p className="text-sm">Pemerintah Provinsi Papua Barat</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <h1 className="text-xl font-bold uppercase">Laporan Mingguan Kemajuan Pekerjaan</h1>
                                <p className="text-sm">Periode: {new Date().toLocaleDateString('id-ID')}</p>
                            </div>
                        </div>

                        {/* INFO PROYEK */}
                        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                            <div>
                                <div className="grid grid-cols-[140px_1fr]">
                                    <span className="font-semibold">Nama Paket</span>
                                    <span>: {project.name}</span>
                                </div>
                                <div className="grid grid-cols-[140px_1fr]">
                                    <span className="font-semibold">Nomor Kontrak</span>
                                    <span>: {project.contractNo}</span>
                                </div>
                                <div className="grid grid-cols-[140px_1fr]">
                                    <span className="font-semibold">Lokasi</span>
                                    <span>: {project.location}</span>
                                </div>
                            </div>
                            <div>
                                <div className="grid grid-cols-[140px_1fr]">
                                    <span className="font-semibold">Kontraktor</span>
                                    <span>: {project.contractorName}</span>
                                </div>
                                <div className="grid grid-cols-[140px_1fr]">
                                    <span className="font-semibold">Nilai Kontrak</span>
                                    <span>: Rp {project.contractValue.toLocaleString('id-ID')}</span>
                                </div>
                            </div>
                        </div>

                        {/* RINGKASAN PROGRESS */}
                        <div className="mb-8">
                            <h3 className="font-bold border-b border-black mb-2 pb-1">I. RINGKASAN PROGRES</h3>
                            <table className="w-full text-sm border-collapse border border-black">
                                <thead>
                                    <tr className="bg-slate-100">
                                        <th className="border border-black p-2 text-left">Uraian</th>
                                        <th className="border border-black p-2 text-right">Minggu Lalu (%)</th>
                                        <th className="border border-black p-2 text-right">Minggu Ini (%)</th>
                                        <th className="border border-black p-2 text-right">Total S/d Saat Ini (%)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="border border-black p-2">Rencana (Schedule)</td>
                                        <td className="border border-black p-2 text-right">{stats.plannedPrev?.toFixed(2) || "0.00"}</td>
                                        <td className="border border-black p-2 text-right">{stats.plannedPeriod?.toFixed(2) || "0.00"}</td>
                                        <td className="border border-black p-2 text-right">{stats.plannedCum?.toFixed(2) || "0.00"}</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-black p-2">Realisasi (Fisik)</td>
                                        <td className="border border-black p-2 text-right">{stats.prevProgress?.toFixed(2) || "0.00"}</td>
                                        <td className="border border-black p-2 text-right">{stats.periodProgress?.toFixed(2) || "0.00"}</td>
                                        <td className="border border-black p-2 text-right">{stats.overallProgress?.toFixed(2) || "0.00"}</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-black p-2 font-bold">Deviasi</td>
                                        <td className="border border-black p-2 text-right"></td>
                                        <td className="border border-black p-2 text-right"></td>
                                        <td className={`border border-black p-2 text-right font-bold ${stats.deviation < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                            {stats.deviation.toFixed(2)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* DETAIL PER ITEM */}
                        <div className="mb-8">
                            <h3 className="font-bold border-b border-black mb-2 pb-1">II. DETAIL ITEM PEKERJAAN</h3>
                            <table className="w-full text-xs border-collapse border border-black">
                                <thead>
                                    <tr className="bg-slate-100 text-center">
                                        <th className="border border-black p-1" rowSpan={2}>No</th>
                                        <th className="border border-black p-1" rowSpan={2}>Uraian Pekerjaan</th>
                                        <th className="border border-black p-1" rowSpan={2}>Sat</th>
                                        <th className="border border-black p-1" rowSpan={2}>Vol Kontrak</th>
                                        <th className="border border-black p-1" rowSpan={2}>Bobot (%)</th>
                                        <th className="border border-black p-1" colSpan={2}>Realisasi</th>
                                    </tr>
                                    <tr className="bg-slate-100 text-center">
                                        <th className="border border-black p-1">Volume</th>
                                        <th className="border border-black p-1">Bobot (%)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.itemsStats.map((item: any, idx: number) => (
                                        <tr key={item.id}>
                                            <td className="border border-black p-1 text-center">{idx + 1}</td>
                                            <td className="border border-black p-1">{item.description}</td>
                                            <td className="border border-black p-1 text-center">{item.unit}</td>
                                            <td className="border border-black p-1 text-right">{item.contractVol}</td>
                                            <td className="border border-black p-1 text-right">{item.weight?.toFixed(2)}</td>
                                            <td className="border border-black p-1 text-right">{item.volReal}</td>
                                            <td className="border border-black p-1 text-right">{(item.progressPercent * (item.weight || 0) / 100).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* DOKUMENTASI VISUAL */}
                        <div className="mb-8 page-break-inside-avoid">
                            <h3 className="font-bold border-b border-black mb-4 pb-1">III. DOKUMENTASI & CUACA</h3>
                            {photos.length > 0 ? (
                                <div className="grid grid-cols-2 gap-4">
                                    {photos.slice(0, 4).map((url, idx) => (
                                        <div key={idx} className="border border-slate-300 h-48 overflow-hidden flex items-center justify-center bg-slate-50 break-inside-avoid">
                                            <img src={url} alt={`Dokumentasi Minggu Ini ${idx + 1}`} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="border border-slate-300 h-40 flex items-center justify-center bg-slate-50">
                                    <span className="text-slate-400 text-xs">Belum ada foto dokumentasi minggu ini</span>
                                </div>
                            )}
                            <div className="mt-4 text-sm">
                                <p><strong>Ringkasan Cuaca:</strong> Cerah (4 Hari), Hujan (1 Hari).</p>
                                <p><strong>Tenaga Kerja Rata-rata:</strong> 15 Orang.</p>
                            </div>
                        </div>

                        {/* CATATAN TEMUAN */}
                        <div className="mb-8 page-break-inside-avoid">
                            <h3 className="font-bold border-b border-black mb-4 pb-1">IV. CATATAN / TEMUAN LAPANGAN</h3>
                            <div className="border border-black p-4 min-h-[100px] text-sm">
                                {findings.length > 0 ? (
                                    <ul className="list-disc pl-4 space-y-1">
                                        {findings.map((f, i) => (
                                            <li key={i}>{f}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-slate-500 italic">Tidak ada catatan khusus minggu ini.</p>
                                )}
                            </div>
                        </div>

                        {/* SIGNATURES */}
                        <div className="grid grid-cols-3 gap-8 mt-12 text-center text-sm page-break-inside-avoid">
                            <div>
                                <div className="mb-16">Dibuat Oleh,<br /><strong>Kontraktor Pelaksana</strong></div>
                                <div className="border-b border-black w-3/4 mx-auto"></div>
                                <div className="mt-1">Site Manager</div>
                            </div>
                            <div>
                                <div className="mb-16">Diperiksa Oleh,<br /><strong>Konsultan Pengawas</strong></div>
                                <div className="border-b border-black w-3/4 mx-auto"></div>
                                <div className="mt-1">Inspector</div>
                            </div>
                            <div>
                                <div className="mb-16">Disetujui Oleh,<br /><strong>Pejabat Pelaksana Teknis</strong></div>
                                <div className="border-b border-black w-3/4 mx-auto"></div>
                                <div className="mt-1">PPTK</div>
                            </div>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
};

export default WeeklyReport;
