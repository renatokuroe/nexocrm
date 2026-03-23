"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { User } from "@/types/domain";

// Auth hook centralizes token/user access and auth actions.
export function useAuth() {
    const router = useRouter();

    const token =
        typeof window !== "undefined" ? localStorage.getItem("nexo_token") : null;

    const user = useMemo<User | null>(() => {
        if (typeof window === "undefined") return null;
        const raw = localStorage.getItem("nexo_user");
        if (!raw) return null;
        try {
            return JSON.parse(raw) as User;
        } catch {
            return null;
        }
    }, []);

    const login = (authToken: string, authUser: User) => {
        localStorage.setItem("nexo_token", authToken);
        localStorage.setItem("nexo_user", JSON.stringify(authUser));
        router.push("/dashboard");
    };

    const logout = () => {
        localStorage.removeItem("nexo_token");
        localStorage.removeItem("nexo_user");
        router.push("/login");
    };

    return {
        token,
        user,
        isAuthenticated: !!token,
        login,
        logout,
    };
}
