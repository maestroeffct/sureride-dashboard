"use client";

import { useMemo, useState } from "react";
import { styles } from "./styles";
import ProviderStepper from "@/src/components/rentals/providers/new/ProviderStepper";
import StickyActionBar from "@/src/components/rentals/providers/new/StickyActionBar";

import Step1BusinessInfo from "@/src/components/rentals/providers/new/steps/Step1BusinessInfo";
import Step2ContactPerson from "@/src/components/rentals/providers/new/steps/Step2ContactPerson";
import Step3LocationOps from "@/src/components/rentals/providers/new/steps/Step3LocationOps";
// import Step4Documents from "@/src/components/rentals/providers/new/steps/Step4Documents";
// import Step5Financials from "@/src/components/rentals/providers/new/steps/Step5Financials";
// import Step6ReviewSubmit from "@/src/components/rentals/providers/new/steps/Step6ReviewSubmit";
import {
  ProviderDraftForm,
  ProviderDraftStatus,
  StepKey,
} from "@/src/types/rentalProvider";
import Step4Documents from "@/src/components/rentals/providers/new/steps/Step4Documents";
import Step5Financials from "@/src/components/rentals/providers/new/steps/Step5Financials";
import Step6ReviewSubmit from "@/src/components/rentals/providers/new/steps/Step6ReviewSubmit";

const STEP_ORDER: StepKey[] = [
  "business",
  "contact",
  "location",
  "documents",
  "financials",
  "review",
];

export default function AddRentalProviderPage() {
  const [status, setStatus] = useState<ProviderDraftStatus>("draft");
  const [activeStep, setActiveStep] = useState<StepKey>("business");
  const [stepperExpanded, setStepperExpanded] = useState(false);

  const [form, setForm] = useState<ProviderDraftForm>({
    businessName: "",
    businessType: "",

    contactName: "",
    contactRole: "",
    contactEmail: "",
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

  // ✅ Step validation gates (Next disabled until valid)
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
    if (!canGoNext) return;
    const next = STEP_ORDER[Math.min(stepIndex + 1, STEP_ORDER.length - 1)];
    setActiveStep(next);
  };

  const goPrev = () => {
    const prev = STEP_ORDER[Math.max(stepIndex - 1, 0)];
    setActiveStep(prev);
  };

  const completedSteps = useMemo(() => {
    // completed = those before current that are valid
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
      {/* Top bar */}
      <div style={styles.topBar}>
        <button style={styles.backBtn} onClick={() => history.back()}>
          ← Back to Providers
        </button>

        <div style={styles.topBarRight}>
          <div>
            <h1 style={styles.title}>Add Rental Provider</h1>
            <p style={styles.subtitle}>
              Manually onboard a new rental provider
            </p>
          </div>

          <span
            style={{
              ...styles.statusBadge,
              ...(status === "draft"
                ? styles.statusDraft
                : styles.statusPending),
            }}
          >
            {status === "draft" ? "Draft" : "Pending"}
          </span>
        </div>
      </div>

      {/* Body: Stepper + Content */}
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
            onSelect={(s) => setActiveStep(s)}
          />
        </div>

        <div style={styles.right}>{renderStep()}</div>
      </div>

      {/* Sticky Action Bar */}
      <StickyActionBar
        status={status}
        canGoNext={canGoNext}
        isFirst={stepIndex === 0}
        isLast={stepIndex === STEP_ORDER.length - 1}
        onPrev={goPrev}
        onNext={goNext}
        onCancel={() => history.back()}
        onSaveDraft={() => {
          // 🔌 API later: save draft
          setStatus("draft");
          alert("Saved as draft (wire API later).");
        }}
        onSubmit={() => {
          // 🔌 API later: submit -> pending + redirect
          setStatus("pending");
          alert("Submitted for approval (wire API + redirect next).");
        }}
      />
    </div>
  );
}
