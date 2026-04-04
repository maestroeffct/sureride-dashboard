"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import {
  approveProvider,
  resetProviderPassword,
  submitProvider,
  suspendProvider,
} from "@/src/lib/providersApi";
import type { ProviderStatus } from "@/src/types/rentalProvider";

export default function ProviderActionsBar({
  provider,
  onMutated,
}: {
  provider: {
    id: string;
    status: ProviderStatus;
  };
  onMutated?: () => Promise<void> | void;
}) {
  const [busy, setBusy] = useState(false);

  const showTemporaryPassword = (result: {
    temporaryPassword?: string | null;
    tempPasswordExpiresAt?: string | null;
  }) => {
    if (!result.temporaryPassword) {
      return;
    }

    const expiryText = result.tempPasswordExpiresAt
      ? `\nExpires: ${new Date(result.tempPasswordExpiresAt).toLocaleString()}`
      : "";

    void navigator.clipboard
      ?.writeText(result.temporaryPassword)
      .catch(() => undefined);

    window.alert(
      `Temporary provider password:\n${result.temporaryPassword}${expiryText}\n\nIt has been copied to your clipboard when supported.`,
    );
  };

  const runAction = async (
    fallbackMessage: string,
    request: () => Promise<{
      message: string;
      temporaryPassword?: string | null;
      tempPasswordExpiresAt?: string | null;
    }>,
  ) => {
    try {
      setBusy(true);
      const response = await request();
      toast.success(response.message || fallbackMessage);
      showTemporaryPassword(response);
      await onMutated?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Action failed";
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "flex", gap: 10 }}>
      {provider.status === "draft" && (
        <button
          disabled={busy}
          style={btnApprove}
          onClick={() =>
            runAction("Provider submitted", () =>
              submitProvider(provider.id).then((res) => ({ message: res.message })),
            )
          }
        >
          Submit for Approval
        </button>
      )}

      {provider.status === "pending" && (
        <>
          <button
            disabled={busy}
            style={btnApprove}
            onClick={() =>
              runAction("Provider approved", () => approveProvider(provider.id))
            }
          >
            Approve Provider
          </button>
          <button
            disabled={busy}
            style={btnMuted}
            onClick={() =>
              runAction("Temporary password sent", () =>
                resetProviderPassword(provider.id),
              )
            }
          >
            Reset Password
          </button>
        </>
      )}

      {provider.status === "active" && (
        <>
          <button
            disabled={busy}
            style={btnMuted}
            onClick={() =>
              runAction("Temporary password sent", () =>
                resetProviderPassword(provider.id),
              )
            }
          >
            Reset Password
          </button>
          <button
            disabled={busy}
            style={btnDanger}
            onClick={() =>
              runAction("Provider suspended", () => suspendProvider(provider.id))
            }
          >
            Suspend
          </button>
        </>
      )}

      {provider.status === "suspended" && (
        <>
          <button
            disabled={busy}
            style={btnMuted}
            onClick={() =>
              runAction("Temporary password sent", () =>
                resetProviderPassword(provider.id),
              )
            }
          >
            Reset Password
          </button>
          <button
            disabled={busy}
            style={btnApprove}
            onClick={() =>
              runAction("Provider reactivated", () => approveProvider(provider.id))
            }
          >
            Reactivate
          </button>
        </>
      )}
    </div>
  );
}

const btnApprove = {
  background: "#22C55E",
  color: "#022C22",
  padding: "10px 14px",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
};

const btnDanger = {
  background: "#EF4444",
  color: "#450A0A",
  padding: "10px 14px",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
};

const btnMuted = {
  background: "#CBD5E1",
  color: "#0F172A",
  padding: "10px 14px",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
};
