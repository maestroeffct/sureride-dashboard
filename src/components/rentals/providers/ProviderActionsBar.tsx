"use client";

export default function ProviderActionsBar({
  provider,
}: {
  provider: {
    id: string;
    status: "pending" | "active" | "suspended";
  };
}) {
  const act = (action: string) => {
    // 🔌 API later
    console.log(`Action: ${action} on provider ${provider.id}`);
    alert(`${action} triggered (wire API later)`);
  };

  return (
    <div style={{ display: "flex", gap: 10 }}>
      {provider.status === "pending" && (
        <>
          <button style={btnApprove} onClick={() => act("approve")}>
            Approve Provider
          </button>
          <button style={btnReject} onClick={() => act("reject")}>
            Reject
          </button>
        </>
      )}

      {provider.status === "active" && (
        <button style={btnDanger} onClick={() => act("suspend")}>
          Suspend
        </button>
      )}

      {provider.status === "suspended" && (
        <button style={btnApprove} onClick={() => act("reactivate")}>
          Reactivate
        </button>
      )}
    </div>
  );
}

/* -------------------------------- */

const btnApprove = {
  background: "#22C55E",
  color: "#022C22",
  padding: "10px 14px",
  borderRadius: 8,
  border: "none",
};

const btnReject = {
  background: "#F59E0B",
  color: "#451A03",
  padding: "10px 14px",
  borderRadius: 8,
  border: "none",
};

const btnDanger = {
  background: "#EF4444",
  color: "#450A0A",
  padding: "10px 14px",
  borderRadius: 8,
  border: "none",
};
