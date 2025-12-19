import type { CSSProperties } from "react";

export const screen: CSSProperties = {
  position: "relative",
  minHeight: "100vh",
  width: "100%",
  overflow: "hidden",
};

export const backgroundImage: CSSProperties = {
  objectFit: "cover",
};

export const overlay: CSSProperties = {
  position: "absolute",
  inset: 0,
  backgroundColor: "rgba(0,0,0,0.5)",
  zIndex: 1,
};

export const logo: CSSProperties = {
  position: "absolute",
  top: 32,
  left: 40,
  zIndex: 2,
  color: "#FFFFFF",
  fontSize: 20,
  fontWeight: 600,
  letterSpacing: 1,
};

export const cardWrapper: CSSProperties = {
  position: "relative",
  zIndex: 2,
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  padding: "24px 80px",
};

export const card: CSSProperties = {
  width: "100%",
  maxWidth: 420,
  padding: 32,
  borderRadius: 24,
  background: "rgba(255,255,255,0.1)",
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.2)",
  boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
  color: "#FFFFFF",
};

export const iconWrapper: CSSProperties = {
  display: "flex",
  justifyContent: "center",
  marginBottom: 24,
};

export const iconCircle: CSSProperties = {
  width: 64,
  height: 64,
  borderRadius: "50%",
  background: "rgba(255,255,255,0.15)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

export const iconText: CSSProperties = {
  fontSize: 24,
  fontWeight: 700,
};

export const title: CSSProperties = {
  textAlign: "center",
  fontSize: 18,
  fontWeight: 600,
  marginBottom: 32,
};

export const inputGroup: CSSProperties = {
  marginBottom: 20,
};

export const label: CSSProperties = {
  fontSize: 13,
  color: "rgba(255,255,255,0.7)",
  marginBottom: 6,
  display: "block",
};

export const input: CSSProperties = {
  width: "100%",
  background: "transparent",
  border: "none",
  borderBottom: "1px solid rgba(255,255,255,0.4)",
  padding: "8px 4px",
  color: "#FFFFFF",
  outline: "none",
  fontSize: 14,
};

export const eyeButton: CSSProperties = {
  position: "absolute",
  right: 0,
  bottom: 8,
  background: "none",
  border: "none",
  color: "rgba(255,255,255,0.7)",
  cursor: "pointer",
};

export const submitButton: CSSProperties = {
  width: "100%",
  background: "#009688",
  color: "#000",
  fontWeight: 600,
  padding: "12px",
  borderRadius: 999,
  border: "none",
  cursor: "pointer",
  transition: "background 0.2s ease",
};

export const forgotWrapper: CSSProperties = {
  marginTop: 24,
  textAlign: "center",
};

export const forgotButton: CSSProperties = {
  background: "none",
  border: "none",
  color: "rgba(255,255,255,0.7)",
  fontSize: 13,
  cursor: "pointer",
  textDecoration: "underline",
};

export default {
  screen,
  backgroundImage,
  overlay,
  logo,
  cardWrapper,
  card,
  iconWrapper,
  iconCircle,
  iconText,
  title,
  inputGroup,
  label,
  input,
  eyeButton,
  submitButton,
  forgotWrapper,
  forgotButton,
} as const;
