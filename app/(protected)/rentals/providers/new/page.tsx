"use client";

import { useMemo, useState, type CSSProperties } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { ArrowLeft, Copy, CheckCheck } from "lucide-react";
import { styles } from "./styles";
import ProviderStepper from "@/src/components/rentals/providers/new/ProviderStepper";
import Step1BusinessInfo from "@/src/components/rentals/providers/new/steps/Step1BusinessInfo";
import Step2ContactPerson from "@/src/components/rentals/providers/new/steps/Step2ContactPerson";
import Step3LocationOps from "@/src/components/rentals/providers/new/steps/Step3LocationOps";
import Step4Documents from "@/src/components/rentals/providers/new/steps/Step4Documents";
import Step5Financials from "@/src/components/rentals/providers/new/steps/Step5Financials";
import Step6ReviewSubmit from "@/src/components/rentals/providers/new/steps/Step6ReviewSubmit";
import {
  type ProviderDraftForm,
  type ProviderDraftStatus,
  type StepKey,
} from "@/src/types/rentalProvider";
import { saveProviderDraft, submitProvider, approveProvider } from "@/src/lib/providersApi";

const STEP_ORDER: StepKey[] = [
  "business",
  "contact",
  "location",
  "documents",
  "financials",
  "review",
];

const INITIAL_FORM: ProviderDraftForm = {
  businessName: "",
  businessType: "",
  contactName: "",
  contactRole: "",
  contactEmail: "",
  contactDialCode: "+234",
  contactCountry: "Nigeria",
  contactPhone: "",
  country: "Nigeria",
  state: "",
  city: "",
  zones: [],
  regCert: null,
  govId: null,
  bankName: "",
  accountName: "",
  accountNumber: "",
  currency: "NGN",
  agreeTerms: false,
  confirmAccurate: false,
};

type CredentialsModal = {
  providerName: string;
  email: string;
  temporaryPassword: string;
};

