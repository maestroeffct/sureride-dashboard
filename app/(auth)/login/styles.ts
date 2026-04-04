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

export const remoteBackgroundImage: CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
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
  display: "flex",
  alignItems: "center",
  gap: 10,
};

export const logoMiniIcon: CSSProperties = {
  width: 50,
  height: 50,
  objectFit: "contain",
};

export const logoRemoteImage: CSSProperties = {
  maxWidth: 220,
  maxHeight: 56,
  objectFit: "contain",
};

export const logoName: CSSProperties = {
  width: 170,
  height: "auto",
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

export const brandIcon: CSSProperties = {
  width: 68,
  height: 68,
  objectFit: "contain",
};

export const brandRemoteImage: CSSProperties = {
  maxWidth: 92,
  maxHeight: 92,
  objectFit: "contain",
};

export const title: CSSProperties = {
  textAlign: "center",
  fontSize: 18,
  fontWeight: 600,
  marginBottom: 8,
};

export const subtitle: CSSProperties = {
  textAlign: "center",
  fontSize: 13,
  color: "rgba(255,255,255,0.72)",
  marginBottom: 28,
  lineHeight: 1.5,
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

export const rememberRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  color: "rgba(255,255,255,0.75)",
  fontSize: 13,
  marginBottom: 18,
};

export const magicLinkButton: CSSProperties = {
  width: "100%",
  marginTop: 14,
  borderRadius: 999,
  border: "1px solid #009688",
  background: "transparent",
  color: "#009688",
  fontWeight: 600,
  padding: "12px 16px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
};

export const disabledNotice: CSSProperties = {
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.15)",
  background: "rgba(255,255,255,0.06)",
  color: "rgba(255,255,255,0.8)",
  padding: "14px 16px",
  fontSize: 13,
  lineHeight: 1.5,
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
  remoteBackgroundImage,
  overlay,
  logo,
  logoMiniIcon,
  logoRemoteImage,
  logoName,
  cardWrapper,
  card,
  iconWrapper,
  brandIcon,
  brandRemoteImage,
  title,
  subtitle,
  inputGroup,
  label,
  input,
  eyeButton,
  submitButton,
  rememberRow,
  magicLinkButton,
  disabledNotice,
  forgotWrapper,
  forgotButton,
} as const;
