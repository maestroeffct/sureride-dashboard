"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized] = useState<boolean>(
    () =>
      !!(
        typeof window !== "undefined" &&
        localStorage.getItem("sureride_admin_token")
      )
  );

  useEffect(() => {
    const token = localStorage.getItem("sureride_admin_token");

    if (!token) {
      router.replace("/login"); // 🔥 blocks back button
    }
  }, [router]);

  if (!authorized) {
    return null; // or a loader/spinner
  }

  return <>{children}</>;
}