export default function AddRentalProviderPage() {
  const router = useRouter();
  const [status, setStatus] = useState<ProviderDraftStatus>("draft");
  const [activeStep, setActiveStep] = useState<StepKey>("business");
  const [providerId, setProviderId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ProviderDraftForm>(INITIAL_FORM);
  const [credentialsModal, setCredentialsModal] = useState<CredentialsModal | null>(null);

  const stepIndex = STEP_ORDER.indexOf(activeStep);
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === STEP_ORDER.length - 1;

  const setField = (key: keyof ProviderDraftForm, value: unknown) =>
    setForm((p) => ({ ...p, [key]: value }));

  const stepValidity = useMemo<Record<StepKey, boolean>>(
    () => ({
      business: form.businessName.trim().length > 1 && !!form.businessType,
      contact:
        form.contactName.trim().length > 1 &&
        form.contactEmail.includes("@") &&
        form.contactPhone.replace(/\s/g, "").length >= 8,
      location:
        form.country.trim().length > 0 &&
        form.state.trim().length > 0 &&
        form.city.trim().length > 0,
      documents: !!form.regCert && !!form.govId,
      financials:
        form.bankName.trim().length > 0 &&
        form.accountName.trim().length > 0 &&
        form.accountNumber.trim().length >= 8,
      review: form.agreeTerms && form.confirmAccurate,
    }),
    [form],
  );

  const canGoNext = stepValidity[activeStep];

  const goNext = () => {
    if (!canGoNext || saving) return;
    setActiveStep(STEP_ORDER[Math.min(stepIndex + 1, STEP_ORDER.length - 1)]);
  };

  const goPrev = () => {
    if (saving) return;
    setActiveStep(STEP_ORDER[Math.max(stepIndex - 1, 0)]);
  };

  const buildPayload = () => {
    const phone = form.contactPhone.trim().startsWith("+")
      ? form.contactPhone.trim()
      : `${form.contactDialCode}${form.contactPhone.trim()}`;
    return {
      id: providerId ?? undefined,
      name: form.businessName.trim(),
      email: form.contactEmail.trim().toLowerCase(),
      phone,
      contactPersonName: form.contactName.trim() || undefined,
      contactPersonRole: form.contactRole.trim() || undefined,
      contactPersonPhone: phone,
      businessAddress: [form.city, form.state, form.country].filter(Boolean).join(", "),
      countryName: form.country.trim() || undefined,
      bankName: form.bankName.trim() || undefined,
      bankAccountName: form.accountName.trim() || undefined,
      bankAccountNumber: form.accountNumber.trim() || undefined,
    };
  };

  const handleSaveDraft = async () => {
    if (saving) return;
    try {
      setSaving(true);
      const draft = await saveProviderDraft(buildPayload());
      setProviderId(draft.id);
      setStatus(draft.status === "pending" ? "pending" : "draft");
      toast.success("Draft saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save draft");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (saving || !stepValidity.review) {
      if (!stepValidity.review) toast.error("Complete review confirmations before submitting");
      return;
    }
    try {
      setSaving(true);
      const draft = await saveProviderDraft(buildPayload());
      await submitProvider(draft.id);
      const approval = await approveProvider(draft.id);
      if (approval.temporaryPassword) {
        setCredentialsModal({
          providerName: form.businessName.trim() || form.contactName.trim(),
          email: form.contactEmail.trim().toLowerCase(),
          temporaryPassword: approval.temporaryPassword,
        });
      } else {
        toast.success("Provider created and activated");
        router.push("/rentals/providers");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create provider");
    } finally {
      setSaving(false);
    }
  };

  const renderStep = () => {
    switch (activeStep) {
      case "business": return <Step1BusinessInfo form={form} setField={setField} />;
      case "contact":  return <Step2ContactPerson form={form} setField={setField} />;
      case "location": return <Step3LocationOps form={form} setField={setField} />;
      case "documents": return <Step4Documents form={form} setField={setField} />;
      case "financials": return <Step5Financials form={form} setField={setField} />;
      case "review":
        return (
          <Step6ReviewSubmit
            form={form}
            setField={setField}
            onEdit={(step) => setActiveStep(step)}
          />
        );
    }
  };

  return (
    <>
    {credentialsModal && (
      <ProviderCredentialsModal
        {...credentialsModal}
        onDone={() => router.push("/rentals/providers")}
      />
    )}
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => router.push("/rentals/providers")}>
          <ArrowLeft size={14} />
          Back to Providers
        </button>
        <div style={styles.titleRow}>
          <div>
            <h1 style={styles.title}>Add Rental Provider</h1>
            <p style={styles.subtitle}>Manually onboard a new rental provider to the platform</p>
          </div>
          <span
            style={{
              ...styles.statusBadge,
              ...(status === "draft" ? styles.statusDraft : styles.statusPending),
            }}
          >
            {status === "draft" ? "Draft" : "Pending Approval"}
          </span>
        </div>
      </div>

      {/* Horizontal stepper */}
      <div style={styles.stepperWrap}>
        <ProviderStepper
          active={activeStep}
          completed={stepValidity}
          onSelect={(s) => !saving && setActiveStep(s)}
        />
      </div>

      {/* Content card */}
      <div style={styles.card}>
        <div style={styles.cardBody}>{renderStep()}</div>

        {/* Card footer */}
        <div style={styles.cardFooter}>
          <div style={styles.footerLeft}>
            <button style={styles.btnCancel} onClick={() => router.push("/rentals/providers")}>
              Cancel
            </button>
            <button
              style={{ ...styles.btnDraft, opacity: saving ? 0.6 : 1 }}
              onClick={handleSaveDraft}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save Draft"}
            </button>
          </div>

          <div style={styles.footerRight}>
            {!isFirst && (
              <button style={styles.btnBack} onClick={goPrev} disabled={saving}>
                Back
              </button>
            )}
            {isLast ? (
              <button
                style={{
                  ...styles.btnNext,
                  ...(!canGoNext || saving ? styles.btnNextDisabled : {}),
                }}
                onClick={handleSubmit}
                disabled={!canGoNext || saving}
              >
                {saving ? "Creating…" : "Create & Activate Provider"}
              </button>
            ) : (
              <button
                style={{
                  ...styles.btnNext,
                  ...(!canGoNext || saving ? styles.btnNextDisabled : {}),
                }}
                onClick={goNext}
                disabled={!canGoNext || saving}
              >
                Next Step
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

// ── Credentials Modal ────────────────────────────────────────────────────────

function ProviderCredentialsModal({
  providerName,
  email,
  temporaryPassword,
  onDone,
}: {
  providerName: string;
  email: string;
  temporaryPassword: string;
  onDone: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = `Email: ${email}\nTemporary Password: ${temporaryPassword}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div style={cm.overlay}>
      <div style={cm.modal}>
        <div style={cm.iconRow}>
          <div style={cm.iconCircle}>✓</div>
        </div>
        <h2 style={cm.title}>Provider Activated!</h2>
        <p style={cm.sub}>
          <strong>{providerName}</strong> has been created and immediately activated. Share these
          credentials with the provider — the password expires after first login.
        </p>

        <div style={cm.credBox}>
          <div style={cm.credRow}>
            <span style={cm.credLabel}>Email</span>
            <span style={cm.credValue}>{email}</span>
          </div>
          <div style={cm.divider} />
          <div style={cm.credRow}>
            <span style={cm.credLabel}>Temp Password</span>
            <span style={cm.credValue}>{temporaryPassword}</span>
          </div>
        </div>

        <button style={cm.copyBtn} onClick={handleCopy}>
          {copied ? <CheckCheck size={15} /> : <Copy size={15} />}
          {copied ? "Copied!" : "Copy Credentials"}
        </button>

        <p style={cm.note}>
          An email with these credentials has been sent to the provider automatically.
        </p>

        <button style={cm.doneBtn} onClick={onDone}>
          Go to Providers List →
        </button>
      </div>
    </div>
  );
}

const cm: Record<string, CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 300,
  },
  modal: {
    background: "var(--surface-1)",
    border: "1px solid var(--input-border)",
    borderRadius: 20,
    padding: "36px 32px 32px",
    width: 440,
    maxWidth: "calc(100vw - 40px)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 16,
    textAlign: "center",
    boxShadow: "0 30px 80px rgba(0,0,0,0.55)",
  },
  iconRow: {
    marginBottom: 4,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: "50%",
    background: "color-mix(in srgb, var(--brand-secondary) 18%, transparent)",
    border: "2px solid var(--brand-secondary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 24,
    color: "var(--brand-secondary)",
    fontWeight: 700,
  },
  title: {
    margin: 0,
    fontSize: 20,
    fontWeight: 750,
    color: "var(--foreground)",
  },
  sub: {
    margin: 0,
    fontSize: 13,
    color: "var(--muted-foreground)",
    lineHeight: 1.6,
    maxWidth: 340,
  },
  credBox: {
    width: "100%",
    background: "var(--surface-2)",
    border: "1px solid var(--input-border)",
    borderRadius: 12,
    overflow: "hidden",
  },
  credRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    gap: 12,
  },
  credLabel: {
    fontSize: 12,
    color: "var(--muted-foreground)",
    fontWeight: 500,
    flexShrink: 0,
  },
  credValue: {
    fontSize: 13,
    fontWeight: 700,
    color: "var(--foreground)",
    fontFamily: "monospace",
    wordBreak: "break-all",
    textAlign: "right",
  },
  divider: {
    height: 1,
    background: "var(--input-border)",
  },
  copyBtn: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 20px",
    borderRadius: 10,
    border: "1px solid var(--input-border)",
    background: "var(--surface-2)",
    color: "var(--foreground)",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
  },
  note: {
    margin: 0,
    fontSize: 12,
    color: "var(--muted-foreground)",
    lineHeight: 1.5,
  },
  doneBtn: {
    width: "100%",
    padding: "13px",
    borderRadius: 12,
    border: "none",
    background: "var(--brand-primary)",
    color: "#fff",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 700,
    marginTop: 4,
  },
};
