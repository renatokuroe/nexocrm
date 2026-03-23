"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { ReactNode } from "react";

// Lightweight modal wrapper built on Radix Dialog.
export function Modal({
    open,
    onOpenChange,
    title,
    description,
    children,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    children: ReactNode;
}) {
    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-sm" />
                <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/30 bg-white p-6 shadow-2xl">
                    <div className="mb-5 flex items-start justify-between">
                        <div>
                            <Dialog.Title className="text-3xl font-black text-slate-900">
                                {title}
                            </Dialog.Title>
                            {description ? (
                                <Dialog.Description className="mt-1 text-slate-500">
                                    {description}
                                </Dialog.Description>
                            ) : null}
                        </div>
                        <Dialog.Close className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                            <X className="h-5 w-5" />
                        </Dialog.Close>
                    </div>
                    {children}
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
