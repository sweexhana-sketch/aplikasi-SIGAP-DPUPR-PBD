import { toast } from "sonner";

// ============================================================
// DATA-KONTRAKTOR-OAP Integration Service  v2.1
// Base URL: https://data-kontraktor-oap-web.vercel.app
//
// ✅ Public endpoints (no auth cookie required):
//   GET /api/integration/contractors  - daftar semua kontraktor
//   GET /api/integration/contractors/:id - detail kontraktor
//   GET /api/integration/stats        - statistik ringkasan
// ============================================================

const OAP_BASE_URL = "https://data-kontraktor-oap-web.vercel.app";

const STORAGE_KEYS = {
  CONTRACTORS: "sipro_oap_contractors",
  STATS: "sipro_oap_stats",
  LAST_SYNC: "sipro_oap_last_sync",
  API_SESSION: "sipro_oap_session",
};

// ---------------------------------------------------------------
// Raw DB shape dari DATA-KONTRAKTOR-OAP
// ---------------------------------------------------------------
interface RawOAPContractor {
  id: string;
  company_name?: string;
  full_name?: string;
  npwp?: string;
  address?: string;
  company_address?: string;
  phone?: string;
  email?: string;
  small_classification?: string;
  medium_classification?: string;
  large_classification?: string;
  company_type?: string;
  city?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  // legacy fallback
  name?: string;
  classification?: string;
  isOAP?: boolean;
}

// ---------------------------------------------------------------
// Normalized shape yang digunakan di dalam SI PRO
// ---------------------------------------------------------------
export interface OAPContractor {
  id: string;
  name: string;         // = company_name
  directorName?: string; // = full_name
  npwp?: string;
  address?: string;
  phone?: string;
  email?: string;
  classification?: string;
  companyType?: string;
  city?: string;
  status?: string;
  isOAP?: boolean;
  registrationNumber?: string;
  createdAt?: string;
}

export interface OAPStats {
  totalContractors: number;
  totalProjects: number;
  totalCertifications: number;
  pending?: number;
  approved?: number;
  rejected?: number;
  lastUpdated: string;
}

export interface OAPSyncResult {
  success: boolean;
  contractors: OAPContractor[];
  stats: OAPStats | null;
  error?: string;
  timestamp: string;
}

// ---------------------------------------------------------------
// Normalize raw DB row → OAPContractor (mapping field DB)
// ---------------------------------------------------------------
function normalizeContractor(raw: RawOAPContractor): OAPContractor {
  const classification =
    raw.small_classification ||
    raw.medium_classification ||
    raw.large_classification ||
    raw.classification ||
    undefined;

  return {
    id: raw.id,
    name: raw.company_name || raw.name || raw.full_name || "-",
    directorName: raw.full_name,
    npwp: raw.npwp,
    address: raw.company_address || raw.address,
    phone: raw.phone,
    email: raw.email,
    classification,
    companyType: raw.company_type,
    city: raw.city,
    status: raw.status,
    isOAP: true,
    createdAt: raw.created_at,
  };
}

// ---------------------------------------------------------------
// Core fetch helper — menggunakan endpoint publik /api/integration/*
// ---------------------------------------------------------------
async function oapFetch(path: string, options?: RequestInit): Promise<Response> {
  const response = await fetch(`${OAP_BASE_URL}${path}`, {
    ...options,
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options?.headers || {}),
    },
  });
  return response;
}

