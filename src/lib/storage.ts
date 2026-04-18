import { toast } from "sonner";
import { UserRole } from "@/context/AuthContext";

// --- ENTITIES BASED ON PUPR SPEC ---

export interface DKHMaster {
    id: string; // generated
    projectId: string;
    itemCode: string; // e.g., "Divisi 1.1"
    description: string;
    unit: string;
    contractVol: number;
    unitPrice: number;
    totalPrice: number;
    weight?: number; // Calculated Bobot %
}

export interface Project {
    id: string;
    name: string;
    location: string;
    fiscalYear: string;
    contractNo: string;
    contractDate: string; // ISO Date
    hpsValue: number;
    contractValue: number;
    contractorName: string; // In real DB this would be ID
    startDate: string;
    endDate: string;
    dkhItems: DKHMaster[];
    assignedUserId?: string; // New field for assignment

    // New fields for Laporan PPK
    spmkNumber?: string;
    spmkDate?: string;
    executionDuration?: string; // e.g. "120 (Seratus Dua Puluh) Hari Kalender"

    // Addendum / History Support
    addendumCount?: number; // 0 = Original, 1 = Addendum 01, etc.
    history?: ProjectSnapshot[];
}

export interface ProjectSnapshot {
    date: string; // When the snapshot was taken
    description: string; // e.g. "Kontrak Awal"
    contractNo: string;
    contractValue: number;
    startDate: string;
    endDate: string;
    dkhItems: DKHMaster[];
}

export interface DailyReport {
    id: string;
    projectId: string;
    date: string;
    weather: 'Cerah' | 'Hujan' | 'Berawan';
    manpower: number;
    photoUrl?: string; // mock path (Deprecated, use photoUrls[0])
    photoUrls?: string[]; // Array of photo URLs (max 4)
    coords?: string;
    items: {
        dkhId: string;
        dayVol: number; // Volume dikerjakan hari ini
        backupData?: {
            id: string; // generated
            description: string;
            length: number;
            width: number;
            height: number;
            quantity: number;
            vol: number;
        }[];
    }[];
    findings?: string; // Catatan temuan lapangan
    isVerified: boolean;
}

const STORAGE_KEYS = {
    PROJECTS: "sipro_projects_v1",
    REPORTS: "sipro_reports_v1"
};

// --- MOCK DATA GENERATOR ---
const INITIAL_PROJECTS: Project[] = [
    {
        id: "1",
        name: "Pembangunan Jembatan A",
        location: "Sorong",
        fiscalYear: "2024",
        contractNo: "602/KTR/BM/2024",
        contractDate: "2024-01-15",
        hpsValue: 5000000000,
        contractValue: 4850000000,
        contractorName: "CV. Kontraktor Maju",
        startDate: "2024-01-20",
        endDate: "2024-04-20", // 3 Months duration for demo
        dkhItems: [
            { id: "1-1", projectId: "1", itemCode: "Div.1.1", description: "Mobilisasi", unit: "Ls", contractVol: 1, unitPrice: 50000000, totalPrice: 50000000, weight: 1.03 },
            { id: "1-2", projectId: "1", itemCode: "Div.2.1", description: "Galian Tanah", unit: "m3", contractVol: 1500, unitPrice: 150000, totalPrice: 225000000, weight: 4.63 },
            { id: "1-3", projectId: "1", itemCode: "Div.3.1", description: "Pasangan Batu", unit: "m3", contractVol: 800, unitPrice: 1200000, totalPrice: 960000000, weight: 19.79 },
            { id: "1-4", projectId: "1", itemCode: "Div.4.1", description: "Beton K-300", unit: "m3", contractVol: 400, unitPrice: 1800000, totalPrice: 720000000, weight: 14.84 },
        ]
    }
];

// Assign the first project to "4" (STAF_DINAS) for testing
INITIAL_PROJECTS[0].assignedUserId = "4";

