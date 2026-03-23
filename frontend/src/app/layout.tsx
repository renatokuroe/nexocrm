import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";

export const metadata: Metadata = {
    title: "NexoCRM",
    description: "Scalable CRM built with Next.js, TypeScript, Prisma, and clean architecture.",
};

// Root layout wraps the entire application and injects shared providers.
export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="pt-BR">
            <body>
                <QueryProvider>{children}</QueryProvider>
            </body>
        </html>
    );
}
