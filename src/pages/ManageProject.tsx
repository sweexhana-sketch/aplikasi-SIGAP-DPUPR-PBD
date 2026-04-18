import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { DKHMaster, storage, Project, ProjectSnapshot } from "@/lib/storage";
import { useParams, useNavigate } from "react-router-dom";
import { Trash2, Plus, Save, History, FileText, ArrowLeft, AlertCircle, Printer } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { terbilang } from "@/lib/terbilang";

const ManageProject = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [project, setProject] = useState<Project | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    // Form State
    const [contractData, setContractData] = useState<Partial<Project>>({});
    const [items, setItems] = useState<DKHMaster[]>([]);

    useEffect(() => {
        if (id) {
            const data = storage.getProjectById(id);
            if (data) {
                setProject(data);
                resetForm(data);
            } else {
                toast.error("Proyek tidak ditemukan");
                navigate("/projects");
            }
        }
    }, [id, navigate]);

    const resetForm = (data: Project) => {
        setContractData({
            name: data.name,
            location: data.location,
            contractNo: data.contractNo,
            contractDate: data.contractDate,
            contractorName: data.contractorName,
            startDate: data.startDate,
            endDate: data.endDate,
            spmkNumber: data.spmkNumber,
            spmkDate: data.spmkDate,
            executionDuration: data.executionDuration,
        });
        setItems(JSON.parse(JSON.stringify(data.dkhItems))); // Deep copy
    };

    const handleContractChange = (field: string, value: any) => {
        setContractData(prev => ({ ...prev, [field]: value }));
    };

    const handleItemChange = (itemId: string, field: keyof DKHMaster, value: any) => {
        setItems(prev => prev.map(item => {
            if (item.id !== itemId) return item;

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
                id: Date.now().toString(), projectId: project!.id, itemCode: "",
                description: "", unit: "", contractVol: 0, unitPrice: 0, totalPrice: 0
            }
        ]);
    };

    const removeItem = (itemId: string) => {
        setItems(prev => prev.filter(i => i.id !== itemId));
    };

    const subtotal = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    const ppn = subtotal * 0.11;
    const totalContractValue = subtotal + ppn;

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
                        projectId: project!.id,
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
                    // Update state - if in edit mode (Addendum), we might want to confirm replacement?
                    // For now, simpler: just set them. Logic in CreateProject replaces everything.
                    // User can re-add if needed.
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
            XLSX.writeFile(wb, `DKH_${project?.name || 'Export'}.xlsx`);
            toast.success("Berhasil export DKH");
        } catch (error) {
            console.error(error);
            toast.error("Gagal export excel");
        }
    };

    // --- ADDENDUM LOGIC ---
    const handleCreateAddendum = () => {
        if (!window.confirm("Apakah Anda yakin ingin membuat Addendum? \n\nSistem akan menyimpan kondisi kontrak saat ini ke histori dan membuka form untuk input perubahan.")) return;

        // 1. Snapshot creation
        const snapshot: ProjectSnapshot = {
            date: new Date().toISOString(),
            description: project!.addendumCount ? `Addendum 0${project!.addendumCount}` : "Kontrak Awal",
            contractNo: project!.contractNo,
            contractValue: project!.contractValue,
            startDate: project!.startDate,
            endDate: project!.endDate,
            dkhItems: JSON.parse(JSON.stringify(project!.dkhItems))
        };

        // 2. Prepare new state for editing
        setIsEditing(true);
        toast.info("Mode Edit Addendum Aktif. Silakan ubah volume/item.");

        // We don't save snapshot yet, we save it when "Simpan Addendum" is clicked? 
        // Or we save immediately? Better save immediately to avoid data loss.
        // Actually, let's keep it simple: "Enable Edit" just facilitates editing.
        // The "Save" action below will verify and push history.
    };

    const handleSaveAddendum = () => {
        if (!project) return;
        // Create Snapshot of the OLD state
        const snapshot: ProjectSnapshot = {
            date: new Date().toISOString(),
            description: project.addendumCount ? `Addendum 0${project.addendumCount}` : "Kontrak Awal",
            contractNo: project.contractNo,
            contractValue: project.contractValue,
            startDate: project.startDate,
            endDate: project.endDate,
            dkhItems: JSON.parse(JSON.stringify(project.dkhItems))
        };

        const newAddendumCount = (project.addendumCount || 0) + 1;

        const updatedProject: Project = {
            ...project,
            ...contractData,
            contractValue: totalContractValue,
            dkhItems: items,
            addendumCount: newAddendumCount,
            history: [...(project.history || []), snapshot]
        };

        storage.saveProject(updatedProject);
        setProject(updatedProject);
        setIsEditing(false);
        toast.success(`Addendum 0${newAddendumCount} berhasil disimpan!`);
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            toast.error("Pop-up diblokir. Izinkan pop-up untuk mencetak.");
            return;
        }

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Cetak DKH - ${project?.name}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid black; padding-bottom: 10px; }
                    .header h2 { margin: 0; }
                    .header h3 { margin: 5px 0; font-weight: normal; }
                    .info { margin-bottom: 20px; }
                    .info table { width: 100%; }
                    .info td { padding: 4px; vertical-align: top; }
                    .dkh-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    .dkh-table th, .dkh-table td { border: 1px solid black; padding: 8px; font-size: 12px; }
                    .dkh-table th { background-color: #f0f0f0; text-align: center; }
                    .text-right { text-align: right; }
                    .footer-row td { font-weight: bold; background-color: #f9f9f9; }
                    @media print {
                        @page { size: A4; margin: 1cm; }
                        body { padding: 0; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>PEMERINTAH PROVINSI PAPUA BARAT DAYA</h2>
                    <h3>DINAS PEKERJAAN UMUM DAN PERUMAHAN RAKYAT</h3>
                </div>

                <div class="info">
                    <table>
                        <tr><td width="150">Nama Paket</td><td>: ${project?.name}</td></tr>
                        <tr><td>Nomor Kontrak</td><td>: ${project?.contractNo}</td></tr>
                        <tr><td>Lokasi</td><td>: ${project?.location}</td></tr>
                        <tr><td>Kontraktor</td><td>: ${project?.contractorName}</td></tr>
                    </table>
                </div>

                <h3>DAFTAR KUANTITAS DAN HARGA (BOQ)</h3>
                <p style="font-size: 11px;">Status: ${project?.addendumCount ? 'Addendum 0' + project.addendumCount : 'Kontrak Awal'}</p>

                <table class="dkh-table">
                    <thead>
                        <tr>
                            <th width="5%">No</th>
                            <th>Kode</th>
                            <th>Uraian Pekerjaan</th>
                            <th width="8%">Sat</th>
                            <th width="10%">Vol</th>
                            <th width="15%">Harga Satuan</th>
                            <th width="15%">Jumlah Harga</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map((item, i) => `
                            <tr>
                                <td style="text-align: center;">${i + 1}</td>
                                <td>${item.itemCode || ''}</td>
                                <td>${item.description}</td>
                                <td style="text-align: center;">${item.unit}</td>
                                <td class="text-right">${item.contractVol}</td>
                                <td class="text-right">Rp ${item.unitPrice.toLocaleString('id-ID')}</td>
                                <td class="text-right">Rp ${(item.totalPrice || 0).toLocaleString('id-ID')}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                    <tfoot>
                        <tr class="footer-row">
                            <td colspan="6" class="text-right">Subtotal</td>
                            <td class="text-right">Rp ${subtotal.toLocaleString('id-ID')}</td>
                        </tr>
                        <tr class="footer-row">
                            <td colspan="6" class="text-right">PPN 11%</td>
                            <td class="text-right">Rp ${ppn.toLocaleString('id-ID')}</td>
                        </tr>
                        <tr class="footer-row">
                            <td colspan="6" class="text-right">TOTAL NILAI KONTRAK</td>
                            <td class="text-right">Rp ${totalContractValue.toLocaleString('id-ID')}</td>
                        </tr>
                    </tfoot>
                </table>

                <div style="margin-top: 40px; display: flex; justify-content: flex-end;">
                    <div style="text-align: center; width: 200px;">
                        <p>Sorong, ${new Date().toLocaleDateString('id-ID')}</p>
                        <p>Dibuat Oleh,</p>
                        <br><br><br>
                        <p><strong>${project?.contractorName || 'Penyedia Jasa'}</strong></p>
                    </div>
                </div>

                <script>
                    window.onload = function() { window.print(); }
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        if (project) resetForm(project);
        toast.info("Perubahan dibatalkan.");
    };

    if (!project) return <div>Loading...</div>;

    return (
        <div className="min-h-screen bg-background pb-20">
            <Header />
            <section className="container py-8 max-w-6xl">
                <div className="flex items-center gap-4 mb-6">
                    <Button variant="ghost" onClick={() => navigate("/projects")}>
                        <ArrowLeft className="h-4 w-4 mr-2" /> Kembali
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            {project.name}
                            {project.addendumCount ? <Badge variant="destructive">Addendum 0{project.addendumCount}</Badge> : <Badge variant="secondary">Kontrak Awal</Badge>}
                        </h1>
                        <p className="text-slate-500">Manajemen Kontrak & Addendum</p>
                    </div>
                </div>

                <Tabs defaultValue="contract" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="contract">Kontrak Aktif</TabsTrigger>
                        <TabsTrigger value="history">Riwayat Addendum</TabsTrigger>
                    </TabsList>

                    {/* TAB 1: CURRENT CONTRACT */}
                    <TabsContent value="contract" className="space-y-6">
                        {/* Summary Card */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="md:col-span-2">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <div className="space-y-1">
                                        <CardTitle className="text-base font-medium">Informasi Pelaksanaan</CardTitle>
                                        <CardDescription>Detail kontrak yang sedang berjalan</CardDescription>
                                    </div>
                                    {!isEditing && (
                                        <Button onClick={handleCreateAddendum} variant="outline" className="border-orange-500 text-orange-600 hover:bg-orange-50">
                                            <FileText className="h-4 w-4 mr-2" />
                                            Buat Addendum
                                        </Button>
                                    )}
                                </CardHeader>
                                <CardContent className="grid gap-4 md:grid-cols-2 text-sm">
                                    <div>
                                        <Label className="text-muted-foreground">Nomor Kontrak</Label>
                                        {isEditing ?
                                            <Input value={contractData.contractNo} onChange={e => handleContractChange("contractNo", e.target.value)} /> :
                                            <div className="font-medium">{project.contractNo}</div>
                                        }
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Nilai Kontrak</Label>
                                        <div className="font-medium text-lg text-primary">{terbilang(totalContractValue)} Rupiah</div>
                                        <div className="text-xs text-muted-foreground">Target: Rp {project.hpsValue.toLocaleString()}</div>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Pelaksana</Label>
                                        <div className="font-medium">{project.contractorName}</div>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Durasi</Label>
                                        {isEditing ?
                                            <Input value={contractData.executionDuration} onChange={e => handleContractChange("executionDuration", e.target.value)} /> :
                                            <div className="font-medium">{project.executionDuration || "-"}</div>
                                        }
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-blue-50/50 border-blue-100">
                                <CardHeader>
                                    <CardTitle className="text-blue-900">Total Nilai</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Subtotal</span>
                                        <span>Rp {subtotal.toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>PPN 11%</span>
                                        <span>Rp {ppn.toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="border-t border-blue-200 pt-2 flex justify-between font-bold text-lg text-blue-700">
                                        <span>Total</span>
                                        <span>Rp {totalContractValue.toLocaleString('id-ID')}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* ITEMS TABLE */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Item Pekerjaan (DKH)</CardTitle>
                                <CardDescription>
                                    {isEditing ? "Mode Edit: Silakan sesuaikan volume atau tambah item baru." : "Daftar item pekerjaan yang berlaku saat ini."}
                                </CardDescription>
                                <div className="ml-auto flex gap-2">
                                    {isEditing && (
                                        <>
                                            <Button type="button" variant="outline" size="sm" onClick={handleDownloadTemplate}>
                                                <Save className="w-3 h-3 mr-2" /> Template
                                            </Button>
                                            <div className="relative">
                                                <Button type="button" variant="secondary" size="sm" onClick={() => document.getElementById('excel-upload-manage')?.click()}>
                                                    <Plus className="w-3 h-3 mr-2" /> Import Excel
                                                </Button>
                                                <input
                                                    id="excel-upload-manage"
                                                    type="file"
                                                    accept=".xlsx, .xls"
                                                    className="hidden"
                                                    onChange={handleImportExcel}
                                                />
                                            </div>
                                        </>
                                    )}
                                    <Button size="sm" variant="outline" onClick={handlePrint} className="text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100">
                                        <Printer className="w-4 h-4 mr-2" /> Cetak / PDF
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={handleExportExcel} className="text-green-600 bg-green-50 border-green-200 hover:bg-green-100">
                                        <FileText className="w-4 h-4 mr-2" /> Export Excel
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[100px]">Kode</TableHead>
                                            <TableHead>Uraian</TableHead>
                                            <TableHead className="w-[80px]">Sat</TableHead>
                                            <TableHead className="w-[120px]">Vol</TableHead>
                                            <TableHead className="w-[150px]">H. Satuan</TableHead>
                                            <TableHead className="w-[150px]">Jumlah</TableHead>
                                            {isEditing && <TableHead></TableHead>}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {items.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell>
                                                    {isEditing ? <Input value={item.itemCode} onChange={e => handleItemChange(item.id, "itemCode", e.target.value)} className="h-8" /> : item.itemCode}
                                                </TableCell>
                                                <TableCell>
                                                    {isEditing ? <Input value={item.description} onChange={e => handleItemChange(item.id, "description", e.target.value)} className="h-8" /> : item.description}
                                                </TableCell>
                                                <TableCell>
                                                    {isEditing ? <Input value={item.unit} onChange={e => handleItemChange(item.id, "unit", e.target.value)} className="h-8" /> : item.unit}
                                                </TableCell>
                                                <TableCell>
                                                    {isEditing ? <Input type="number" value={item.contractVol} onChange={e => handleItemChange(item.id, "contractVol", e.target.value)} className="h-8 text-right" /> : <div className="text-right">{item.contractVol}</div>}
                                                </TableCell>
                                                <TableCell>
                                                    {isEditing ? <Input type="number" value={item.unitPrice} onChange={e => handleItemChange(item.id, "unitPrice", e.target.value)} className="h-8 text-right" /> : <div className="text-right">{item.unitPrice.toLocaleString('id-ID')}</div>}
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {(item.totalPrice || 0).toLocaleString('id-ID')}
                                                </TableCell>
                                                {isEditing && (
                                                    <TableCell>
                                                        <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="text-destructive h-8 w-8">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                {isEditing && (
                                    <div className="mt-4 flex gap-2">
                                        <Button type="button" variant="outline" onClick={addItem}>
                                            <Plus className="mr-2 h-4 w-4" /> Tambah Item
                                        </Button>
                                        <div className="flex-1"></div>
                                        <Button variant="ghost" onClick={handleCancelEdit}>Batal</Button>
                                        <Button onClick={handleSaveAddendum} className="bg-primary">
                                            <Save className="mr-2 h-4 w-4" /> Simpan Addendum
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* TAB 2: HISTORY */}
                    <TabsContent value="history">
                        <Card>
                            <CardHeader>
                                <CardTitle>Riwayat Perubahan Kontrak</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {!project.history || project.history.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground flex flex-col items-center">
                                        <History className="h-10 w-10 mb-2 opacity-20" />
                                        <p>Belum ada riwayat addendum.</p>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Deskripsi</TableHead>
                                                <TableHead>Tanggal Arsip</TableHead>
                                                <TableHead>Nilai Kontrak</TableHead>
                                                <TableHead>Jumlah Item</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {project.history.map((h, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell className="font-medium">{h.description}</TableCell>
                                                    <TableCell>{new Date(h.date).toLocaleDateString("id-ID")}</TableCell>
                                                    <TableCell>Rp {h.contractValue.toLocaleString("id-ID")}</TableCell>
                                                    <TableCell>{h.dkhItems.length} Item</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </section>
        </div>
    );
};

export default ManageProject;
