"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

// Login form encapsulates auth screen behavior and API integration.
export function LoginForm() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const companyName =
        typeof window !== "undefined"
            ? (() => {
                try {
                    const raw = localStorage.getItem("nexo_user");
                    return raw ? JSON.parse(raw).companyName : null;
                } catch {
                    return null;
                }
            })()
            : null;

    const onSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await api.post("/auth/login", { email, password });
            const { token, user } = response.data.data;

            // Persist auth state in localStorage for client-side guarded routes.
            localStorage.setItem("nexo_token", token);
            localStorage.setItem("nexo_user", JSON.stringify(user));

            router.push("/dashboard");
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to sign in");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="animate-fade-up border-white/40 p-3">
            <CardHeader className="items-center text-center">
                <div className="mb-2 grid h-14 w-14 place-items-center rounded-2xl bg-primary text-2xl text-white">
                    ◎
                </div>
                <CardTitle className="text-4xl">{companyName || "Seu CRM"}</CardTitle>
                <p className="text-lg text-slate-500">Bem-vindo de volta!</p>
            </CardHeader>

            <CardContent>
                <form className="space-y-4" onSubmit={onSubmit}>
                    <label className="space-y-2 text-sm font-bold text-slate-600">
                        EMAIL
                        <div className="relative">
                            <Mail className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-slate-400" />
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="pl-10"
                                placeholder="seu@email.com"
                                required
                            />
                        </div>
                    </label>

                    <label className="space-y-2 text-sm font-bold text-slate-600">
                        SENHA
                        <div className="relative">
                            <Lock className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-slate-400" />
                            <Input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pl-10 pr-10"
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                className="absolute right-3 top-3 text-slate-400 hover:text-slate-700"
                            >
                                {showPassword ? (
                                    <EyeOff className="h-5 w-5" />
                                ) : (
                                    <Eye className="h-5 w-5" />
                                )}
                            </button>
                        </div>
                    </label>

                    {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Entrando..." : "Entrar"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