// ---------------------------------------------------------------
// Main Integration Service
// ---------------------------------------------------------------
export const integrationService = {

  // ===========================
  // FETCH CONTRACTORS — endpoint publik baru ✅
  // ===========================
  fetchContractors: async (): Promise<OAPContractor[]> => {
    try {
      const res = await oapFetch("/api/integration/contractors?limit=500");
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();

      // data.contractors = array of raw DB rows
      const rawList: RawOAPContractor[] = Array.isArray(data)
        ? data
        : (data.contractors || data.data || []);

      return rawList.map(normalizeContractor);
    } catch (err: any) {
      console.error("[SI PRO Integration] fetchContractors error:", err);
      throw new Error(`Gagal mengambil data kontraktor dari OAP: ${err.message}`);
    }
  },

  // ===========================
  // FETCH STATS — endpoint publik baru ✅
  // ===========================
  fetchStats: async (): Promise<OAPStats | null> => {
    try {
      const res = await oapFetch("/api/integration/stats");
      if (!res.ok) return null;
      const data = await res.json();

      const s = data.stats || data;
      return {
        totalContractors: s.total ?? s.totalContractors ?? 0,
        totalProjects: 0,
        totalCertifications: 0,
        pending: s.pending ?? 0,
        approved: s.approved ?? 0,
        rejected: s.rejected ?? 0,
        lastUpdated: data.synced_at || new Date().toISOString(),
      } as OAPStats;
    } catch (err) {
      console.error("[SI PRO Integration] fetchStats error:", err);
      return null;
    }
  },

  // ===========================
  // SYNC ALL — ambil + simpan ke localStorage
  // ===========================
  syncAll: async (): Promise<OAPSyncResult> => {
    const timestamp = new Date().toISOString();

    try {
      const [contractorsResult, statsResult] = await Promise.allSettled([
        integrationService.fetchContractors(),
        integrationService.fetchStats(),
      ]);

      const contractorData: OAPContractor[] =
        contractorsResult.status === "fulfilled" ? contractorsResult.value : [];
      const statsData: OAPStats | null =
        statsResult.status === "fulfilled" ? statsResult.value : null;

      if (contractorsResult.status === "rejected") {
        console.error("[Integration] contractors fetch failed:", contractorsResult.reason);
      }

      localStorage.setItem(STORAGE_KEYS.CONTRACTORS, JSON.stringify(contractorData));
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, timestamp);
      if (statsData) {
        localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(statsData));
      }

      return {
        success: contractorData.length > 0 || statsData !== null,
        contractors: contractorData,
        stats: statsData,
        timestamp,
        error:
          contractorData.length === 0
            ? "Tidak ada data kontraktor yang diterima dari OAP"
            : undefined,
      };
    } catch (err: any) {
      return {
        success: false,
        contractors: [],
        stats: null,
        error: err.message,
        timestamp,
      };
    }
  },

  // ===========================
  // GET CACHED LOCAL DATA (dibaca oleh CreateProject & halaman lain)
  // ===========================
  getLocalContractors: (): OAPContractor[] => {
    const raw = localStorage.getItem(STORAGE_KEYS.CONTRACTORS);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as OAPContractor[];
    } catch {
      return [];
    }
  },

  getLocalStats: (): OAPStats | null => {
    const raw = localStorage.getItem(STORAGE_KEYS.STATS);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as OAPStats;
    } catch {
      return null;
    }
  },

  getLastSync: (): string | null => {
    return localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
  },

  // ===========================
  // CHECK CONNECTIVITY — pakai endpoint publik ✅
  // ===========================
  checkConnection: async (): Promise<{ online: boolean; latency?: number; error?: string }> => {
    const start = Date.now();
    try {
      const res = await oapFetch("/api/integration/stats");
      const latency = Date.now() - start;
      if (res.ok) {
        return { online: true, latency };
      }
      return {
        online: false,
        error: `HTTP ${res.status}: ${res.statusText}`,
      };
    } catch (err: any) {
      return { online: false, error: err.message };
    }
  },

  // ===========================
  // CLEAR LOCAL CACHE
  // ===========================
  clearCache: () => {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  },

  // ===========================
  // MATCH KONTRAKTOR OAP → SI PRO (digunakan di form proyek)
  // ===========================
  matchContractorToProject: (
    contractorName: string,
    localContractors: OAPContractor[]
  ): OAPContractor | null => {
    if (!contractorName || localContractors.length === 0) return null;
    const normalized = contractorName.toLowerCase().trim();
    return (
      localContractors.find(
        (c) =>
          c.name?.toLowerCase().includes(normalized) ||
          normalized.includes(c.name?.toLowerCase() || "")
      ) || null
    );
  },

  OAP_BASE_URL,
};

export default integrationService;