export const storage = {
    // --- PROJECTS ---
    getProjects: (): Project[] => {
        const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
        if (!data) {
            localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(INITIAL_PROJECTS));
            return INITIAL_PROJECTS;
        }
        return JSON.parse(data);
    },

    getProjectById: (id: string): Project | undefined => {
        return storage.getProjects().find(p => p.id === id);
    },

    getProjectsByUserId: (userId: string): Project[] => {
        return storage.getProjects().filter(p => p.assignedUserId === userId);
    },

    saveProject: (project: Project) => {
        const list = storage.getProjects();

        // Auto calculate weights
        if (project.contractValue > 0 && project.dkhItems.length > 0) {
            project.dkhItems = project.dkhItems.map(item => ({
                ...item,
                weight: (item.totalPrice / project.contractValue) * 100
            }));
        }

        const idx = list.findIndex(p => p.id === project.id);
        if (idx >= 0) list[idx] = project;
        else list.push(project);

        localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(list));
    },

    // --- DAILY REPORTS ---
    getReports: (projectId: string): DailyReport[] => {
        const data = localStorage.getItem(STORAGE_KEYS.REPORTS);
        const all: DailyReport[] = data ? JSON.parse(data) : [];
        return all.filter(r => r.projectId === projectId).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    },

    saveReport: (report: DailyReport) => {
        const data = localStorage.getItem(STORAGE_KEYS.REPORTS);
        const all: DailyReport[] = data ? JSON.parse(data) : [];
        all.push(report);
        localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(all));
    },

    // --- ANALYTICS ---
    // Calculates detailed stats for Dashboard
    getProjectAnalytics: (projectId: string) => {
        const project = storage.getProjectById(projectId);
        if (!project) return null;

        const reports = storage.getReports(projectId);
        const today = new Date();

        // 1. Calculate Realization Per Item
        const realizationMap: Record<string, number> = {}; // dkhId -> totalVol
        reports.forEach(r => {
            r.items.forEach(i => {
                realizationMap[i.dkhId] = (realizationMap[i.dkhId] || 0) + i.dayVol;
            });
        });

        let totalRealizationValue = 0;

        const itemsStats = project.dkhItems.map(item => {
            const volReal = realizationMap[item.id] || 0;
            // Cap progress at 100% just in case
            let progressPercent = (volReal / item.contractVol) * 100;
            const valReal = volReal * item.unitPrice;

            totalRealizationValue += valReal;

            // Status Item (Simplified Critical Path detection)
            // Ideally this compares Scheduled vs Actual per item, 
            // but without a detailed Gantt chart, we use a heuristic:
            // If we are halfway through project duration but item < 50%, it *might* be slow?
            // Better heuristic provided by user: "Progres Item < Target" -> but we don't have per-item target.
            // We will leave status calculation for later or simply based on Low Progress (<10%) if Contract Time is high.

            return {
                ...item,
                volReal,
                progressPercent,
                valReal
            };
        });

        const overallProgress = (totalRealizationValue / project.contractValue) * 100;

        // 2. Time & Deviation
        const start = new Date(project.startDate);
        const end = new Date(project.endDate);
        const totalDays = Math.max(1, (end.getTime() - start.getTime()) / (1000 * 3600 * 24));
        const daysElapsed = Math.max(0, (today.getTime() - start.getTime()) / (1000 * 3600 * 24));

        // Simple Plan: Linear (Straight Line S-Curve) -> % Time Elapsed = % Planned Progress
        let plannedProgress = (daysElapsed / totalDays) * 100;
        if (plannedProgress > 100) plannedProgress = 100;
        if (plannedProgress < 0) plannedProgress = 0;

        // Deviation
        const deviation = overallProgress - plannedProgress;

        return {
            project,
            itemsStats,
            overallProgress,
            plannedProgress,
            deviation,
            daysRemaining: Math.ceil(Math.max(0, totalDays - daysElapsed)),
            contractValue: project.contractValue
        };
    },

    // 3. Analytics by Date Range (For Weekly/Monthly Reports)
    getProjectAnalyticsByDate: (projectId: string, startDate: Date, endDate: Date) => {
        const project = storage.getProjectById(projectId);
        if (!project) return null;

        const reports = storage.getReports(projectId);

        // Filter reports within range
        const periodReports = reports.filter(r => {
            const d = new Date(r.date);
            return d >= startDate && d <= endDate;
        });

        // Filter reports BEFORE range (for "Previous" column)
        const prevReports = reports.filter(r => {
            const d = new Date(r.date);
            return d < startDate;
        });

        // 1. Calculate Realization
        const periodRealizationMap: Record<string, number> = {};
        const prevRealizationMap: Record<string, number> = {};
        const totalRealizationMap: Record<string, number> = {};

        periodReports.forEach(r => r.items.forEach(i => periodRealizationMap[i.dkhId] = (periodRealizationMap[i.dkhId] || 0) + i.dayVol));
        prevReports.forEach(r => r.items.forEach(i => prevRealizationMap[i.dkhId] = (prevRealizationMap[i.dkhId] || 0) + i.dayVol));

        // Merge for Total
        project.dkhItems.forEach(item => {
            totalRealizationMap[item.id] = (prevRealizationMap[item.id] || 0) + (periodRealizationMap[item.id] || 0);
        });

        let totalPeriodVal = 0;
        let totalPrevVal = 0;
        let totalCumVal = 0;

        const itemsStats = project.dkhItems.map(item => {
            const periodVol = periodRealizationMap[item.id] || 0;
            const prevVol = prevRealizationMap[item.id] || 0;
            const cumVol = totalRealizationMap[item.id] || 0;

            const periodVal = periodVol * item.unitPrice;
            const prevVal = prevVol * item.unitPrice;
            const cumVal = cumVol * item.unitPrice;

            totalPeriodVal += periodVal;
            totalPrevVal += prevVal;
            totalCumVal += cumVal;

            return {
                ...item,
                periodVol,
                prevVol,
                cumVol,
                periodPct: (periodVal / project.contractValue) * 100,
                prevPct: (prevVal / project.contractValue) * 100,
                cumPct: (cumVal / project.contractValue) * 100
            };
        });

        const periodProgress = (totalPeriodVal / project.contractValue) * 100;
        const prevProgress = (totalPrevVal / project.contractValue) * 100;
        const overallProgress = (totalCumVal / project.contractValue) * 100;

        // Schedule / Plan Mocking (Linear)
        // Correct way: We need a Schedule Item per week.
        // Heuristic: Calculate % Time Elapsed up to EndDate vs StartDate
        const projectDescStart = new Date(project.startDate);
        const projectDescEnd = new Date(project.endDate);
        const totalProjectDays = (projectDescEnd.getTime() - projectDescStart.getTime()) / (1000 * 3600 * 24);

        const daysUntilPeriodEnd = (endDate.getTime() - projectDescStart.getTime()) / (1000 * 3600 * 24);
        const daysUntilPeriodStart = (startDate.getTime() - projectDescStart.getTime()) / (1000 * 3600 * 24);

        const plannedCum = Math.min(100, Math.max(0, (daysUntilPeriodEnd / totalProjectDays) * 100));
        const plannedPrev = Math.min(100, Math.max(0, (daysUntilPeriodStart / totalProjectDays) * 100));
        const plannedPeriod = Math.max(0, plannedCum - plannedPrev);

        return {
            itemsStats,
            periodProgress,
            prevProgress,
            overallProgress,
            plannedPeriod,
            plannedPrev,
            plannedCum,
            deviation: overallProgress - plannedCum
        };
    },

    getSCurveData: (projectId: string) => {
        const project = storage.getProjectById(projectId);
        if (!project) return [];

        const reports = storage.getReports(projectId);
        const start = new Date(project.startDate);
        const end = new Date(project.endDate);

        // Generate Weeks
        const totalWeeks = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24 * 7));
        const data = [];

        // Ideally, "Planned" is an S-curve, not linear. 
        // Approximation: 1st quarter slow, middle fast, last quarter slow?
        // For simplicity, we stick to generic S-like distribution or Linear.
        // Let's use Linear for now to be safe.
        const weeklyPlanIncrement = 100 / totalWeeks;

        for (let i = 1; i <= totalWeeks; i++) {
            const weekEnd = new Date(start.getTime() + i * 7 * 24 * 3600 * 1000);

            // Calculate Actual (All reports up to this week)
            // Optimization: In real app, dont loop reports every time.
            const reportsUntilNow = reports.filter(r => new Date(r.date) <= weekEnd);

            let valReal = 0;
            const volMap: Record<string, number> = {};
            reportsUntilNow.forEach(r => r.items.forEach(it => volMap[it.dkhId] = (volMap[it.dkhId] || 0) + it.dayVol));

            project.dkhItems.forEach(item => {
                valReal += (volMap[item.id] || 0) * item.unitPrice;
            });

            const actualPct = (valReal / project.contractValue) * 100;

            // Calculate Plan (Linear)
            const planPct = Math.min(100, i * weeklyPlanIncrement);

            data.push({
                week: `Mg ${i}`,
                planned: Number(planPct.toFixed(2)),
                actual: weekEnd > new Date() ? null : Number(actualPct.toFixed(2)) // Don't show actual for future
            });
        }
        return data;
    },

    // --- BACKUP & RESTORE ---
    exportDatabase: () => {
        const projects = localStorage.getItem(STORAGE_KEYS.PROJECTS) || "[]";
        const reports = localStorage.getItem(STORAGE_KEYS.REPORTS) || "[]";

        return JSON.stringify({
            version: 1,
            timestamp: new Date().toISOString(),
            projects: JSON.parse(projects),
            reports: JSON.parse(reports)
        }, null, 2);
    },

    importDatabase: (jsonString: string) => {
        try {
            const data = JSON.parse(jsonString);
            if (!data.projects || !data.reports) {
                throw new Error("Format backup tidak valid");
            }

            localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(data.projects));
            localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(data.reports));
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    }
};
