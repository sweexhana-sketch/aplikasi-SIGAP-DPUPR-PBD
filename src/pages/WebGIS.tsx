import Header from "@/components/Header";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, LayersControl, LayerGroup, Polygon } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { storage, Project, DailyReport } from "@/lib/storage";
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

// Fix Leaflet Default Icon (Project - Blue)
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Report Icon (Orange/Red)
// Using a CSS filter trick or different URL if available, but for now we reuse generic with popup diff.
// Or we can create a custom DivIcon.
const reportIcon = L.divIcon({
  className: 'custom-div-icon',
  html: "<div style='background-color:#f97316;width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.4);'></div>",
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

const WebGIS = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    const allProjects = storage.getProjects();
    setProjects(allProjects);

    // Fetch all reports to show their locations
    let allReports: DailyReport[] = [];
    allProjects.forEach(p => {
      const pReports = storage.getReports(p.id);
      allReports = [...allReports, ...pReports];
    });
    setReports(allReports);
  }, []);

  // Center of Papua Barat Daya (Approximate)
  const centerPosition: [number, number] = [-0.88, 131.25];

  // Mock Batas Desa (Since we don't have the file yet)
  const batasDesaPlaceholder = [
    [-0.85, 131.20],
    [-0.85, 131.30],
    [-0.95, 131.30],
    [-0.95, 131.20],
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <div className="flex-1 container py-6 flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">WebGIS SI PRO (OpenStreetMap)</h1>
            <p className="text-slate-500">Peta Sebaran Proyek & Lokasi Laporan Lapangan (v2.1 OSM)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[70vh]">
          <Card className="lg:col-span-2 h-full overflow-hidden shadow-md">
            <MapContainer center={centerPosition} zoom={10} style={{ height: "100%", width: "100%" }}>
              <LayersControl position="topright">
                <LayersControl.BaseLayer checked name="OpenStreetMap">
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                </LayersControl.BaseLayer>

                <LayersControl.Overlay checked name="Batas Desa (Placeholder - Need Data)">
                  <Polygon pathOptions={{ color: 'orange', fillOpacity: 0.1, dashArray: '5,5' }} positions={batasDesaPlaceholder as any} />
                </LayersControl.Overlay>

                <LayersControl.Overlay checked name="Lokasi Proyek">
                  <LayerGroup>
                    {projects.map((p) => {
                      // Mock Coordinates for Demo based on ID (as Project interface lacks lat/lng)
                      let lat = -0.8614;
                      let lng = 131.1244;
                      const idNum = parseInt(p.id) || 1;
                      if (idNum % 2 === 0) { lat = -0.88; lng = 131.25; }
                      if (idNum % 3 === 0) { lat = -0.86; lng = 134.06; }

                      return (
                        <Marker
                          key={`proj-${p.id}`}
                          position={[lat, lng]}
                          eventHandlers={{
                            click: () => setSelectedProject(p),
                          }}
                        >
                          <Popup>
                            <div className="p-2">
                              <h3 className="font-bold">{p.name}</h3>
                              <p className="text-xs">Kontraktor: {p.contractorName}</p>
                              <div className="mt-2 text-xs text-blue-600 font-semibold cursor-pointer" onClick={() => setSelectedProject(p)}>
                                Lihat Detail
                              </div>
                            </div>
                          </Popup>
                        </Marker>
                      )
                    })}
                  </LayerGroup>
                </LayersControl.Overlay>

                <LayersControl.Overlay checked name="Lokasi Laporan Harian">
                  <LayerGroup>
                    {reports.map((r) => {
                      if (!r.coords) return null;
                      const [latStr, lngStr] = r.coords.split(',');
                      if (!latStr || !lngStr) return null;
                      const lat = parseFloat(latStr.trim());
                      const lng = parseFloat(lngStr.trim());
                      if (isNaN(lat) || isNaN(lng)) return null;

                      // Find related project name
                      const projName = projects.find(p => p.id === r.projectId)?.name || "Unknown Project";

                      return (
                        <Marker
                          key={`rep-${r.id}`}
                          position={[lat, lng]}
                          icon={reportIcon}
                        >
                          <Popup>
                            <div className="p-2 text-xs">
                              <p className="font-bold text-orange-600">Laporan Lapangan</p>
                              <p>Proyek: {projName}</p>
                              <p>Tanggal: {r.date}</p>
                              <p>GPS: {lat.toFixed(5)}, {lng.toFixed(5)}</p>
                              {r.photoUrl && r.photoUrl.startsWith("blob") && (
                                <div className="mt-1 w-20 h-20 bg-slate-100 rounded overflow-hidden">
                                  <img src={r.photoUrl} alt="Foto" className="w-full h-full object-cover" />
                                </div>
                              )}
                            </div>
                          </Popup>
                        </Marker>
                      )
                    })}
                  </LayerGroup>
                </LayersControl.Overlay>
              </LayersControl>
            </MapContainer>
          </Card>

          <Card className="h-full overflow-auto shadow-md">
            <CardContent className="p-6">
              {selectedProject ? (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold">{selectedProject.name}</h2>
                    <Badge className="mt-2 bg-blue-600">Aktif</Badge>
                  </div>
                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex justify-between border-b pb-2">
                      <span>Nomor Kontrak</span>
                      <span className="font-medium text-right">{selectedProject.contractNo}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span>Kontraktor</span>
                      <span className="font-medium text-right">{selectedProject.contractorName}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span>Nilai Kontrak</span>
                      <span className="font-medium text-right">Rp {selectedProject.contractValue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span>Lokasi</span>
                      <span className="font-medium text-right">{selectedProject.location}</span>
                    </div>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 p-3 rounded text-xs text-yellow-800">
                    <p><strong>Info Layer:</strong></p>
                    <p>Menampilkan sebaran titik proyek (Biru) dan titik pengambilan koordinat laporan harian (Oranye).</p>
                    <p className="mt-1">Layer <em>Batas Desa</em> membutuhkan file GeoJSON.</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
                  <p className="mb-2">Pilih proyek pada peta untuk melihat detail.</p>
                  <div className="text-xs space-y-1">
                    <p>🟦 {projects.length} Titik Proyek</p>
                    <p>🟠 {reports.length} Laporan Lapangan</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WebGIS;
