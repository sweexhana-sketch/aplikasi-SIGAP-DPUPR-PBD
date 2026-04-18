import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "sonner";

export type UserRole =
  | "ADMIN"
  | "PPK"
  | "PPTK"
  | "STAF_DINAS"
  | "OPERATOR"
  | "KONSULTAN"
  | "KONTRAKTOR";

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
  nip?: string;
}

interface AuthContextType {
  user: User | null;
  login: (role: UserRole) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// MOCK USERS DATA
export const MOCK_USERS: Record<UserRole, User> = {
  ADMIN: {
    id: "1",
    name: "Administrator Sistem",
    role: "ADMIN",
    nip: "19800101 200501 1 001"
  },
  PPK: {
    id: "2",
    name: "Yakobus t. Pambimbin, ST., M.T.",
    role: "PPK",
    nip: "19850202 201001 1 002"
  },
  PPTK: {
    id: "3",
    name: "Calvin Asmuruf, ST",
    role: "PPTK",
    nip: "19880303 201201 2 003"
  },
  STAF_DINAS: {
    id: "4",
    name: "MESAK STAF",
    role: "STAF_DINAS",
    nip: "19900404 201501 1 004"
  },
  OPERATOR: {
    id: "5",
    name: "Andi Operator",
    role: "OPERATOR"
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
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check localStorage on mount - updated key to sipro_user
    const storedUser = localStorage.getItem("sipro_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user from storage");
      }
    }
  }, []);

  const login = (role: UserRole) => {
    const selectedUser = MOCK_USERS[role];
    setUser(selectedUser);
    localStorage.setItem("sipro_user", JSON.stringify(selectedUser));
    toast.success(`Selamat datang, ${selectedUser.name}!`);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("sipro_user");
    toast.info("Anda telah logout.");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
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
