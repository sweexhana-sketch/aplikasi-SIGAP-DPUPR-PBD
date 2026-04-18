import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { storage, Project } from "@/lib/storage";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Printer, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useNavigate } from "react-router-dom";

const MonthlyReport = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>("");
    const [project, setProject] = useState<Project | null>(null);
    const [stats, setStats] = useState<any>(null);
    const [findings, setFindings] = useState<string[]>([]);
    const [sCurveData, setSCurveData] = useState<any[]>([]);

    // REDIRECT IF NOT AUTHORIZED ROLE
    useEffect(() => {
        if (user && user.role !== 'KONTRAKTOR_UMUM' && user.role !== 'KONSULTAN' && user.role !== 'KONTRAKTOR') {
            navigate('/reports', { replace: true });
        }
    }, [user, navigate]);

    // Default to Current Month
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const [startDate, setStartDate] = useState<string>(firstDay.toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState<string>(lastDay.toISOString().split('T')[0]);

    useEffect(() => {
        setProjects(storage.getProjects());
    }, []);

    useEffect(() => {
        if (selectedProjectId && startDate && endDate) {
            const p = storage.getProjectById(selectedProjectId) || null;
            setProject(p);
            if (p) {
                // Use the new Date-Range Analytics
                const s = new Date(startDate);
                const e = new Date(endDate);
                setStats(storage.getProjectAnalyticsByDate(p.id, s, e));
                setSCurveData(storage.getSCurveData(p.id));

                // Get findings from all reports for this project within range
                const reports = storage.getReports(p.id);
                const periodReports = reports.filter(r => {
                    const d = new Date(r.date);
                    return d >= s && d <= e;
                });

                const allFindings = periodReports
                    .filter(r => r.findings)
                    .map(r => `${r.date}: ${r.findings}`);
                setFindings(allFindings);
            }
        }
    }, [selectedProjectId, startDate, endDate]);

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
                        <h1 className="text-2xl font-bold text-slate-900">Cetak Laporan Bulanan</h1>
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
                                <h1 className="text-xl font-bold uppercase">Laporan Bulanan Kemajuan Pekerjaan</h1>
                                <p className="text-sm">Periode: {new Date(startDate).toLocaleDateString('id-ID')} - {new Date(endDate).toLocaleDateString('id-ID')}</p>
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
                            <h3 className="font-bold border-b border-black mb-2 pb-1">I. RINGKASAN PROGRES FISIK</h3>
                            <table className="w-full text-sm border-collapse border border-black">
                                <thead>
                                    <tr className="bg-slate-100">
                                        <th className="border border-black p-2 text-left">Uraian</th>
                                        <th className="border border-black p-2 text-right">Bulan Lalu (%)</th>
                                        <th className="border border-black p-2 text-right">Bulan Ini (%)</th>
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
                            <h3 className="font-bold border-b border-black mb-2 pb-1">II. REKAPITULASI ITEM PEKERJAAN</h3>
                            <table className="w-full text-xs border-collapse border border-black">
                                <thead>
                                    <tr className="bg-slate-100 text-center">
                                        <th className="border border-black p-1" rowSpan={2}>No</th>
                                        <th className="border border-black p-1" rowSpan={2}>Uraian Pekerjaan</th>
                                        <th className="border border-black p-1" rowSpan={2}>Sat</th>
                                        <th className="border border-black p-1" rowSpan={2}>Bobot (%)</th>
                                        <th className="border border-black p-1" colSpan={3}>Realisasi Fisik (Volume)</th>
                                    </tr>
                                    <tr className="bg-slate-100 text-center">
                                        <th className="border border-black p-1">Lalu</th>
                                        <th className="border border-black p-1">Ini</th>
                                        <th className="border border-black p-1">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.itemsStats.map((item: any, idx: number) => (
                                        <tr key={item.id}>
                                            <td className="border border-black p-1 text-center">{idx + 1}</td>
                                            <td className="border border-black p-1">{item.description}</td>
                                            <td className="border border-black p-1 text-center">{item.unit}</td>
                                            <td className="border border-black p-1 text-right">{item.weight?.toFixed(2)}</td>
                                            <td className="border border-black p-1 text-right">{item.prevVol.toLocaleString()}</td>
                                            <td className="border border-black p-1 text-right">{item.periodVol.toLocaleString()}</td>
                                            <td className="border border-black p-1 text-right">{item.cumVol.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* KURVA S */}
                        <div className="mb-8 page-break-inside-avoid">
                            <h3 className="font-bold border-b border-black mb-4 pb-1">III. KURVA S</h3>
                            <div className="h-[300px] border border-black p-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={sCurveData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="week" />
                                        <YAxis domain={[0, 100]} />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="planned" stroke="#2563eb" strokeWidth={2} name="Rencana" dot={false} />
                                        <Line type="monotone" dataKey="actual" stroke="#dc2626" strokeWidth={2} name="Realisasi" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* CATATAN TEMUAN */}
                        <div className="mb-8 page-break-inside-avoid">
                            <h3 className="font-bold border-b border-black mb-4 pb-1">IV. CATATAN / ISU UTAMA</h3>
                            <div className="border border-black p-4 min-h-[100px] text-sm">
                                {findings.length > 0 ? (
                                    <ul className="list-disc pl-4 space-y-1">
                                        {findings.map((f, i) => (
                                            <li key={i}>{f}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-slate-500 italic">Tidak ada isu krusial bulan ini.</p>
                                )}
                            </div>
                        </div>

                        {/* SIGNATURES */}
                        <div className="grid grid-cols-3 gap-8 mt-12 text-center text-sm page-break-inside-avoid">
                            <div>
                                <div className="mb-16">Dibuat Oleh,<br /><strong>Kontraktor Pelaksana</strong></div>
                                <div className="border-b border-black w-3/4 mx-auto"></div>
                                <div className="mt-1">General Superintendent</div>
                            </div>
                            <div>
                                <div className="mb-16">Diperiksa Oleh,<br /><strong>Konsultan Pengawas</strong></div>
                                <div className="border-b border-black w-3/4 mx-auto"></div>
                                <div className="mt-1">Site Engineer</div>
                            </div>
                            <div>
                                <div className="mb-16">Mengetahui,<br /><strong>Pejabat Pelaksana Teknis</strong></div>
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

export default MonthlyReport;
