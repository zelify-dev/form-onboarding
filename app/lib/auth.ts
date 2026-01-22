"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function useProtectedPage(requiredRole?: "commercial" | "technical") {
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        // Check for company_id in local storage (set during login)
        const companyId = localStorage.getItem("onboarding_company_id");
        const userRole = localStorage.getItem("onboarding_role");

        // 1. Must have a company ID (authenticated)
        if (!companyId) {
            router.replace("/");
            return;
        }

        // 2. If a specific role is required for this page, check it
        if (requiredRole && userRole !== requiredRole) {
            if (userRole === "commercial") router.replace("/comercial");
            else if (userRole === "technical") router.replace("/tecnologico");
            else router.replace("/");
            return;
        }

        setAuthorized(true);
    }, [router]);

    return authorized;
}
