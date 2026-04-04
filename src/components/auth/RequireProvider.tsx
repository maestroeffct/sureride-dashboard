"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function RequireProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized] = useState<boolean>(
    () =>
      !!(
        typeof window !== "undefined" &&
        localStorage.getItem("sureride_provider_token")
      ),
  );

  useEffect(() => {
    const token = localStorage.getItem("sureride_provider_token");

    if (!token) {
      router.replace("/provider/login");
    }
  }, [router]);

  if (!authorized) {
    return null;
  }

  return <>{children}</>;
}
