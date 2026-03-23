"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";

// Protected layout checks auth token client-side and renders the app shell.
export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem("nexo_token");
        if (!token) {
            router.replace("/login");
        }
    }, [router]);

    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 p-6 lg:p-8">{children}</main>
        </div>
    );
}
