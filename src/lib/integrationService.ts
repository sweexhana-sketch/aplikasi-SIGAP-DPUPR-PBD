import { toast } from "sonner";

// ============================================================
// DATA-KONTRAKTOR-OAP Integration Service
// Base URL: https://data-kontraktor-oap-web.vercel.app
// API Routes discovered from GitHub repo:
//   GET  /api/contractors         - list all contractors
//   GET  /api/stats               - platform statistics
//   POST /api/auth/callback/credentials - auth
//   GET  /api/certifications      - certifications
//   GET  /api/projects            - projects from OAP
// ============================================================

const OAP_BASE_URL = "https://data-kontraktor-oap-web.vercel.app";
const STORAGE_KEYS = {
  CONTRACTORS: "sipro_oap_contractors",
  STATS: "sipro_oap_stats",
  LAST_SYNC: "sipro_oap_last_sync",
  API_SESSION: "sipro_oap_session",
};

export interface OAPContractor {
  id: string;
  name: string;
  npwp?: string;
  address?: string;
  phone?: string;
  email?: string;
  classification?: string;
  qualification?: string;
  isOAP?: boolean;
  registrationNumber?: string;
  createdAt?: string;
}

export interface OAPStats {
  totalContractors: number;
  totalProjects: number;
  totalCertifications: number;
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
// Core fetch helper with CORS + error handling
// ---------------------------------------------------------------
async function oapFetch(path: string, options?: RequestInit): Promise<Response> {
  const response = await fetch(`${OAP_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      ...(options?.headers || {}),
    },
    // credentials: "include", // Uncomment if cookies needed after auth
  });
  return response;
}

// ---------------------------------------------------------------
// Main Integration Service
// ---------------------------------------------------------------
export const integrationService = {

  // ===========================
  // FETCH CONTRACTORS FROM OAP
  // ===========================
  fetchContractors: async (): Promise<OAPContractor[]> => {
    try {
      const res = await oapFetch("/api/contractors");
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();

      // Normalize data structure - OAP may return array directly or nested
      const contractors: OAPContractor[] = Array.isArray(data) 
        ? data 
        : (data.contractors || data.data || []);

      return contractors;
    } catch (err: any) {
      console.error("[SI PRO Integration] fetchContractors error:", err);
      throw new Error(`Gagal mengambil data kontraktor dari OAP: ${err.message}`);
    }
  },

  // ===========================
  // FETCH PLATFORM STATS
  // ===========================
  fetchStats: async (): Promise<OAPStats | null> => {
    try {
      const res = await oapFetch("/api/stats");
      if (!res.ok) return null;
      const data = await res.json();
      return data as OAPStats;
    } catch (err) {
      console.error("[SI PRO Integration] fetchStats error:", err);
      return null;
    }
  },

  // ===========================
  // SYNC: FETCH + SAVE TO LOCAL
  // ===========================
  syncAll: async (): Promise<OAPSyncResult> => {
    const timestamp = new Date().toISOString();
    
    try {
      const [contractors, stats] = await Promise.allSettled([
        integrationService.fetchContractors(),
        integrationService.fetchStats(),
      ]);

      const contractorData: OAPContractor[] = 
        contractors.status === "fulfilled" ? contractors.value : [];
      const statsData: OAPStats | null = 
        stats.status === "fulfilled" ? stats.value : null;

      // Save to localStorage
      localStorage.setItem(STORAGE_KEYS.CONTRACTORS, JSON.stringify(contractorData));
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, timestamp);
      if (statsData) {
        localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(statsData));
      }

      const result: OAPSyncResult = {
        success: true,
        contractors: contractorData,
        stats: statsData,
        timestamp,
      };

      return result;

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
  // GET CACHED LOCAL DATA
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
  // CHECK CONNECTIVITY
  // ===========================
  checkConnection: async (): Promise<{ online: boolean; latency?: number; error?: string }> => {
    const start = Date.now();
    try {
      const res = await oapFetch("/api/stats");
      const latency = Date.now() - start;
      return { online: res.ok || res.status === 401, latency }; // 401 = server online but auth required
    } catch (err: any) {
      return { online: false, error: err.message };
    }
  },

  // ===========================
  // CLEAR LOCAL CACHE
  // ===========================
  clearCache: () => {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  },

  // ===========================
  // LINK KONTRAKTOR OAP → SI PRO
  // Match contractor name from OAP with a project in SI PRO
  // ===========================
  matchContractorToProject: (contractorName: string, localContractors: OAPContractor[]): OAPContractor | null => {
    if (!contractorName || localContractors.length === 0) return null;
    const normalized = contractorName.toLowerCase().trim();
    return localContractors.find(c => 
      c.name?.toLowerCase().includes(normalized) || normalized.includes(c.name?.toLowerCase() || "")
    ) || null;
  },

  OAP_BASE_URL,
};

export default integrationService;
