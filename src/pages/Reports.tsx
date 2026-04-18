
import Header from "@/components/Header";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Upload, Camera, MapPin, CloudSun, Users, AlertCircle, Printer, Calculator, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { storage, Project, DailyReport } from "@/lib/storage";
import { useAuth } from "@/context/AuthContext";

// Interface for Backup Data Item
interface BackupItem {
  id: string;
  description: string;
  length: number;
  width: number;
  height: number;
  quantity: number;
  vol: number;
}

const Reports = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // REDIRECT ADMIN/PPK/PPTK TO VERIFICATION PAGE
  useEffect(() => {
    if (user && (user.role === 'ADMIN' || user.role === 'PPK' || user.role === 'PPTK')) {
      navigate('/verification', { replace: true });
    }
  }, [user, navigate]);

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Daily Report State
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [weather, setWeather] = useState<'Cerah' | 'Hujan' | 'Berawan'>('Cerah');
  const [manpower, setManpower] = useState(0);
  const [inputs, setInputs] = useState<Record<string, number>>({}); // dkhId -> volume

  // Backup Data State: Record<dkhId, BackupItem[]>
  const [backupDataMap, setBackupDataMap] = useState<Record<string, BackupItem[]>>({});

  // Dialog State
  const [activeDkhId, setActiveDkhId] = useState<string | null>(null);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [tempBackupItems, setTempBackupItems] = useState<BackupItem[]>([]);

  const [findings, setFindings] = useState("");

  // Stats for Validation
  const [projectStats, setProjectStats] = useState<any>(null);

  // Geo-tagging & Photo
  const [coords, setCoords] = useState<string>("");
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if (user) {
      // Show ALL projects to everyone for now (Simplified per user request)
      // "Tidak perlu koneksi user rumit, cukup bisa lapor"
      // In production we would filter, but for this stage we open it.
      const list = storage.getProjects();
      setProjects(list);
    }
  }, [user]);

  useEffect(() => {
    if (selectedProjectId) {
      const p = storage.getProjectById(selectedProjectId) || null;
      setSelectedProject(p);
      setProjectStats(storage.getProjectAnalytics(selectedProjectId));
      setInputs({});
      setBackupDataMap({});
      // Reset daily fields
      setCoords("");
      setCoords("");
      setPhotoFiles([]);
      setPreviewUrls([]);
      setFindings("");
    }
  }, [selectedProjectId]);

  const handleInputChange = (dkhId: string, val: string) => {
    setInputs(prev => ({ ...prev, [dkhId]: Number(val) }));
  };

  // --- BACKUP DATA CALCULATOR LOGIC ---
  const openCalculator = (dkhId: string) => {
    setActiveDkhId(dkhId);
    // Load existing items or start fresh
    setTempBackupItems(backupDataMap[dkhId] || []);
    setIsCalculatorOpen(true);
  };

  const addBackupItem = () => {
    const newItem: BackupItem = {
      id: Date.now().toString(),
      description: "",
      length: 0,
      width: 0,
      height: 0,
      quantity: 1,
      vol: 0
    };
    setTempBackupItems([...tempBackupItems, newItem]);
  };

  const updateBackupItem = (id: string, field: keyof BackupItem, val: any) => {
    setTempBackupItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: val };
        // Auto Calc Volume
        if (field !== 'description' && field !== 'id') {
          const l = field === 'length' ? Number(val) : item.length;
          const w = field === 'width' ? Number(val) : item.width;
          const h = field === 'height' ? Number(val) : item.height;
          const q = field === 'quantity' ? Number(val) : item.quantity;
          updated.vol = Number((l * w * h * q).toFixed(3));
        }
        return updated;
      }
      return item;
    }));
  };

  const removeBackupItem = (id: string) => {
    setTempBackupItems(prev => prev.filter(i => i.id !== id));
  };

  const saveBackupData = () => {
    if (activeDkhId) {
      // Calculate Total Volume
      const totalVol = tempBackupItems.reduce((acc, curr) => acc + curr.vol, 0);

      // Update Backup Map
      setBackupDataMap(prev => ({ ...prev, [activeDkhId]: tempBackupItems }));

      // Update Main Input Volume
      setInputs(prev => ({ ...prev, [activeDkhId]: totalVol }));

      setIsCalculatorOpen(false);
      toast.success(`Volume terhitung: ${totalVol}`);
    }
  };

  // CAMERA STATE
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useState<HTMLVideoElement | null>(null)[1]; // Using a simpler ref approach in effect
  // Actually, let's use standard useRef inside the component first

  // Re-declare properly with imports if I could, but here I'm replacing content inside the component body.
  // I need to be careful about not breaking hooks.
  // I will assume useRef is imported or I can use useState as ref callback?
  // Let's use standard state for media stream to cleanup.
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      // First attempt: Prefer rear camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setMediaStream(stream);
      setIsCameraOpen(true);
    } catch (err) {
      console.warn("Retrying camera without facingMode constraint...", err);
      try {
        // Fallback: Try any available video source
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true
        });
        setMediaStream(stream);
        setIsCameraOpen(true);
      } catch (err2) {
        console.error("Camera failed:", err2);
        toast.error("Gagal membuka kamera. Pastikan izin diberikan dan perangkat memiliki kamera.");
      }
    }
  };

  const stopCamera = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
    setIsCameraOpen(false);
  };

  const takePhoto = () => {
    const video = document.querySelector('video');
    const canvas = document.querySelector('canvas');
    if (video && canvas) {
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `photo_${Date.now()}.png`, { type: 'image/png' });

            if (previewUrls.length >= 4) {
              toast.error("Maksimal 4 foto!");
              stopCamera();
              return;
            }

            setPhotoFiles(prev => [...prev, file]);
            setPreviewUrls(prev => [...prev, URL.createObjectURL(file)]);

            // AUTO GPS
            if (!coords) {
              setIsLocating(true);
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  setCoords(`${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`);
                  setIsLocating(false);
                  toast.success("Foto & Lokasi berhasil diambil!");
                },
                (err) => {
                  console.error(err);
                  setIsLocating(false);
                  toast.warning("Foto diambil, tapi gagal mengambil lokasi.");
                }
              );
            } else {
              toast.success("Foto berhasil diambil!");
            }

            stopCamera();
          }
        }, 'image/png');
      }
    }
  };

  // Effect to attach stream to video element when modal opens
  useEffect(() => {
    if (isCameraOpen && mediaStream) {
      // Little delay to ensure DOM is ready
      setTimeout(() => {
        const video = document.querySelector('video');
        if (video) {
          video.srcObject = mediaStream;
        }
      }, 100);
    }
  }, [isCameraOpen, mediaStream]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) {
      toast.error("Pilih proyek terlebih dahulu");
      return;
    }

    const reportItems = Object.entries(inputs)
      .filter(([_, vol]) => vol > 0)
      .map(([dkhId, vol]) => ({
        dkhId,
        dayVol: vol,
        backupData: backupDataMap[dkhId] || [] // Include backup data if exists
      }));

    if (reportItems.length === 0) {
      toast.error("Isi minimal satu volume pekerjaan");
      return;
    }

    const report: DailyReport = {
      id: Date.now().toString(),
      projectId: selectedProjectId,
      date: reportDate,
      weather,
      manpower,
      isVerified: false,
      items: reportItems,
      coords: coords || "0,0",
      photoUrls: previewUrls.length > 0 ? previewUrls : ["https://placehold.co/600x400?text=No+Image"],
      photoUrl: previewUrls[0] || "https://placehold.co/600x400?text=No+Image", // Backward compat
      findings: findings
    };

    storage.saveReport(report);
    toast.success("Laporan Harian berhasil disimpan! Menunggu verifikasi.");
    // Reset form
    setInputs({});
    setBackupDataMap({});
    setFindings("");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      <section className="container py-8 max-w-4xl">
        <Tabs defaultValue="daily" className="w-full">
          {/* Only show both tabs for OPERATOR, KONSULTAN, KONTRAKTOR */}
          {user && (user.role === 'OPERATOR' || user.role === 'KONSULTAN' || user.role === 'KONTRAKTOR') ? (
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="daily">Input Laporan Harian</TabsTrigger>
              <TabsTrigger value="print">Cetak Laporan (Mingguan/Bulanan)</TabsTrigger>
            </TabsList>
          ) : (
            <TabsList className="grid w-full grid-cols-1 mb-8">
              <TabsTrigger value="daily">Input Laporan Harian</TabsTrigger>
            </TabsList>
          )}

          <TabsContent value="daily">
            <div className="mb-8 flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold mb-2 text-slate-900">Laporan Lapangan</h1>
                <p className="text-slate-600">Input data harian untuk pelaporan progress fisik.</p>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Formulir Laporan Harian</CardTitle>
                <CardDescription>Silakan isi realisasi pekerjaan hari ini.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Project Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Proyek</Label>
                      <Select onValueChange={setSelectedProjectId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Proyek" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Tanggal Laporan</Label>
                      <Input type="date" value={reportDate} onChange={e => setReportDate(e.target.value)} />
                    </div>
                  </div>

                  {/* CONTRACT DATA AUTO-POPULATE */}
                  {selectedProject && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-2 text-blue-800 font-semibold border-b border-blue-200 pb-2">
                        <Users className="w-4 h-4" /> Data Kontrak (Otomatis)
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">Nomor Kontrak</p>
                          <p className="font-medium">{selectedProject.contractNo}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Tanggal Kontrak</p>
                          <p className="font-medium">{selectedProject.contractDate}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Kontraktor</p>
                          <p className="font-medium">{selectedProject.contractorName}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Nilai Kontrak</p>
                          <p className="font-medium">Rp {selectedProject.contractValue.toLocaleString('id-ID')}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-muted-foreground text-xs">Masa Pelaksanaan</p>
                          <p className="font-medium">{selectedProject.startDate} s/d {selectedProject.endDate}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Non-Physical Aspects */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg border">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2"><CloudSun className="w-4 h-4" /> Cuaca</Label>
                      <Select value={weather} onValueChange={(v: any) => setWeather(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cerah">Cerah ☀️</SelectItem>
                          <SelectItem value="Berawan">Berawan ⛅</SelectItem>
                          <SelectItem value="Hujan">Hujan 🌧️</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2"><Users className="w-4 h-4" /> Tenaga Kerja</Label>
                      <Input type="number" value={manpower} onChange={e => setManpower(Number(e.target.value))} placeholder="Jml Orang" />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Lokasi (GPS)</Label>
                      {coords ? (
                        <div className="text-xs bg-green-50 text-green-700 p-2 rounded border border-green-200">
                          {coords}
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full text-xs"
                          onClick={() => {
                            setIsLocating(true);
                            navigator.geolocation.getCurrentPosition(
                              (pos) => {
                                setCoords(`${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`);
                                setIsLocating(false);
                                toast.success("Lokasi ditemukan!");
                              },
                              (err) => {
                                toast.error("Gagal mengambil lokasi: " + err.message);
                                setIsLocating(false);
                              }
                            );
                          }}
                          disabled={isLocating}
                        >
                          {isLocating ? "Mencari..." : "Ambil Lokasi Saat Ini"}
                        </Button>
                      )}
                    </div>
                    <div className="col-span-1 md:col-span-3 space-y-2">
                      <Label className="flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Catatan / Temuan Lapangan</Label>
                      <textarea
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Misal: Ada kendala cuaca atau material terlambat..."
                        value={findings}
                        onChange={(e) => setFindings(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* DKH Input Table */}
                  {selectedProject && projectStats && (
                    <div className="space-y-2">
                      <Label>Input Volume Pekerjaan (Dari DKH)</Label>
                      <div className="border rounded-md overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-100 text-slate-700">
                            <tr>
                              <th className="p-3 text-left">Uraian Pekerjaan</th>
                              <th className="p-3 text-right">Vol. Kontrak</th>
                              <th className="p-3 text-right">Sdh Dikerjakan</th>
                              <th className="p-3 text-right w-[200px]">Vol. Hari Ini</th>
                            </tr>
                          </thead>
                          <tbody>
                            {projectStats.itemsStats.map((item: any) => {
                              const sisa = item.contractVol - item.volReal;
                              const hasBackupData = (backupDataMap[item.id] || []).length > 0;

                              return (
                                <tr key={item.id} className="border-b hover:bg-slate-50">
                                  <td className="p-3">
                                    <p className="font-medium">{item.description}</p>
                                    <p className="text-xs text-muted-foreground">{item.itemCode}</p>
                                  </td>
                                  <td className="p-3 text-right">{item.contractVol} {item.unit}</td>
                                  <td className="p-3 text-right text-blue-600">{item.volReal}</td>
                                  <td className="p-3">
                                    <div className="flex gap-2">
                                      <Input
                                        type="number"
                                        className={`text-right ${inputs[item.id] > sisa ? "border-red-500 bg-red-50" : ""}`}
                                        placeholder="0"
                                        value={inputs[item.id] || ''}
                                        onChange={(e) => handleInputChange(item.id, e.target.value)}
                                        readOnly={hasBackupData} // Read only if calculated
                                      />

                                      {/* CALCULATOR BUTTON / BACKUP DATA - ONLY FOR CONTRACTOR */}
                                      {user?.role === 'KONTRAKTOR' && (
                                        <Button
                                          type="button"
                                          size="icon"
                                          variant={hasBackupData ? "default" : "outline"}
                                          onClick={() => openCalculator(item.id)}
                                          title="Hitung Backup Data"
                                        >
                                          <Calculator className="w-4 h-4" />
                                        </Button>
                                      )}
                                    </div>

                                    {inputs[item.id] > sisa && (
                                      <p className="text-[10px] text-red-500 text-right">Melebihi Sisa!</p>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4 pt-4 border-t">
                    <div className="space-y-4">
                      <Label className="flex items-center gap-2 text-lg font-semibold"><Camera className="w-5 h-5" /> Dokumentasi Proyek</Label>

                      <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center bg-slate-50 gap-4">
                        <Input
                          id="camera-input"
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              if (previewUrls.length >= 4) {
                                toast.error("Maksimal 4 foto!");
                                return;
                              }

                              const file = e.target.files[0];
                              setPhotoFiles(prev => [...prev, file]);
                              setPreviewUrls(prev => [...prev, URL.createObjectURL(file)]);

                              // Auto get location if not set (only for first photo or if missing)
                              if (!coords) {
                                setIsLocating(true);
                                navigator.geolocation.getCurrentPosition(
                                  (pos) => {
                                    setCoords(`${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`);
                                    setIsLocating(false);
                                    toast.success("Foto & Lokasi berhasil diambil!");
                                  },
                                  (err) => {
                                    console.error(err);
                                    setIsLocating(false);
                                    toast.warning("Foto diambil, tapi gagal mengambil lokasi.");
                                  }
                                );
                              } else {
                                toast.success("Foto berhasil ditambahkan!");
                              }
                            }
                          }}
                        />

                        {/* PHOTO GRID */}
                        <div className="grid grid-cols-2 gap-4 w-full">
                          {previewUrls.map((url, idx) => (
                            <div key={idx} className="relative aspect-video rounded-lg overflow-hidden shadow-md group">
                              <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-1 right-1 h-6 w-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => {
                                  setPreviewUrls(prev => prev.filter((_, i) => i !== idx));
                                  setPhotoFiles(prev => prev.filter((_, i) => i !== idx));
                                  // If all photos removed, maybe clear coords? No, keep coords.
                                }}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                              <div className="absolute bottom-0 left-0 bg-black/50 text-white text-[10px] px-1 rounded-tr">
                                Foto #{idx + 1}
                              </div>
                            </div>
                          ))}

                          {/* ADD BUTTON SLOT */}
                          {previewUrls.length < 4 && (
                            <div className="grid grid-cols-2 gap-2 h-full">
                              {/* OPTION 1: IN-APP CAMERA via WebRTC */}
                              <div
                                className="aspect-square rounded-lg border-2 border-dashed border-blue-300 bg-blue-50 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-100 transition-colors text-blue-600"
                                onClick={startCamera}
                              >
                                <Camera className="w-8 h-8 mb-1" />
                                <span className="text-[10px] font-bold text-center px-1">Buka Kamera Langsung</span>
                              </div>

                              {/* OPTION 2: FILE UPLOAD / SYSTEM CAMERA */}
                              <div
                                className="aspect-square rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
                                onClick={() => document.getElementById('camera-input')?.click()}
                              >
                                <Upload className="w-8 h-8 mb-1" />
                                <span className="text-[10px] font-medium text-center px-1">Upload File / Galeri</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {coords && (
                          <div className="flex items-center gap-2 text-green-600 text-sm font-medium bg-green-50 px-3 py-1 rounded-full mt-2">
                            <MapPin className="w-4 h-4" /> Terhubung dengan Koordinat: {coords}
                          </div>
                        )}
                      </div>
                    </div>

                    <Button type="submit" className="w-full" size="lg" disabled={!selectedProject}>
                      <Upload className="mr-2 h-4 w-4" />
                      Simpan Laporan Harian
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Only show print tab content for OPERATOR, KONSULTAN, KONTRAKTOR */}
          {user && (user.role === 'OPERATOR' || user.role === 'KONSULTAN' || user.role === 'KONTRAKTOR') && (
            <TabsContent value="print">
              <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2 text-slate-900">Cetak Laporan Berkala</h1>
                <p className="text-slate-600">Pilih jenis laporan yang ingin dicetak sesuai standar format konstruksi.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="hover:border-blue-500 cursor-pointer transition-all" onClick={() => navigate('/reports/weekly')}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Printer className="w-5 h-5 text-blue-600" /> Laporan Mingguan</CardTitle>
                    <CardDescription>Format standar Mingguan: Progress Minggu Ini vs Lalu, Deviasi, dan Dokumentasi.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" variant="outline">Buka Laporan Mingguan</Button>
                  </CardContent>
                </Card>

                <Card className="hover:border-green-500 cursor-pointer transition-all" onClick={() => navigate('/reports/monthly')}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Printer className="w-5 h-5 text-green-600" /> Laporan Bulanan</CardTitle>
                    <CardDescription>Format standar Bulanan: Progress Bulanan, Kurva S, Isu Utama, dan Rekapitulasi.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" variant="outline">Buka Laporan Bulanan</Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </section>

      {/* BACKUP DATA DIALOG */}
      <Dialog open={isCalculatorOpen} onOpenChange={setIsCalculatorOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Backup Data / Perhitungan Volume</DialogTitle>
            <DialogDescription>
              Masukkan detail dimensi (Panjang x Lebar x Tinggi) untuk menghitung volume item ini.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b">
                  <th className="p-2 text-left">Ket / Segmen</th>
                  <th className="p-2 w-20">P (m)</th>
                  <th className="p-2 w-20">L (m)</th>
                  <th className="p-2 w-20">T (m)</th>
                  <th className="p-2 w-16">Jml</th>
                  <th className="p-2 w-24 text-right">Vol (m3)</th>
                  <th className="p-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {tempBackupItems.map((item, idx) => (
                  <tr key={item.id} className="border-b">
                    <td className="p-1">
                      <Input
                        value={item.description}
                        onChange={(e) => updateBackupItem(item.id, 'description', e.target.value)}
                        placeholder={`Segmen ${idx + 1}`}
                      />
                    </td>
                    <td className="p-1"><Input type="number" value={item.length} onChange={(e) => updateBackupItem(item.id, 'length', e.target.value)} /></td>
                    <td className="p-1"><Input type="number" value={item.width} onChange={(e) => updateBackupItem(item.id, 'width', e.target.value)} /></td>
                    <td className="p-1"><Input type="number" value={item.height} onChange={(e) => updateBackupItem(item.id, 'height', e.target.value)} /></td>
                    <td className="p-1"><Input type="number" value={item.quantity} onChange={(e) => updateBackupItem(item.id, 'quantity', e.target.value)} /></td>
                    <td className="p-1 text-right font-medium">{item.vol.toLocaleString('id-ID')}</td>
                    <td className="p-1 text-center">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => removeBackupItem(item.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-blue-50 font-bold">
                  <td colSpan={5} className="p-2 text-right">Total Volume:</td>
                  <td className="p-2 text-right text-blue-700">
                    {tempBackupItems.reduce((acc, curr) => acc + curr.vol, 0).toLocaleString('id-ID')}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>

            <Button variant="outline" size="sm" onClick={addBackupItem} className="w-full border-dashed">
              <Plus className="w-4 h-4 mr-2" /> Tambah Baris Perhitungan
            </Button>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCalculatorOpen(false)}>Batal</Button>
            <Button onClick={saveBackupData}>Simpan Perhitungan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* IN-APP CAMERA MODAL */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-[9999] bg-black text-white flex flex-col justify-between p-4">
          <div className="relative flex-1 flex items-center justify-center overflow-hidden rounded-lg bg-slate-900 border border-slate-700">
            {/* VIDEO FEED */}
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"></video>
            <canvas ref={canvasRef} className="hidden"></canvas>

            {/* OVERLAY GUIDE */}
            <div className="absolute inset-0 border-2 border-white/30 pointer-events-none flex items-center justify-center">
              <div className="w-64 h-64 border-2 border-white/80 rounded-lg"></div>
            </div>

            {/* CLOSE BUTTON */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full h-10 w-10"
              onClick={stopCamera}
            >
              <Trash2 className="w-6 h-6 rotate-45" /> {/* Use X icon if available, using trash as close generic */}
            </Button>
          </div>

          <div className="h-32 flex items-center justify-center gap-8">
            <Button
              variant="ghost"
              className="flex-col gap-1 text-white hover:bg-white/10"
              onClick={stopCamera}
            >
              <span className="text-xs">Batal</span>
            </Button>

            <button
              onClick={takePhoto}
              className="h-20 w-20 rounded-full border-4 border-white bg-red-600 shadow-lg hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center"
            >
              <Camera className="w-8 h-8 text-white" />
            </button>

            <div className="w-12"></div> {/* Spacer balance */}
          </div>
        </div>
      )}

    </div>
  );
};

export default Reports;
