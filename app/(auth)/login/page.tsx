"use client";

import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    console.log({ username, password });
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
      <div className="absolute top-8 left-10 z-20 flex items-center gap-2 text-white text-xl font-semibold">
        <span className="tracking-wide">SURERIDE</span>
      </div>

      {/* LOGIN CARD */}
      <div className="relative z-20 flex min-h-screen items-center justify-end px-6 md:px-20">
        <div className="w-full max-w-md rounded-2xl bg-white/0.5 backdrop-blur-xl border border-white/20 p-8 shadow-2xl text-white">
          {/* ICON */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
              <span className="text-2xl font-bold">S</span>
            </div>
          </div>

          {/* TITLE */}
          <h2 className="text-center text-lg font-semibold tracking-wide mb-8">
            ADMIN LOGIN
          </h2>

          {/* USERNAME */}
          <div className="mb-5">
            <label className="text-sm text-white/70 mb-1 block">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-transparent border-b border-white/40 py-2 px-1 text-white placeholder-white/50 focus:outline-none focus:border-white"
            />
          </div>

          {/* PASSWORD */}
          <div className="mb-8 relative">
            <label className="text-sm text-white/70 mb-1 block">Password</label>

            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent border-b border-white/40 py-2 px-1 pr-8 text-white placeholder-white/50 focus:outline-none focus:border-white"
            />

            {/* EYE TOGGLE */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-0 bottom-2 text-white/70 hover:text-white"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* SIGN IN BUTTON */}
          <button
            onClick={handleLogin}
            className="w-full cursor-pointer bg-[#009688] hover:bg-[#2becd9ff] text-black font-semibold py-3 rounded-full transition"
          >
            Login in
          </button>

          {/* FOOTER LINKS */}
          <div className="flex justify-center text-sm text-white/70 mt-6">
            <button className="hover:underline cursor-pointer hover:text-[#2becd9ff]">
              Forgot Password?
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
