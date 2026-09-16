import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "sonner";

export type UserRole =
  | "ADMIN"
  | "PPK"
  | "PPTK"
  | "STAF_DINAS"
  | "KONTRAKTOR_UMUM"
  | "KONSULTAN"
  | "KONTRAKTOR"
  | "PIMPINAN";

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
  nip?: string;
  skNumber?: string;       // Nomor SK Penetapan Pejabat
  bidang?: string;         // Bidang/Sub-Dinas (Bina Marga, Cipta Karya, SDA, dll)
  jabatan?: string;        // Jabatan Resmi SK
  companyName?: string;    // Nama Perusahaan (CV / PT)
  directorName?: string;   // Nama Direktur / Penanggung Jawab
  npwp?: string;           // NPWP Perusahaan
  tenderType?: "Menang Tender" | "Penunjukan Langsung"; // Status Penetapan Pekerjaan
  assignedPackage?: string; // Nama Paket Pekerjaan Yang Ditunjuk / Dimenangkan
  spkNumber?: string;      // Nomor SPK / Kontrak / Surat Penunjukan
  registeredAt?: string;
}

interface AuthContextType {
  user: User | null;
  login: (role: UserRole) => void;
  loginWithUser: (user: User) => void;
  registerAccount: (accountData: Omit<User, "id">) => User;
  getRegisteredAccounts: (role?: UserRole) => User[];
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// INITIAL REGISTERED ACCOUNTS FOR PPK, PPTK, KONSULTAN, & KONTRAKTOR NON-OAP
export const DEFAULT_REGISTERED_USERS: User[] = [
  // PEJABAT PPK & PPTK
  {
    id: "ppk-1",
    name: "Ir. Yohanes Kambu, S.T., M.T.",
    role: "PPK",
    nip: "19790412 200501 1 008",
    skNumber: "800.1/04/SK-PPK/PUPR/2024",
    bidang: "Bina Marga",
    jabatan: "Pejabat Pembuat Komitmen Bidang Bina Marga",
    registeredAt: "2024-01-10"
  },
  {
    id: "ppk-2",
    name: "Drs. Markus Asmuruf, M.Si.",
    role: "PPK",
    nip: "19810815 200804 1 003",
    skNumber: "800.1/05/SK-PPK/PUPR/2024",
    bidang: "Cipta Karya",
    jabatan: "Pejabat Pembuat Komitmen Bidang Cipta Karya",
    registeredAt: "2024-01-10"
  },
  {
    id: "pptk-1",
    name: "Stephanus Rumbewas, S.T.",
    role: "PPTK",
    nip: "19850320 201101 1 005",
    skNumber: "800.1/12/SK-PPTK/PUPR/2024",
    bidang: "Bina Marga",
    jabatan: "Pejabat Pelaksana Teknis Kegiatan Pembangunan Jalan & Jembatan",
    registeredAt: "2024-01-12"
  },
  {
    id: "pptk-2",
    name: "Maria Novita Limbong, S.T.",
    role: "PPTK",
    nip: "19891104 201402 2 002",
    skNumber: "800.1/14/SK-PPTK/PUPR/2024",
    bidang: "Cipta Karya",
    jabatan: "Pejabat Pelaksana Teknis Kegiatan Drainase & Sanitasi",
    registeredAt: "2024-01-12"
  },
  // KONSULTAN PENGAWAS (MENANG TENDER / PENUNJUKAN LANGSUNG)
  {
    id: "kons-1",
    name: "PT. Konsultan Engineering Papua",
    companyName: "PT. Konsultan Engineering Papua",
    directorName: "Ir. Fransiskus Saidui, S.T.",
    role: "KONSULTAN",
    npwp: "01.234.567.8-951.000",
    tenderType: "Menang Tender",
    assignedPackage: "Pembangunan Jembatan A",
    spkNumber: "602/SPK-KONS/BM/2024",
    bidang: "Bina Marga",
    registeredAt: "2024-01-15"
  },
  {
    id: "kons-2",
    name: "CV. Cipta Karya Consultant",
    companyName: "CV. Cipta Karya Consultant",
    directorName: "Ir. Hermanus Kabiay",
    role: "KONSULTAN",
    npwp: "02.345.678.9-951.000",
    tenderType: "Penunjukan Langsung",
    assignedPackage: "Rehabilitasi Gedung Dinas PUPR",
    spkNumber: "602/PL-KONS/CK/2024",
    bidang: "Cipta Karya",
    registeredAt: "2024-01-18"
  },
  // KONTRAKTOR NON-OAP (MENANG TENDER / PENUNJUKAN LANGSUNG)
  {
    id: "kont-1",
    name: "PT. Jaya Konstruksi Nusantara",
    companyName: "PT. Jaya Konstruksi Nusantara",
    directorName: "Budi Santoso, S.T.",
    role: "KONTRAKTOR_UMUM",
    npwp: "03.456.789.0-951.000",
    tenderType: "Menang Tender",
    assignedPackage: "Pembangunan Jembatan A",
    spkNumber: "602/KTR/BM/2024",
    bidang: "Bina Marga",
    registeredAt: "2024-01-15"
  },
  {
    id: "kont-2",
    name: "CV. Mitra Pembangunan Papua",
    companyName: "CV. Mitra Pembangunan Papua",
    directorName: "Agus Setiawan",
    role: "KONTRAKTOR_UMUM",
    npwp: "04.567.890.1-951.000",
    tenderType: "Penunjukan Langsung",
    assignedPackage: "Peningkatan Jalan Lingkungan Sorong",
    spkNumber: "603/PL-KTR/BM/2024",
    bidang: "Bina Marga",
    registeredAt: "2024-01-20"
  }
];

// FALLBACK MOCK USERS DATA FOR DIRECT ROLE LOGIN
export const MOCK_USERS: Record<UserRole, User> = {
  ADMIN: {
    id: "1",
    name: "Administrator Sistem",
    role: "ADMIN",
    nip: "19850101 201001 1 001"
  },
  PPK: DEFAULT_REGISTERED_USERS[0],
  PPTK: DEFAULT_REGISTERED_USERS[2],
  STAF_DINAS: {
    id: "4",
    name: "Staf Dinas PUPR",
    role: "STAF_DINAS",
    nip: "19900404 201501 1 004"
  },
  KONTRAKTOR_UMUM: {
    id: "5",
    name: "CV. Kontraktor Umum",
    role: "KONTRAKTOR_UMUM"
  },
  KONSULTAN: {
    id: "6",
    name: "PT. Konsultan Jaya",
    role: "KONSULTAN"
  },
  KONTRAKTOR: {
    id: "7",
    name: "CV. Kontraktor Maju",
    role: "KONTRAKTOR"
  },
  PIMPINAN: {
    id: "8",
    name: "Kepala Dinas PUPR (Pimpinan)",
    role: "PIMPINAN",
    nip: "19720101 199503 1 001"
  },
};

const STORAGE_USERS_KEY = "sipro_registered_accounts_v1";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Initialize default accounts in storage if not present
    const existingAccounts = localStorage.getItem(STORAGE_USERS_KEY);
    if (!existingAccounts) {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(DEFAULT_REGISTERED_USERS));
    }

    // Check localStorage for logged-in user
    const storedUser = localStorage.getItem("sipro_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user from storage");
      }
    }
  }, []);

  const getRegisteredAccounts = (role?: UserRole): User[] => {
    try {
      const data = localStorage.getItem(STORAGE_USERS_KEY);
      const accounts: User[] = data ? JSON.parse(data) : DEFAULT_REGISTERED_USERS;
      if (role) {
        return accounts.filter(a => a.role === role);
      }
      return accounts;
    } catch (e) {
      return DEFAULT_REGISTERED_USERS;
    }
  };

  const registerAccount = (accountData: Omit<User, "id">): User => {
    const existing = getRegisteredAccounts();
    const newUser: User = {
      ...accountData,
      id: `usr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      registeredAt: new Date().toISOString().split('T')[0]
    };

    const updated = [newUser, ...existing];
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(updated));
    loginWithUser(newUser);
    return newUser;
  };

  const loginWithUser = (selectedUser: User) => {
    setUser(selectedUser);
    localStorage.setItem("sipro_user", JSON.stringify(selectedUser));
    toast.success(`Selamat datang, ${selectedUser.name}! (${selectedUser.role})`);
  };

  const login = (role: UserRole) => {
    const registered = getRegisteredAccounts(role);
    const selectedUser = registered.length > 0 ? registered[0] : MOCK_USERS[role];
    loginWithUser(selectedUser);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("sipro_user");
    toast.info("Anda telah logout.");
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      loginWithUser,
      registerAccount, 
      getRegisteredAccounts,
      logout, 
      isAuthenticated: !!user 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
