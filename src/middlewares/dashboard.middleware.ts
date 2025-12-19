import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { ADMIN_ROUTES, DEFAULT_REDIRECT } from "@/src/config/adminAccess";

interface AdminTokenPayload {
  adminId: string;
  role: "SUPER_ADMIN" | "OPS" | "SUPPORT";
  exp: number;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect dashboard routes
  if (!pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  const token = request.cookies.get("sureride_admin_token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL(DEFAULT_REDIRECT, request.url));
  }

  try {
    const decoded = jwt.decode(token) as AdminTokenPayload | null;

    if (!decoded || !decoded.role) {
      throw new Error("Invalid token");
    }

    const allowedRoutes = ADMIN_ROUTES[decoded.role] || [];

    const hasAccess = allowedRoutes.some((route) => pathname.startsWith(route));

    if (!hasAccess) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL(DEFAULT_REDIRECT, request.url));
  }
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
