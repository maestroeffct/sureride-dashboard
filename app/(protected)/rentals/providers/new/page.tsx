"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { styles } from "./styles";
import ProviderStepper from "@/src/components/rentals/providers/new/ProviderStepper";
import StickyActionBar from "@/src/components/rentals/providers/new/StickyActionBar";
import Step1BusinessInfo from "@/src/components/rentals/providers/new/steps/Step1BusinessInfo";
import Step2ContactPerson from "@/src/components/rentals/providers/new/steps/Step2ContactPerson";
import Step3LocationOps from "@/src/components/rentals/providers/new/steps/Step3LocationOps";
import {
  ProviderDraftForm,
  ProviderDraftStatus,
  StepKey,
} from "@/src/types/rentalProvider";
import Step4Documents from "@/src/components/rentals/providers/new/steps/Step4Documents";
import Step5Financials from "@/src/components/rentals/providers/new/steps/Step5Financials";
import Step6ReviewSubmit from "@/src/components/rentals/providers/new/steps/Step6ReviewSubmit";
import { saveProviderDraft, submitProvider } from "@/src/lib/providersApi";

const STEP_ORDER: StepKey[] = [
  "business",
  "contact",
  "location",
  "documents",
  "financials",
  "review",
];

export default function AddRentalProviderPage() {
  const router = useRouter();
  const [status, setStatus] = useState<ProviderDraftStatus>("draft");
  const [activeStep, setActiveStep] = useState<StepKey>("business");
  const [stepperExpanded, setStepperExpanded] = useState(false);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<ProviderDraftForm>({
    businessName: "",
    businessType: "",

    contactName: "",
    contactRole: "",
    contactEmail: "",
    contactDialCode: "+234",
    contactCountry: "Nigeria",
    contactPhone: "+234",

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
  });

  const stepIndex = STEP_ORDER.indexOf(activeStep);

  const setField = (key: keyof ProviderDraftForm, value: any) =>
    setForm((p) => ({ ...p, [key]: value }));

  const stepValidity = useMemo(() => {
    const businessValid =
      form.businessName.trim().length > 1 && !!form.businessType;

    const contactValid =
      form.contactName.trim().length > 1 &&
      form.contactEmail.includes("@") &&
      form.contactPhone.replace(/\s/g, "").length >= 8;

    const locationValid =
      form.country.trim().length > 0 &&
      form.state.trim().length > 0 &&
      form.city.trim().length > 0;

    const documentsValid = !!form.regCert && !!form.govId;

    const financialsValid =
      form.bankName.trim().length > 0 &&
      form.accountName.trim().length > 0 &&
      form.accountNumber.trim().length >= 8;

    const reviewValid = form.agreeTerms && form.confirmAccurate;

    return {
      business: businessValid,
      contact: contactValid,
      location: locationValid,
      documents: documentsValid,
      financials: financialsValid,
      review: reviewValid,
    };
  }, [form]);

  const canGoNext = stepValidity[activeStep];

  const goNext = () => {
    if (!canGoNext || saving) return;
    const next = STEP_ORDER[Math.min(stepIndex + 1, STEP_ORDER.length - 1)];
    setActiveStep(next);
  };

  const goPrev = () => {
    if (saving) return;
    const prev = STEP_ORDER[Math.max(stepIndex - 1, 0)];
    setActiveStep(prev);
  };

  const completedSteps = useMemo(() => {
    const map: Record<StepKey, boolean> = {
      business: stepValidity.business,
      contact: stepValidity.contact,
      location: stepValidity.location,
      documents: stepValidity.documents,
      financials: stepValidity.financials,
      review: stepValidity.review,
    };

    return map;
  }, [stepValidity]);

  const buildDraftPayload = () => {
    const cleanPhone = form.contactPhone.trim();
    const fullPhone = cleanPhone.startsWith("+")
      ? cleanPhone
      : `${form.contactDialCode}${cleanPhone}`;

    return {
      id: providerId ?? undefined,
      name: form.businessName.trim(),
      email: form.contactEmail.trim().toLowerCase(),
      phone: fullPhone,
      contactPersonName: form.contactName.trim() || undefined,
      contactPersonRole: form.contactRole.trim() || undefined,
      contactPersonPhone: fullPhone,
      businessAddress: [form.city, form.state, form.country]
        .filter(Boolean)
        .join(", "),
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
      const payload = buildDraftPayload();
      const draft = await saveProviderDraft(payload);
      setProviderId(draft.id);
      setStatus(draft.status === "pending" ? "pending" : "draft");
      toast.success("Draft saved");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save draft";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (saving) return;

    if (!stepValidity.review) {
      toast.error("Complete the review confirmations before submitting");
      return;
    }

    try {
      setSaving(true);

      const payload = buildDraftPayload();
      const draft = await saveProviderDraft(payload);
      const submitted = await submitProvider(draft.id);

      setProviderId(submitted.provider.id);
      setStatus("pending");

      toast.success("Provider submitted for admin approval");
      router.push("/rentals/providers");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to submit";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const renderStep = () => {
    switch (activeStep) {
      case "business":
        return <Step1BusinessInfo form={form} setField={setField} />;
      case "contact":
        return <Step2ContactPerson form={form} setField={setField} />;
      case "location":
        return <Step3LocationOps form={form} setField={setField} />;
      case "documents":
        return <Step4Documents form={form} setField={setField} />;
      case "financials":
        return <Step5Financials form={form} setField={setField} />;
      case "review":
        return (
          <Step6ReviewSubmit
            onEdit={(step) => setActiveStep(step)}
            form={form}
            setField={setField}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <button style={styles.backBtn} onClick={() => history.back()}>
          ← Back to Providers
        </button>

        <div style={styles.topBarRight}>
          <div>
            <h1 style={styles.title}>Add Rental Provider</h1>
            <p style={styles.subtitle}>Manually onboard a new rental provider</p>
          </div>

          <span
            style={{
              ...styles.statusBadge,
              ...(status === "draft" ? styles.statusDraft : styles.statusPending),
            }}
          >
            {status === "draft" ? "Draft" : "Pending"}
          </span>
        </div>
      </div>

      <div
        style={{
          ...styles.body,
          gridTemplateColumns: stepperExpanded ? "260px 1fr" : "72px 1fr",
        }}
      >
        <div style={styles.left}>
          <ProviderStepper
            active={activeStep}
            completed={completedSteps}
            expanded={stepperExpanded}
            onHoverChange={setStepperExpanded}
            onSelect={(s) => !saving && setActiveStep(s)}
          />
        </div>

        <div style={styles.right}>{renderStep()}</div>
      </div>

      <StickyActionBar
        status={status}
        canGoNext={canGoNext && !saving}
        isFirst={stepIndex === 0}
        isLast={stepIndex === STEP_ORDER.length - 1}
        onPrev={goPrev}
        onNext={goNext}
        onCancel={() => history.back()}
        onSaveDraft={handleSaveDraft}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
