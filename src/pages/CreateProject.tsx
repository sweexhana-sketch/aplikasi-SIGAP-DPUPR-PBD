import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState, useEffect, useRef } from "react";
import { DKHMaster, storage, Project } from "@/lib/storage";
import { useNavigate } from "react-router-dom";
import { Trash2, Plus, Save, Building2, ChevronDown, Search, RefreshCw, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MOCK_USERS } from "@/context/AuthContext";
import { integrationService, type OAPContractor } from "@/lib/integrationService";

const CreateProject = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    // ── OAP Contractor Dropdown State ──────────────────────────
    const [oapContractors, setOapContractors] = useState<OAPContractor[]>([]);
    const [contractorSearch, setContractorSearch] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Load data OAP dari localStorage (diisi oleh Admin via Integrasi OAP)
    useEffect(() => {
        const cached = integrationService.getLocalContractors();
        setOapContractors(cached);
    }, []);

    // Tutup dropdown saat klik di luar
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Filter daftar kontraktor berdasar pencarian
    const filteredOapContractors = oapContractors.filter(c =>
        !contractorSearch ||
        c.name?.toLowerCase().includes(contractorSearch.toLowerCase()) ||
        c.companyType?.toLowerCase().includes(contractorSearch.toLowerCase())
    );

    const handleSelectContractor = (contractor: OAPContractor) => {
        handleContractChange("contractorName", contractor.name);
        setContractorSearch(contractor.name);
        setShowDropdown(false);
    };
    // ──────────────────────────────────────────────────────────

    // Section 1: Contract Data
    const [contractData, setContractData] = useState({
        name: "",
        location: "",
        fiscalYear: new Date().getFullYear().toString(),
        contractNo: "",
        contractDate: "",
        hpsValue: 0,
        contractValue: 0,
        contractorName: "",
        startDate: "",
        endDate: "",
        spmkNumber: "",
        spmkDate: "",
        executionDuration: "", // e.g., "120 Hari Kalender"
    });

    // Section 2: DKH (BoQ) Data
    const [items, setItems] = useState<DKHMaster[]>([
        {
            id: "1", projectId: "", itemCode: "", description: "",
            unit: "ls", contractVol: 1, unitPrice: 0, totalPrice: 0
        }
    ]);


    // --- AUTO SAVE LOGIC ---
    useEffect(() => {
        // Load draft on mount
        const savedDraft = localStorage.getItem("create_project_draft");
        if (savedDraft) {
            try {
                const { contract, items: savedItems } = JSON.parse(savedDraft);
                if (contract) setContractData(contract);
                if (savedItems) setItems(savedItems);
                toast.info("Draft proyek yang belum disimpan berhasil dipulihkan.");
            } catch (e) {
                console.error("Failed to load draft", e);
            }
        }
    }, []);

    useEffect(() => {
        // Save draft on change
        const timer = setTimeout(() => {
            if (contractData.name || items.length > 1 || items[0].totalPrice > 0) {
                const draft = {
                    contract: contractData,
                    items: items
                };
                localStorage.setItem("create_project_draft", JSON.stringify(draft));
            }
        }, 1000); // Debounce 1s

        return () => clearTimeout(timer);
    }, [contractData, items]);

    const handleContractChange = (field: string, value: any) => {
        setContractData(prev => ({ ...prev, [field]: value }));
    };

    const handleItemChange = (id: string, field: keyof DKHMaster, value: any) => {
        setItems(prev => prev.map(item => {
            if (item.id !== id) return item;

            const updates = { ...item, [field]: value };
            if (field === 'contractVol' || field === 'unitPrice') {
                const vol = field === 'contractVol' ? Number(value) : Number(item.contractVol);
                const price = field === 'unitPrice' ? Number(value) : Number(item.unitPrice);
                updates.totalPrice = vol * price;
            }
            return updates;
        }));
    };

    const addItem = () => {
        setItems(prev => [
            ...prev,
            {
                id: Date.now().toString(), projectId: "", itemCode: "",
                description: "", unit: "", contractVol: 0, unitPrice: 0, totalPrice: 0
            }
        ]);
    };

    const removeItem = (id: string) => {
        setItems(prev => prev.filter(i => i.id !== id));
    };

    // EXCEL HANDLERS
    const handleDownloadTemplate = async () => {
        try {
            const XLSX = await import("xlsx");
            const ws = XLSX.utils.json_to_sheet([
                { "Kode": "DIV.1", "Uraian Pekerjaan": "Mobilisasi", "Satuan": "LS", "Volume": 1, "Harga Satuan": 5000000 },
                { "Kode": "DIV.2", "Uraian Pekerjaan": "Galian Tanah", "Satuan": "M3", "Volume": 100, "Harga Satuan": 75000 },
            ]);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Template DKH");
            XLSX.writeFile(wb, "Template_DKH.xlsx");
        } catch (error) {
            console.error(error);
            toast.error("Gagal download template");
        }
    };

    const handleExportExcel = async () => {
        if (items.length === 0) {
            toast.error("Tidak ada data DKH untuk diexport");
            return;
        }

        try {
            const XLSX = await import("xlsx");
            const exportData = items.map((item, index) => ({
                "No": index + 1,
                "Kode": item.itemCode,
                "Uraian Pekerjaan": item.description,
                "Satuan": item.unit,
                "Volume": item.contractVol,
                "Harga Satuan": item.unitPrice,
                "Jumlah Harga": item.totalPrice
            }));

            // Calculate totals
            const subtotal = items.reduce((sum, i) => sum + (i.totalPrice || 0), 0);
            const ppn = subtotal * 0.11;
            const total = subtotal + ppn;

            // Append Footer
            exportData.push(
                { "No": "", "Kode": "", "Uraian Pekerjaan": "Subtotal", "Satuan": "", "Volume": 0, "Harga Satuan": 0, "Jumlah Harga": subtotal },
                { "No": "", "Kode": "", "Uraian Pekerjaan": "PPN 11%", "Satuan": "", "Volume": 0, "Harga Satuan": 0, "Jumlah Harga": ppn },
                { "No": "", "Kode": "", "Uraian Pekerjaan": "TOTAL", "Satuan": "", "Volume": 0, "Harga Satuan": 0, "Jumlah Harga": total }
            );

            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "DKH");
            XLSX.writeFile(wb, `DKH_${contractData.name || 'Draft'}.xlsx`);
            toast.success("Berhasil export Excel");
        } catch (error) {
            console.error(error);
            toast.error("Gagal export excel");
        }
    };

    const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const XLSX = await import("xlsx");
            const reader = new FileReader();

            reader.onload = (evt) => {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];

                // Use { header: 1 } to get raw arrays first to detect header row
                const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

                // Find Header Row (row with "Uraian" or "Deskripsi" or "Item")
                let headerRowIndex = 0;
                for (let i = 0; i < Math.min(20, rawData.length); i++) {
                    const rowStr = JSON.stringify(rawData[i]).toLowerCase();
                    if (rowStr.includes("uraian") || rowStr.includes("deskripsi") || rowStr.includes("pekerjaan") || rowStr.includes("item")) {
                        headerRowIndex = i;
                        break;
                    }
                }

                // Re-parse with found header
                const data = XLSX.utils.sheet_to_json(ws, { range: headerRowIndex });

                // Helper to find value by possible keys
                const getValue = (row: any, keys: string[]) => {
                    const rowKeys = Object.keys(row);
                    for (const k of keys) {
                        // Exact match
                        if (row[k] !== undefined) return row[k];
                        // Case insensitive match
                        const foundKey = rowKeys.find(rk => rk.toLowerCase().includes(k.toLowerCase()));
                        if (foundKey) return row[foundKey];
                    }
                    return null;
                };

                // Helper to parse number safely
                const parseNum = (val: any) => {
                    if (typeof val === 'number') return val;
                    if (!val) return 0;
                    // Remove "Rp", ".", and spaces. Handle comma as decimal if needed, but usually Excel gives raw number.
                    // If Excel gives formatted string "1.000,00", we need care.
                    // Assume Excel import usually gives raw numbers or standard decimals.
                    return Number(String(val).replace(/[^0-9.,-]/g, '').replace(',', '.')) || 0;
                };

                // Map to DKHMaster
                const newItems: DKHMaster[] = [];

                data.forEach((row: any) => {
                    const description = getValue(row, ["Uraian", "Deskripsi", "Pekerjaan", "Description"]);

                    // Skip if no description
                    if (!description) return;

                    // Skip if description is just "Transfer" or total/subtitle rows (heuristic)
                    if (String(description).toLowerCase().includes("total") || String(description).toLowerCase().includes("jumlah")) return;

                    const item: DKHMaster = {
                        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                        projectId: "",
                        itemCode: String(getValue(row, ["Kode", "Code", "No", "Nomor"]) || ""),
                        description: String(description),
                        unit: String(getValue(row, ["Sat", "Satuan", "Unit"]) || "Ls"),
                        contractVol: typeof getValue(row, ["Vol", "Volume", "Qty", "Kuantitas"]) === 'number'
                            ? Number(getValue(row, ["Vol", "Volume", "Qty", "Kuantitas"]))
                            : parseNum(getValue(row, ["Vol", "Volume", "Qty", "Kuantitas"])),
                        unitPrice: typeof getValue(row, ["Harga", "Price", "Satuan"]) === 'number'
                            ? Number(getValue(row, ["Harga", "Price", "Satuan"]))
                            : parseNum(getValue(row, ["Harga", "Price", "Satuan"])),
                        totalPrice: 0
                    };

                    item.totalPrice = item.contractVol * item.unitPrice;
                    newItems.push(item);
                });

                if (newItems.length > 0) {
                    setItems(newItems);
                    toast.success(`Berhasil import ${newItems.length} item pekerjaan`);
                } else {
                    toast.warning("Gagal membaca data DKH. Pastikan ada kolom 'Uraian Pekerjaan', 'Volume', dan 'Harga Satuan'.");
                }
            };

            reader.readAsBinaryString(file);
        } catch (error) {
            console.error(error);
            toast.error("Gagal import file Excel");
        }

        // Reset input
        e.target.value = '';
    };

    const subtotal = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    const ppn = subtotal * 0.11;
    const totalContractValue = subtotal + ppn;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!contractData.name || !contractData.contractNo) {
            toast.error("Mohon lengkapi data kontrak utama");
            return;
        }

        const newProject: Project = {
            id: Date.now().toString(),
            ...contractData,
            contractValue: totalContractValue,
            dkhItems: items.map(item => ({ ...item, projectId: Date.now().toString() })) // temporary projectId assignment
        };

        // Fix projectId link
        newProject.dkhItems.forEach(i => i.projectId = newProject.id);

        storage.saveProject(newProject);

        // Clear draft
        localStorage.removeItem("create_project_draft");

        toast.success("Proyek berhasil dibuat");
        navigate("/projects");
    };

    if (user?.role !== "ADMIN" && user?.role !== "PPTK" && user?.role !== "PPK") {
        return <div className="p-10 text-center">Akses Ditolak</div>;
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            <Header />
            <section className="container py-8 max-w-5xl">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Input Data Kontrak & RAB</h1>
                        <p className="text-slate-500">Buat proyek baru dan input Daftar Kuantitas & Harga.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* SECTION 1: KONTRAK */}
                    <Card>
                        <CardHeader>
                            <CardTitle>I. Informasi Kontrak</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Nama Paket Pekerjaan</Label>
                                <Input value={contractData.name} onChange={e => handleContractChange("name", e.target.value)} placeholder="Contoh: Peningkatan Jalan A" />
                            </div>
                            <div className="space-y-2">
                                <Label>Lokasi</Label>
                                <Input value={contractData.location} onChange={e => handleContractChange("location", e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Nomor Kontrak</Label>
                                <Input value={contractData.contractNo} onChange={e => handleContractChange("contractNo", e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Tanggal Kontrak</Label>
                                <Input type="date" value={contractData.contractDate} onChange={e => handleContractChange("contractDate", e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Nilai HPS (Rp)</Label>
                                <Input type="number" value={contractData.hpsValue} onChange={e => handleContractChange("hpsValue", Number(e.target.value))} />
                            </div>
                            <div className="space-y-2">
                                <Label>Nomor SPMK</Label>
                                <Input value={contractData.spmkNumber} onChange={e => handleContractChange("spmkNumber", e.target.value)} placeholder="Nomor Surat Perintah Mulai Kerja" />
                            </div>
                            <div className="space-y-2">
                                <Label>Tanggal SPMK</Label>
                                <Input type="date" value={contractData.spmkDate} onChange={e => handleContractChange("spmkDate", e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Jangka Waktu Pelaksanaan</Label>
                                <Input value={contractData.executionDuration} onChange={e => handleContractChange("executionDuration", e.target.value)} placeholder="Contoh: 120 Hari Kalender" />
                            </div>
                            <div className="space-y-2" ref={dropdownRef}>
                                <div className="flex items-center justify-between">
                                    <Label>Kontraktor Pelaksana</Label>
                                    {oapContractors.length > 0 && (
                                        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" />
                                            {oapContractors.length} Data OAP
                                        </span>
                                    )}
                                </div>

                                {oapContractors.length > 0 ? (
                                    /* ── DROPDOWN SEARCHABLE — data dari OAP ── */
                                    <div className="relative">
                                        <div
                                            className="flex items-center border border-input rounded-md bg-background px-3 h-10 cursor-pointer"
                                            onClick={() => setShowDropdown(v => !v)}
                                        >
                                            <Building2 className="w-4 h-4 text-muted-foreground mr-2 flex-shrink-0" />
                                            <input
                                                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                                                placeholder="Cari atau ketik nama kontraktor..."
                                                value={contractorSearch || contractData.contractorName}
                                                onChange={e => {
                                                    setContractorSearch(e.target.value);
                                                    handleContractChange("contractorName", e.target.value);
                                                    setShowDropdown(true);
                                                }}
                                                onFocus={() => setShowDropdown(true)}
                                            />
                                            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                                        </div>

                                        {showDropdown && (
                                            <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                                {filteredOapContractors.length === 0 ? (
                                                    <div className="p-3 text-center text-sm text-slate-400">
                                                        Tidak ada kontraktor yang cocok
                                                    </div>
                                                ) : (
                                                    filteredOapContractors.map((c) => (
                                                        <button
                                                            key={c.id}
                                                            type="button"
                                                            className="w-full text-left px-4 py-2.5 hover:bg-blue-50 flex items-start gap-3 border-b border-slate-50 last:border-0"
                                                            onClick={() => handleSelectContractor(c)}
                                                        >
                                                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs flex-shrink-0 mt-0.5">
                                                                {c.name?.[0] || "?"}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-semibold text-slate-800">{c.name}</p>
                                                                <p className="text-xs text-slate-500">
                                                                    {[c.companyType, c.classification, c.city].filter(Boolean).join(" · ")}
                                                                </p>
                                                            </div>
                                                            <span className="ml-auto flex-shrink-0 text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                                                                OAP
                                                            </span>
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* ── FALLBACK — belum ada sync dari Admin ── */
                                    <div>
                                        <Input
                                            value={contractData.contractorName}
                                            onChange={e => handleContractChange("contractorName", e.target.value)}
                                            placeholder="Ketik nama kontraktor..."
                                        />
                                        <p className="mt-1.5 text-xs text-amber-600 flex items-center gap-1">
                                            <RefreshCw className="w-3 h-3" />
                                            Data OAP belum tersinkronkan. Admin perlu melakukan sinkronisasi di halaman Integrasi OAP.
                                        </p>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label>Mulai Pelaksanaan</Label>
                                <Input type="date" value={contractData.startDate} onChange={e => handleContractChange("startDate", e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Selesai Pelaksanaan</Label>
                                <Input type="date" value={contractData.endDate} onChange={e => handleContractChange("endDate", e.target.value)} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* SECTION 2: DKH */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div className="flex items-center gap-4">
                                <CardTitle>II. Daftar Kuantitas & Harga (DKH)</CardTitle>
                                <div className="flex gap-2">
                                    <Button type="button" variant="outline" size="sm" onClick={handleDownloadTemplate}>
                                        <Save className="w-3 h-3 mr-2" /> Template
                                    </Button>
                                    <div className="relative">
                                        <Button type="button" variant="secondary" size="sm" onClick={() => document.getElementById('excel-upload')?.click()}>
                                            <Plus className="w-3 h-3 mr-2" /> Import Excel
                                        </Button>
                                        <input
                                            id="excel-upload"
                                            type="file"
                                            accept=".xlsx, .xls"
                                            className="hidden"
                                            onChange={handleImportExcel}
                                        />
                                    </div>
                                    <Button type="button" variant="outline" size="sm" onClick={handleExportExcel} className="text-green-600 border-green-200 bg-green-50 hover:bg-green-100">
                                        <Save className="w-3 h-3 mr-2" /> Export Excel
                                    </Button>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-slate-500">Subtotal: Rp {subtotal.toLocaleString('id-ID')}</div>
                                <div className="text-xs text-slate-500">PPN 11%: Rp {ppn.toLocaleString('id-ID')}</div>
                                <div className="text-sm text-slate-500 font-semibold mt-1">Total Nilai Kontrak (Inc. PPN 11%)</div>
                                <div className="text-2xl font-bold text-slate-900">Rp {totalContractValue.toLocaleString('id-ID')}</div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[100px]">Kode</TableHead>
                                        <TableHead>Uraian Pekerjaan</TableHead>
                                        <TableHead className="w-[80px]">Sat</TableHead>
                                        <TableHead className="w-[120px]">Vol</TableHead>
                                        <TableHead className="w-[180px]">Harga Satuan</TableHead>
                                        <TableHead className="w-[180px]">Jumlah Harga</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <Input value={item.itemCode} onChange={e => handleItemChange(item.id, "itemCode", e.target.value)} className="h-8" />
                                            </TableCell>
                                            <TableCell>
                                                <Input value={item.description} onChange={e => handleItemChange(item.id, "description", e.target.value)} className="h-8" />
                                            </TableCell>
                                            <TableCell>
                                                <Input value={item.unit} onChange={e => handleItemChange(item.id, "unit", e.target.value)} className="h-8" />
                                            </TableCell>
                                            <TableCell>
                                                <Input type="number" value={item.contractVol} onChange={e => handleItemChange(item.id, "contractVol", e.target.value)} className="h-8 text-right" />
                                            </TableCell>
                                            <TableCell>
                                                <Input type="number" value={item.unitPrice} onChange={e => handleItemChange(item.id, "unitPrice", e.target.value)} className="h-8 text-right" />
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {(item.totalPrice || 0).toLocaleString('id-ID')}
                                            </TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="text-destructive h-8 w-8">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <Button type="button" variant="outline" className="mt-4" onClick={addItem}>
                                <Plus className="mr-2 h-4 w-4" /> Tambah Item Pekerjaan
                            </Button>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" size="lg" className="w-[200px]">
                            <Save className="mr-2 h-4 w-4" /> Simpan Proyek
                        </Button>
                    </div>
                </form>
            </section>
        </div>
    );
};

export default CreateProject;
