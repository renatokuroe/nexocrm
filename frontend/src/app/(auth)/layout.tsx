// Auth layout keeps login/register screens centered and clean.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <main className="grid min-h-screen place-items-center p-4">
            <div className="w-full max-w-xl">{children}</div>
        </main>
    );
}
