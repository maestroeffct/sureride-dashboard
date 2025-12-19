// src/components/dashboard/Sidebar/SidebarItem.tsx
"use client";

import { usePathname, useRouter } from "next/navigation";
import styles from "./styles";

interface Props {
  item: {
    label: string;
    path: string;
  };
}

export default function SidebarItem({ item }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = pathname === item.path;

  return (
    <div
      onClick={() => router.push(item.path)}
      style={{
        ...styles.item,
        ...(isActive ? styles.itemActive : {}),
      }}
    >
      <span>{item.label}</span>
    </div>
  );
}
