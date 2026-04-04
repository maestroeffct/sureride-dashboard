"use client";

import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";
import {
  approveProvider,
  resetProviderPassword,
  submitProvider,
  suspendProvider,
} from "@/src/lib/providersApi";
import { RentalProvider } from "@/src/types/rentalProvider";

export default function ProvidersActions({
  provider,
  onMutated,
}: {
  provider: RentalProvider;
  onMutated?: () => Promise<void> | void;
}) {
  const [busy, setBusy] = useState(false);

  const runAction = async (
    label: string,
    request: () => Promise<{ message: string }>,
  ) => {
    try {
      setBusy(true);
      const res = await request();
      toast.success(res.message || `${label} successful`);
      await onMutated?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : `${label} failed`;
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  const buttonStyle = busy
    ? { ...styles.button, ...styles.buttonDisabled }
    : styles.button;

  return (
    <div style={styles.wrap}>
      <Link href={`/rentals/providers/${provider.id}`} style={styles.link}>
        View
      </Link>

      {provider.status === "draft" && (
        <button
          disabled={busy}
          style={buttonStyle}
          onClick={() =>
            runAction("Submit", () =>
              submitProvider(provider.id).then((r) => ({ message: r.message })),
            )
          }
        >
          Submit
        </button>
      )}

      {provider.status === "pending" && (
        <button
          disabled={busy}
          style={buttonStyle}
          onClick={() => runAction("Approve", () => approveProvider(provider.id))}
        >
          Approve
        </button>
      )}

      {provider.status === "active" && (
        <>
          <button
            disabled={busy}
            style={buttonStyle}
            onClick={() =>
              runAction("Reset Password", () => resetProviderPassword(provider.id))
            }
          >
            Reset Password
          </button>
          <button
            disabled={busy}
            style={{ ...buttonStyle, ...styles.danger }}
            onClick={() => runAction("Suspend", () => suspendProvider(provider.id))}
          >
            Suspend
          </button>
        </>
      )}

      {provider.status === "suspended" && (
        <>
          <button
            disabled={busy}
            style={buttonStyle}
            onClick={() =>
              runAction("Reset Password", () => resetProviderPassword(provider.id))
            }
          >
            Reset Password
          </button>
          <button
            disabled={busy}
            style={buttonStyle}
            onClick={() =>
              runAction("Reactivate", () => approveProvider(provider.id))
            }
          >
            Reactivate
          </button>
        </>
      )}

      {provider.status === "pending" && (
        <button
          disabled={busy}
          style={buttonStyle}
          onClick={() =>
            runAction("Reset Password", () => resetProviderPassword(provider.id))
          }
        >
          Reset Password
        </button>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    display: "flex",
    gap: 8,
    alignItems: "center",
  },
  link: {
    cursor: "pointer",
  },
  button: {
    cursor: "pointer",
    border: "none",
    background: "transparent",
    color: "var(--foreground)",
    padding: 0,
    fontSize: 13,
  },
  buttonDisabled: {
    cursor: "not-allowed",
    opacity: 0.6,
  },
  danger: {
    color: "#EF4444",
  },
};
