"use client";

import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { apiRequest } from "@/src/lib/api";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import styles from "./styles";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error("Email and password are required");
      return;
    }

    try {
      setLoading(true);

      const response = await apiRequest("/api/admin/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      localStorage.setItem("sureride_admin_token", response.token);
      localStorage.setItem(
        "sureride_admin_user",
        JSON.stringify(response.admin)
      );
      document.cookie = `sureride_admin_token=${response.token}; path=/; secure; samesite=lax`;

      toast.success("Login successful");
      router.push("/modules");
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
    <div style={styles.screen}>
      {/* Background */}
      <Image
        src="/images/login-bg.jpg"
        alt="Background"
        fill
        priority
        style={styles.backgroundImage}
      />

      {/* Overlay */}
      <div style={styles.overlay} />

      {/* Logo */}
      <div style={styles.logo}>SURERIDE</div>

      {/* Card wrapper */}
      <div style={styles.cardWrapper}>
        <div style={styles.card}>
          {/* Icon */}
          <div style={styles.iconWrapper}>
            <div style={styles.iconCircle}>
              <span style={styles.iconText}>S</span>
            </div>
          </div>

          <h2 style={styles.title}>ADMIN LOGIN</h2>

          {/* Email */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Username</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
            />
          </div>

          {/* Password */}
          <div style={{ ...styles.inputGroup, position: "relative" }}>
            <label style={styles.label}>Password</label>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Submit */}
          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              ...styles.submitButton,
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <div style={styles.forgotWrapper}>
            <button style={styles.forgotButton}>Forgot Password?</button>
          </div>
        </div>
      </div>
    </div>
  );
}
