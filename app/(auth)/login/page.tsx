"use client";

import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { apiRequest } from "@/src/lib/api";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      toast.error("Username and password are required");
      return;
    }

    try {
      setLoading(true);

      const response = await apiRequest("/api/admin/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      localStorage.setItem("sureride_admin_token", response.token);
      localStorage.setItem(
        "sureride_admin_user",
        JSON.stringify(response.admin)
      );

      toast.success("Login successful");

      router.push("/dashboard");
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "string"
          ? err
          : "Invalid credentials";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full">
      {/* BACKGROUND IMAGE */}
      <Image
        src="/images/login-bg.jpg"
        alt="Background"
        fill
        priority
        className="object-cover"
      />

      {/* DARK OVERLAY */}
      <div className="absolute inset-0 bg-black/50" />

      {/* LOGO */}
      <div className="absolute top-8 left-10 z-20 text-white text-xl font-semibold">
        SURERIDE
      </div>

      {/* LOGIN CARD */}
      <div className="relative z-20 flex min-h-screen items-center justify-end px-6 md:px-20">
        <div className="w-full max-w-md rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 p-8 shadow-2xl text-white">
          {/* ICON */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
              <span className="text-2xl font-bold">S</span>
            </div>
          </div>

          <h2 className="text-center text-lg font-semibold mb-8">
            ADMIN LOGIN
          </h2>

          {/* ERROR
          {error && (
            <p className="mb-4 text-sm text-red-400 text-center">{error}</p>
          )} */}

          {/* USERNAME */}
          <div className="mb-5">
            <label className="text-sm text-white/70 mb-1 block">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-transparent border-b border-white/40 py-2 px-1 focus:outline-none"
            />
          </div>

          {/* PASSWORD */}
          <div className="mb-8 relative">
            <label className="text-sm text-white/70 mb-1 block">Password</label>

            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent border-b border-white/40 py-2 px-1 pr-8 focus:outline-none"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-0 bottom-2 text-white/70 hover:text-white"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* SUBMIT */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-[#009688] hover:bg-[#2becd9ff] disabled:opacity-60 text-black font-semibold py-3 rounded-full transition"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <div className="flex justify-center text-sm text-white/70 mt-6">
            <button className="hover:underline">Forgot Password?</button>
          </div>
        </div>
      </div>
    </div>
  );
}
