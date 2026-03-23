import { ReactNode } from "react";

// Reusable page header for module pages.
export function PageHeader({
    title,
    subtitle,
    actions,
}: {
    title: string;
    subtitle: string;
    actions?: ReactNode;
}) {
    return (
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
                <h1 className="text-5xl font-black leading-tight tracking-tight text-slate-900">
                    {title}
                </h1>
                <p className="mt-2 text-xl text-slate-500">{subtitle}</p>
            </div>
            {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
        </div>
    );
}
