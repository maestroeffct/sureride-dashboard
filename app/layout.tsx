import type { Metadata } from "next";
import { Poppins, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/src/providers/ThemeProvider";
import { Toaster } from "react-hot-toast";
import { fetchPublicPlatformConfig } from "@/src/lib/publicPlatformConfig";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export async function generateMetadata(): Promise<Metadata> {
  const config = await fetchPublicPlatformConfig({ cache: "no-store" });
  const companyName = config?.businessSetup?.companyName?.trim() || "Sureride";
  const title =
    config?.pagesSocialMedia?.metaTitle?.trim() || `${companyName} Admin`;
  const description =
    config?.pagesSocialMedia?.metaDescription?.trim() ||
    "Sureride Administration Dashboard";
  const ogImage =
    config?.pagesSocialMedia?.ogImageUrl?.trim() ||
    config?.gallery?.items?.find(Boolean) ||
    undefined;
  const favicon = config?.businessSetup?.faviconUrl?.trim() || undefined;
  const twitterHandle = config?.pagesSocialMedia?.twitterHandle?.trim() || undefined;

  return {
    title,
    description,
    icons: favicon
      ? {
          icon: favicon,
          shortcut: favicon,
          apple: favicon,
        }
      : undefined,
    openGraph: {
      title,
      description,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
      creator: twitterHandle,
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>{children}</ThemeProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#1A1A1A",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.1)",
            },
          }}
        />
      </body>
    </html>
  );
}
