"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "@/types/domain";

// Auth hook centralizes token/user access and auth actions.
export function useAuth() {
    const router = useRouter();
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const savedToken = localStorage.getItem("nexo_token");
        const rawUser = localStorage.getItem("nexo_user");

        setToken(savedToken);

        if (!rawUser) {
            setUser(null);
            return;
        }

        try {
            setUser(JSON.parse(rawUser) as User);
        } catch {
            setUser(null);
        }
    }, []);

    const login = (authToken: string, authUser: User) => {
        localStorage.setItem("nexo_token", authToken);
        localStorage.setItem("nexo_user", JSON.stringify(authUser));
        setToken(authToken);
        setUser(authUser);
        router.push("/dashboard");
    };

    const logout = () => {
        localStorage.removeItem("nexo_token");
        localStorage.removeItem("nexo_user");
        setToken(null);
        setUser(null);
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
