"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

// Keep the browser tab title in sync with the logged-in user name.
export function BrowserTitleSync() {
    const { user } = useAuth();

    useEffect(() => {
        const fallbackTitle = "V4 NK & Co. CRM";
        const nextTitle = user?.companyName?.trim() || fallbackTitle;
        document.title = nextTitle;
    }, [user?.companyName]);

    return null;
}
