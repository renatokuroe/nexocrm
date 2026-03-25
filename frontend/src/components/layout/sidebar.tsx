"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    BarChart3,
    CheckSquare,
    LayoutDashboard,
    LogOut,
    Settings,
    Shield,
    Target,
    Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

const menu = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/clients", label: "Clientes", icon: Users },
    { href: "/pipeline", label: "Pipeline", icon: Target },
    { href: "/tasks", label: "Tarefas", icon: CheckSquare },
    { href: "/reports", label: "Relatórios", icon: BarChart3 },
];

// Sidebar used by all authenticated pages.
export function Sidebar() {
    const pathname = usePathname();
    const { logout, user } = useAuth();

    const menuWithAdmin =
        user?.role === "ADMIN"
            ? [...menu, { href: "/admin", label: "Admin", icon: Shield }]
            : menu;

    return (
        <aside className="sticky top-0 flex h-screen w-64 flex-col border-r border-slate-200 bg-white">
            <div className="flex items-center gap-3 px-5 py-6">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
                    ◎
                </div>
                <div>
                    <p className="text-2xl font-black tracking-tight text-slate-900">
                        {user?.companyName || "Seu CRM"}
                    </p>
                </div>
            </div>

            <nav className="space-y-1 px-3">
                {menuWithAdmin.map((item) => {
                    const Icon = item.icon;
                    const active = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-base font-semibold transition-colors",
                                active
                                    ? "bg-primary/10 text-primary"
                                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            )}
                        >
                            <Icon className="h-4 w-4" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-auto space-y-1 border-t border-slate-100 p-3">
                <Link
                    href="/settings"
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-base font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                >
                    <Settings className="h-4 w-4" />
                    Configurações
                </Link>

                <button
                    onClick={logout}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-base font-semibold text-rose-600 transition-colors hover:bg-rose-50"
                >
                    <LogOut className="h-4 w-4" />
                    Sair
                </button>
            </div>
        </aside>
    );
}
