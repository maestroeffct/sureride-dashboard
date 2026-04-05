"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import type { ChangeEvent, CSSProperties } from "react";
import AdminCountryScopeBar from "@/src/components/rentals/common/AdminCountryScopeBar";
import type { BusinessFeature } from "@/src/types/businessSettings";
import { apiRequest } from "@/src/lib/api";
import {
  createAdminCountry,
  listAdminCountries,
  updateAdminCountry,
  type AdminCountry,
} from "@/src/lib/adminCountriesApi";
import {
  GLOBAL_COUNTRY_SCOPE,
  readAdminCountryScope,
  toCountryId,
  writeAdminCountryScope,
} from "@/src/lib/adminCountryScope";
import {
  listPlatformSettingsDraft,
  savePlatformSettingsDraft,
  type PlatformSettingsSection,
} from "@/src/lib/platformSettingsDraftApi";

type TaxRow = {
  id: string;
  label: string;
  code: string;
  rate: number;
  active: boolean;
};

type TemplateKey = "welcome" | "password-reset" | "booking-confirmed";

type TemplateConfig = {
  subject: string;
  body: string;
};

type GalleryItem = {
  id: string;
  url: string;
  title: string;
  folder: string;
};

type FeatureProps = {
  feature: BusinessFeature;
  title: string;
  description: string;
};

type ClientPlatformConfig = {
  maps?: {
    enabled?: boolean;
    apiKey?: string;
  };
};

const DEFAULT_EMAIL_TEMPLATES: Record<TemplateKey, TemplateConfig> = {
  welcome: {
    subject: "Welcome to Sureride",
    body: "Hi {{firstName}}, welcome to Sureride.",
  },
  "password-reset": {
    subject: "Reset your password",
    body: "Click {{resetLink}} to reset your password.",
  },
  "booking-confirmed": {
    subject: "Booking confirmed",
    body: "Your booking {{bookingId}} is now confirmed.",
  },
};

const FEATURE_STORAGE_PREFIX = "sureride_business_feature";
const BUSINESS_DEFAULT_CENTER = { lat: 6.6018, lng: 3.3515 };
let googleMapsScriptPromise: Promise<void> | null = null;

function storageKey(feature: BusinessFeature, countryId?: string) {
  return countryId
    ? `${FEATURE_STORAGE_PREFIX}:${feature}:${countryId}`
    : `${FEATURE_STORAGE_PREFIX}:${feature}`;
}

function randomId() {
  return Math.random().toString(36).slice(2, 11);
}

function normalizeGalleryFolder(value: unknown) {
  const text = typeof value === "string" ? value.trim() : "";
  return text || "General";
}

function createGalleryItem(
  url: string,
  index: number,
  overrides?: Partial<Pick<GalleryItem, "title" | "folder" | "id">>,
): GalleryItem {
  const cleanUrl = url.trim();
  const title =
    overrides?.title?.trim() ||
    cleanUrl.split("/").pop()?.split("?")[0]?.trim() ||
    `Image ${index + 1}`;

  return {
    id: overrides?.id?.trim() || `${randomId()}_${index}`,
    url: cleanUrl,
    title,
    folder: normalizeGalleryFolder(overrides?.folder),
  };
}

function normalizeGalleryItems(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as GalleryItem[];
  }

  return value
    .map((item, index) => {
      if (typeof item === "string" && item.trim()) {
        return createGalleryItem(item, index);
      }

      if (item && typeof item === "object") {
        const record = item as Record<string, unknown>;
        const url = typeof record.url === "string" ? record.url.trim() : "";

        if (!url) {
          return null;
        }

        return createGalleryItem(url, index, {
          id: typeof record.id === "string" ? record.id : undefined,
          title: typeof record.title === "string" ? record.title : undefined,
          folder: typeof record.folder === "string" ? record.folder : undefined,
        });
      }

      return null;
    })
    .filter((item): item is GalleryItem => Boolean(item));
}

function normalizeGalleryState(payload?: Record<string, unknown>) {
  const items = normalizeGalleryItems(payload?.items);
  const draftFolder = normalizeGalleryFolder(payload?.draftFolder);
  const savedActiveFolder =
    typeof payload?.activeFolder === "string" ? payload.activeFolder.trim() : "";
  const availableFolders = new Set(items.map((item) => item.folder));

  return {
    items,
    draftUrl: typeof payload?.draftUrl === "string" ? payload.draftUrl : "",
    draftTitle: typeof payload?.draftTitle === "string" ? payload.draftTitle : "",
    draftFolder,
    activeFolder:
      savedActiveFolder === "All" || availableFolders.has(savedActiveFolder)
        ? savedActiveFolder
        : "All",
  };
}

function createInitialState(feature: BusinessFeature) {
  switch (feature) {
    case "business-setup":
      return {
        companyName: "Sureride Technologies Ltd",
        email: "support@sureride.com",
        phoneCode: "+234",
        phone: "8010000000",
        country: "Nigeria",
        businessDescription: "Reliable rental mobility platform for providers and riders.",
        latitude: "6.6018",
        longitude: "3.3515",
        logoUrl: "",
        logoFileName: "",
        faviconUrl: "",
        faviconFileName: "",
        timezone: "Africa/Lagos",
        timeFormat: "12h",
        countryPickerEnabled: true,
        currency: "NGN",
        currencySymbolPosition: "left",
        decimalDigits: "2",
        copyrightText: "© 2026. All rights reserved.",
        cookiesText:
          "We use cookies to improve your experience while using our platform.",
      };

    case "system-tax":
      return {
        taxInclusivePricing: false,
        rows: [
          {
            id: randomId(),
            label: "VAT",
            code: "VAT",
            rate: 7.5,
            active: true,
          },
        ] as TaxRow[],
      };

    case "email-template":
      return {
        activeTemplate: "welcome" as TemplateKey,
        templates: DEFAULT_EMAIL_TEMPLATES,
      };

    case "theme-settings":
      return {
        brandColor: "#22c55e",
        secondaryColor: "#3b82f6",
        logoLightText: "Sureride",
        logoDarkText: "Sureride",
      };

    case "gallery":
      return normalizeGalleryState({
        items: [
          {
            id: "gallery_demo_car",
            title: "Hero Sedan",
            folder: "Homepage",
            url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70",
          },
          {
            id: "gallery_demo_showroom",
            title: "Showroom Detail",
            folder: "Marketing",
            url: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7",
          },
        ],
        draftFolder: "Homepage",
        activeFolder: "All",
      });

    case "login-setup":
      return {
        allowPasswordLogin: true,
        allowMagicLink: false,
        requireMfaForAdmins: true,
        showRememberMe: true,
      };

    case "pages-social-media":
      return {
        metaTitle: "Sureride Dashboard",
        metaDescription: "Manage rentals, providers, employees and operations.",
        ogImageUrl: "",
        twitterHandle: "@sureride",
        facebookPage: "",
        instagramPage: "",
        linkedinPage: "",
      };
  }
}

function loadFeatureState(feature: BusinessFeature, countryId?: string) {
  const initial = createInitialState(feature);

  if (typeof window === "undefined") {
    return initial;
  }

  const raw = window.localStorage.getItem(storageKey(feature, countryId));
  if (!raw) {
    return initial;
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;

    if (feature === "gallery") {
      return {
        ...initial,
        ...normalizeGalleryState(parsed),
      };
    }

    if (feature === "business-setup") {
      const legacy = parsed as Record<string, string | undefined>;
      const migrated = {
        ...parsed,
        companyName: parsed.companyName ?? legacy.legalName,
        email: parsed.email ?? legacy.supportEmail,
        phone: parsed.phone ?? legacy.supportPhone,
        businessDescription: parsed.businessDescription ?? legacy.address,
      };

      return { ...initial, ...migrated };
    }

    return { ...initial, ...parsed };
  } catch {
    return initial;
  }
}

function parseFeatureState(
  feature: BusinessFeature,
  payload?: Record<string, unknown>,
) {
  const initial = createInitialState(feature);
  const parsed = payload ?? {};

  if (feature === "gallery") {
    return {
      ...initial,
      ...normalizeGalleryState(parsed),
    };
  }

  if (feature === "business-setup") {
    const legacy = parsed as Record<string, string | undefined>;
    const migrated = {
      ...parsed,
      companyName: parsed.companyName ?? legacy.legalName,
      email: parsed.email ?? legacy.supportEmail,
      phone: parsed.phone ?? legacy.supportPhone,
      businessDescription: parsed.businessDescription ?? legacy.address,
    };

    return { ...initial, ...migrated };
  }

  return { ...initial, ...parsed };
}

function toPlatformSection(feature: BusinessFeature): PlatformSettingsSection {
  return feature;
}

function loadGoogleMapsScript(apiKey: string) {
  if (
    typeof window !== "undefined" &&
    (window as Window & { google?: unknown }).google
  ) {
    return Promise.resolve();
  }

  if (googleMapsScriptPromise) {
    return googleMapsScriptPromise;
  }

  googleMapsScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-google-maps-loader="true"]',
    );

    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Failed to load Google Maps")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      apiKey,
    )}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.dataset.googleMapsLoader = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });

  return googleMapsScriptPromise;
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

function renderField(label: string, children: React.ReactNode) {
  return (
    <label style={styles.field}>
      <span style={styles.label}>{label}</span>
      {children}
    </label>
  );
}

export default function BusinessSettingsFeaturePage({
  feature,
  title,
  description,
}: FeatureProps) {
  const [countryScope, setCountryScope] = useState(() => readAdminCountryScope());
  const [countries, setCountries] = useState<AdminCountry[]>([]);
  const [isCountriesLoading, setIsCountriesLoading] = useState(false);
  const [state, setState] = useState<Record<string, unknown>>(() =>
    loadFeatureState(feature, toCountryId(readAdminCountryScope())),
  );
  const [isGuidelineOpen, setIsGuidelineOpen] = useState(false);
  const [mapApiKey, setMapApiKey] = useState("");
  const [isMapConfigLoading, setIsMapConfigLoading] = useState(false);
  const [isFeatureLoading, setIsFeatureLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [mapLoadError, setMapLoadError] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapSearchInputRef = useRef<HTMLInputElement | null>(null);
  const mapRef = useRef<any>(null);
  const mapMarkerRef = useRef<any>(null);
  const mapAutocompleteRef = useRef<any>(null);
  const suppressMapSyncRef = useRef(false);
  const selectedCountryId = toCountryId(countryScope);

  useEffect(() => {
    let mounted = true;

    const loadCountries = async () => {
      try {
        setIsCountriesLoading(true);
        const items = await listAdminCountries();
        if (!mounted) return;
        setCountries(items);
      } catch (error) {
        console.error(error);
      } finally {
        if (mounted) {
          setIsCountriesLoading(false);
        }
      }
    };

    void loadCountries();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const hydrateFeature = async () => {
      setIsFeatureLoading(true);

      try {
        const result = await listPlatformSettingsDraft({
          countryId: selectedCountryId,
        });
        if (!mounted) return;

        const payload = result.items[toPlatformSection(feature)] as
          | Record<string, unknown>
          | undefined;

        if (payload) {
          setState(parseFeatureState(feature, payload));
        } else {
          setState(loadFeatureState(feature, selectedCountryId));
        }
      } catch {
        if (mounted) {
          setState(loadFeatureState(feature, selectedCountryId));
        }
      } finally {
        if (mounted) {
          setIsGuidelineOpen(false);
          setIsFeatureLoading(false);
        }
      }
    };

    void hydrateFeature();

    return () => {
      mounted = false;
    };
  }, [feature, selectedCountryId]);

  useEffect(() => {
    let mounted = true;

    const loadMapConfig = async () => {
      if (feature !== "business-setup") {
        if (mounted) {
          setMapApiKey("");
          setIsMapConfigLoading(false);
        }
        return;
      }

      setIsMapConfigLoading(true);

      try {
        const endpoint = selectedCountryId
          ? `/platform/client-config?countryId=${encodeURIComponent(selectedCountryId)}`
          : "/platform/client-config";

        const data = await apiRequest<ClientPlatformConfig>(endpoint, {
          headers: {
            Authorization: "",
          },
        });

        if (!mounted) return;

        const nextKey =
          typeof data.maps?.apiKey === "string" ? data.maps.apiKey.trim() : "";

        setMapApiKey(nextKey);
      } catch {
        if (mounted) {
          setMapApiKey("");
        }
      } finally {
        if (mounted) {
          setIsMapConfigLoading(false);
        }
      }
    };

    void loadMapConfig();

    return () => {
      mounted = false;
    };
  }, [feature, selectedCountryId]);

  const save = async () => {
    setIsSaving(true);

    try {
      const result = await savePlatformSettingsDraft(
        toPlatformSection(feature),
        state,
        {
          countryId: selectedCountryId,
        },
      );

      window.localStorage.setItem(
        storageKey(feature, selectedCountryId),
        JSON.stringify(state),
      );

      toast.success(
        result.source === "server"
          ? `${title} updated`
          : `${title} saved as draft`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : `Failed to save ${title}`,
      );
    } finally {
      setIsSaving(false);
    }
  };

  const setField = (key: string, value: unknown) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const handleCountryScopeChange = (scope: string) => {
    setCountryScope(scope);
    writeAdminCountryScope(scope);
  };

  const handleCreateCountry = async (payload: { name: string; code: string }) => {
    const item = await createAdminCountry(payload);
    setCountries((prev) => [...prev, item].sort((a, b) => a.name.localeCompare(b.name)));
    toast.success(`${item.name} added`);
  };

  const handleToggleCountry = async (country: AdminCountry) => {
    const updated = await updateAdminCountry(country.id, {
      isActive: !country.isActive,
    });

    setCountries((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item)),
    );

    if (!updated.isActive && countryScope === updated.id) {
      handleCountryScopeChange(GLOBAL_COUNTRY_SCOPE);
    }

    toast.success(
      updated.isActive ? `${updated.name} activated` : `${updated.name} deactivated`,
    );
  };

  const handleImageUpload = async (
    event: ChangeEvent<HTMLInputElement>,
    field: "logoUrl" | "faviconUrl",
    nameField: "logoFileName" | "faviconFileName",
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setState((prev) => ({
        ...prev,
        [field]: dataUrl,
        [nameField]: file.name,
      }));
      toast.success(`${file.name} selected`);
    } catch {
      toast.error("Unable to read selected image");
    } finally {
      event.target.value = "";
    }
  };

  useEffect(() => {
    if (feature !== "business-setup" || !mapApiKey) {
      setIsMapReady(false);
      setMapLoadError(null);
      mapRef.current = null;
      mapMarkerRef.current = null;
      mapAutocompleteRef.current = null;
      return;
    }

    const container = mapContainerRef.current;
    const searchInput = mapSearchInputRef.current;

    if (!container || !searchInput) {
      return;
    }

    let mounted = true;

    const initMap = async () => {
      try {
        await loadGoogleMapsScript(mapApiKey);
        if (!mounted) return;

        const googleMaps = (window as Window & { google?: any }).google;
        if (!googleMaps?.maps) {
          throw new Error("Google Maps is unavailable");
        }

        const latitude = Number.parseFloat(String(state.latitude ?? ""));
        const longitude = Number.parseFloat(String(state.longitude ?? ""));
        const center =
          Number.isFinite(latitude) && Number.isFinite(longitude)
            ? { lat: latitude, lng: longitude }
            : BUSINESS_DEFAULT_CENTER;

        if (!mapRef.current) {
          mapRef.current = new googleMaps.maps.Map(container, {
            center,
            zoom:
              Number.isFinite(latitude) && Number.isFinite(longitude) ? 14 : 6,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          });

          mapMarkerRef.current = new googleMaps.maps.Marker({
            map: mapRef.current,
            position: center,
            draggable: true,
          });

          mapRef.current.addListener("click", (event: any) => {
            if (!event.latLng) return;
            suppressMapSyncRef.current = true;
            const nextLat = event.latLng.lat();
            const nextLng = event.latLng.lng();
            mapMarkerRef.current?.setPosition(event.latLng);
            setState((prev) => ({
              ...prev,
              latitude: nextLat.toFixed(6),
              longitude: nextLng.toFixed(6),
            }));
            window.setTimeout(() => {
              suppressMapSyncRef.current = false;
            }, 0);
          });

          mapMarkerRef.current.addListener("dragend", (event: any) => {
            if (!event.latLng) return;
            suppressMapSyncRef.current = true;
            const nextLat = event.latLng.lat();
            const nextLng = event.latLng.lng();
            setState((prev) => ({
              ...prev,
              latitude: nextLat.toFixed(6),
              longitude: nextLng.toFixed(6),
            }));
            window.setTimeout(() => {
              suppressMapSyncRef.current = false;
            }, 0);
          });

          mapAutocompleteRef.current =
            new googleMaps.maps.places.Autocomplete(searchInput, {
              fields: ["geometry", "formatted_address", "name"],
            });

          mapAutocompleteRef.current.addListener("place_changed", () => {
            const place = mapAutocompleteRef.current?.getPlace();
            const location = place?.geometry?.location;
            if (!location) return;

            suppressMapSyncRef.current = true;
            const nextLat = location.lat();
            const nextLng = location.lng();
            mapRef.current?.panTo(location);
            mapRef.current?.setZoom(15);
            mapMarkerRef.current?.setPosition(location);
            setState((prev) => ({
              ...prev,
              latitude: nextLat.toFixed(6),
              longitude: nextLng.toFixed(6),
            }));
            window.setTimeout(() => {
              suppressMapSyncRef.current = false;
            }, 0);
          });
        }

        setMapLoadError(null);
        setIsMapReady(true);
      } catch (error) {
        if (!mounted) return;
        setMapLoadError(
          error instanceof Error ? error.message : "Failed to load map",
        );
        setIsMapReady(false);
      }
    };

    void initMap();

    return () => {
      mounted = false;
    };
  }, [feature, mapApiKey, state.latitude, state.longitude]);

  useEffect(() => {
    if (feature !== "business-setup") return;
    if (!isMapReady || suppressMapSyncRef.current) return;
    if (!mapRef.current || !mapMarkerRef.current) return;

    const latitude = Number.parseFloat(String(state.latitude ?? ""));
    const longitude = Number.parseFloat(String(state.longitude ?? ""));

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return;
    }

    const nextPosition = { lat: latitude, lng: longitude };
    mapRef.current.panTo(nextPosition);
    mapMarkerRef.current.setPosition(nextPosition);
  }, [feature, isMapReady, state.latitude, state.longitude]);

  const content = useMemo(() => {
    if (feature === "business-setup") {
      const descriptionText = String(state.businessDescription ?? "");
      const cookiesText = String(state.cookiesText ?? "");
      const copyrightText = String(state.copyrightText ?? "");
      const logoUrl = String(state.logoUrl ?? "").trim();
      const logoFileName = String(state.logoFileName ?? "").trim();
      const faviconUrl = String(state.faviconUrl ?? "").trim();
      const faviconFileName = String(state.faviconFileName ?? "").trim();
      const latitude = String(state.latitude ?? "").trim();
      const longitude = String(state.longitude ?? "").trim();
      const hasCoordinates = Boolean(latitude) && Boolean(longitude);

      const guidelineItems = [
        { id: "basic-information", label: "Basic Information" },
        { id: "general-settings", label: "General Settings" },
        { id: "content-setup", label: "Content Setup" },
      ];

      const goToSection = (sectionId: string) => {
        setIsGuidelineOpen(false);
        window.setTimeout(() => {
          document.getElementById(sectionId)?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 90);
      };

      return (
        <>
          <div style={styles.stackLarge}>
            <section id="basic-information" style={styles.sectionCard}>
              <h2 style={styles.sectionTitle}>Basic Information</h2>
              <p style={styles.sectionSubtitle}>
                Set up your primary business profile and contact identity.
              </p>

              <div style={styles.grid2}>
                {renderField(
                  "Company Name *",
                  <input
                    style={styles.input}
                    value={String(state.companyName ?? "")}
                    onChange={(e) => setField("companyName", e.target.value)}
                  />,
                )}
                {renderField(
                  "Email *",
                  <input
                    style={styles.input}
                    type="email"
                    value={String(state.email ?? "")}
                    onChange={(e) => setField("email", e.target.value)}
                  />,
                )}
              </div>

              <div style={styles.grid2}>
                <label style={styles.field}>
                  <span style={styles.label}>Phone *</span>
                  <div style={styles.phoneRow}>
                    <select
                      style={styles.phoneCode}
                      value={String(state.phoneCode ?? "+234")}
                      onChange={(e) => setField("phoneCode", e.target.value)}
                    >
                      <option value="+234">+234</option>
                      <option value="+1">+1</option>
                      <option value="+44">+44</option>
                      <option value="+971">+971</option>
                    </select>
                    <input
                      style={styles.input}
                      value={String(state.phone ?? "")}
                      onChange={(e) => setField("phone", e.target.value)}
                    />
                  </div>
                </label>

                <label style={styles.field}>
                  <span style={styles.label}>Country *</span>
                  <select
                    style={styles.input}
                    value={String(state.country ?? "Nigeria")}
                    onChange={(e) => setField("country", e.target.value)}
                  >
                    <option value="Nigeria">Nigeria</option>
                    <option value="Ghana">Ghana</option>
                    <option value="Kenya">Kenya</option>
                    <option value="South Africa">South Africa</option>
                    <option value="United Kingdom">United Kingdom</option>
                  </select>
                </label>
              </div>

              <label style={styles.field}>
                <span style={styles.label}>Description *</span>
                <textarea
                  style={styles.textarea}
                  value={descriptionText}
                  onChange={(e) =>
                    setField("businessDescription", e.target.value.slice(0, 100))
                  }
                />
                <span style={styles.counter}>{descriptionText.length}/100</span>
              </label>

              <div style={styles.grid2}>
                {renderField(
                  "Latitude *",
                  <input
                    style={styles.input}
                    value={String(state.latitude ?? "")}
                    onChange={(e) => setField("latitude", e.target.value)}
                  />,
                )}
                {renderField(
                  "Longitude *",
                  <input
                    style={styles.input}
                    value={String(state.longitude ?? "")}
                    onChange={(e) => setField("longitude", e.target.value)}
                  />,
                )}
              </div>

              <div style={styles.mapPreview}>
                <input
                  ref={mapSearchInputRef}
                  style={styles.mapSearchInput}
                  placeholder="Search location"
                  disabled={!mapApiKey || isMapConfigLoading}
                />
                <div ref={mapContainerRef} style={styles.mapCanvas} />
                {!mapApiKey || isMapConfigLoading || mapLoadError ? (
                  <div style={styles.mapOverlay}>
                    <div style={styles.mapPin} />
                    <span style={styles.mapCaption}>
                      {isMapConfigLoading
                        ? "Loading map configuration..."
                        : mapLoadError
                        ? mapLoadError
                        : hasCoordinates
                        ? "Add a Google Maps API key in Platform Settings to enable the map search and picker."
                        : "Add a Google Maps API key in Platform Settings, then search or click the map to set coordinates."}
                    </span>
                  </div>
                ) : null}
              </div>
            </section>

            <section id="general-settings" style={styles.sectionCard}>
              <h2 style={styles.sectionTitle}>General Settings</h2>
              <p style={styles.sectionSubtitle}>
                Configure timezone, currency, and display behavior.
              </p>

              <div style={styles.settingBlock}>
                <h4 style={styles.blockTitle}>Time Setup</h4>
                <p style={styles.blockText}>Set your business timezone and display format.</p>
                <div style={styles.grid2}>
                  {renderField(
                    "Time Zone *",
                    <select
                      style={styles.input}
                      value={String(state.timezone ?? "Africa/Lagos")}
                      onChange={(e) => setField("timezone", e.target.value)}
                    >
                      <option value="Africa/Lagos">(GMT+01:00) Africa/Lagos</option>
                      <option value="UTC">(GMT+00:00) UTC</option>
                      <option value="Europe/London">(GMT+00:00) Europe/London</option>
                      <option value="America/New_York">(GMT-05:00) America/New_York</option>
                    </select>,
                  )}

                  <label style={styles.field}>
                    <span style={styles.label}>Time Format *</span>
                    <div style={styles.radioRow}>
                      <label style={styles.radioItem}>
                        <input
                          type="radio"
                          name="timeFormat"
                          checked={String(state.timeFormat) === "12h"}
                          onChange={() => setField("timeFormat", "12h")}
                        />
                        12 hour
                      </label>
                      <label style={styles.radioItem}>
                        <input
                          type="radio"
                          name="timeFormat"
                          checked={String(state.timeFormat) === "24h"}
                          onChange={() => setField("timeFormat", "24h")}
                        />
                        24 hour
                      </label>
                    </div>
                  </label>
                </div>
              </div>

              <div style={styles.settingBlock}>
                <div style={styles.toggleHeader}>
                  <div>
                    <h4 style={styles.blockTitle}>Country Picker</h4>
                    <p style={styles.blockText}>
                      If disabled, country picker will be hidden across customer surfaces.
                    </p>
                  </div>
                  <label style={styles.switchLabel}>
                    <input
                      type="checkbox"
                      style={styles.switchInput}
                      checked={Boolean(state.countryPickerEnabled)}
                      onChange={(e) => setField("countryPickerEnabled", e.target.checked)}
                    />
                    Status
                  </label>
                </div>
                <div style={styles.noteBox}>
                  Turn this on if your business supports multiple countries.
                </div>
              </div>

              <div style={styles.settingBlock}>
                <h4 style={styles.blockTitle}>Currency Setup</h4>
                <p style={styles.blockText}>Define currency display and decimal precision.</p>
                <div style={styles.grid3}>
                  {renderField(
                    "Currency *",
                    <select
                      style={styles.input}
                      value={String(state.currency ?? "NGN")}
                      onChange={(e) => setField("currency", e.target.value)}
                    >
                      <option value="NGN">NGN (₦)</option>
                      <option value="USD">USD ($)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>,
                  )}

                  {renderField(
                    "Currency Symbol Position *",
                    <select
                      style={styles.input}
                      value={String(state.currencySymbolPosition ?? "left")}
                      onChange={(e) => setField("currencySymbolPosition", e.target.value)}
                    >
                      <option value="left">Left (₦123)</option>
                      <option value="right">Right (123₦)</option>
                    </select>,
                  )}

                  {renderField(
                    "Digit After Decimal Point *",
                    <input
                      style={styles.input}
                      value={String(state.decimalDigits ?? "2")}
                      onChange={(e) =>
                        setField("decimalDigits", e.target.value.replace(/[^0-9]/g, ""))
                      }
                    />,
                  )}
                </div>
              </div>
            </section>

            <section id="content-setup" style={styles.sectionCard}>
              <h2 style={styles.sectionTitle}>Content Setup</h2>
              <p style={styles.sectionSubtitle}>
                Configure footer and cookie content shown on web surfaces.
              </p>

              <div style={styles.grid2}>
                <label style={styles.field}>
                  <span style={styles.label}>Copyright Text *</span>
                  <textarea
                    style={styles.textarea}
                    value={copyrightText}
                    onChange={(e) =>
                      setField("copyrightText", e.target.value.slice(0, 100))
                    }
                  />
                  <span style={styles.counter}>{copyrightText.length}/100</span>
                </label>

                <label style={styles.field}>
                  <span style={styles.label}>Cookies Text *</span>
                  <textarea
                    style={styles.textarea}
                    value={cookiesText}
                    onChange={(e) => setField("cookiesText", e.target.value.slice(0, 100))}
                  />
                  <span style={styles.counter}>{cookiesText.length}/100</span>
                </label>
              </div>
            </section>
          </div>

          <button
            type="button"
            style={styles.guidelineTab}
            onClick={() => setIsGuidelineOpen(true)}
            aria-label="Open business setup guideline"
          >
            <span style={styles.guidelineTabIcon}>↗</span>
            <span style={styles.guidelineTabText}>View Guideline</span>
          </button>

          <div
            style={{
              ...styles.guidelineOverlay,
              opacity: isGuidelineOpen ? 1 : 0,
              pointerEvents: isGuidelineOpen ? "auto" : "none",
            }}
            onClick={() => setIsGuidelineOpen(false)}
          >
            <aside
              style={{
                ...styles.guidelineDrawer,
                transform: isGuidelineOpen ? "translateX(0)" : "translateX(100%)",
              }}
              onClick={(event) => event.stopPropagation()}
            >
              <div style={styles.guidelineHeader}>
                <h3 style={styles.guidelineTitle}>Business Setup Guideline</h3>
                <button
                  type="button"
                  style={styles.guidelineCloseBtn}
                  onClick={() => setIsGuidelineOpen(false)}
                >
                  ×
                </button>
              </div>

              <div style={styles.guidelineList}>
                {guidelineItems.map((item) => (
                  <div key={item.id} style={styles.guidelineItem}>
                    <span style={styles.guidelineItemLabel}>{item.label}</span>
                    <button
                      type="button"
                      style={styles.guidelineAction}
                      onClick={() => goToSection(item.id)}
                    >Let&apos;s Setup</button>
                  </div>
                ))}
              </div>

              <div style={styles.guidelineAssetCard}>
                <h4 style={styles.blockTitle}>Brand Assets</h4>
                <p style={styles.blockText}>Upload logo and favicon from this side panel.</p>

                <div style={styles.mediaCard}>
                  <h3 style={styles.mediaTitle}>Logo *</h3>
                  <div style={styles.mediaPreview}>
                    {logoUrl ? (
                      <img src={logoUrl} alt="Business logo" style={styles.mediaImage} />
                    ) : (
                      <span style={styles.mediaPlaceholder}>Logo preview</span>
                    )}
                  </div>
                  <div style={styles.mediaActions}>
                    <label style={styles.uploadBtn}>
                      Upload From Computer
                      <input
                        type="file"
                        accept="image/*"
                        style={styles.fileInput}
                        onChange={(e) => void handleImageUpload(e, "logoUrl", "logoFileName")}
                      />
                    </label>
                    <input
                      style={styles.input}
                      placeholder="or paste logo image URL"
                      value={String(state.logoUrl ?? "")}
                      onChange={(e) => {
                        setField("logoUrl", e.target.value);
                        setField("logoFileName", "");
                      }}
                    />
                  </div>
                  {logoFileName ? <p style={styles.fileName}>Selected: {logoFileName}</p> : null}
                </div>

                <div style={styles.mediaCard}>
                  <h3 style={styles.mediaTitle}>Favicon *</h3>
                  <div style={styles.mediaPreviewSquare}>
                    {faviconUrl ? (
                      <img src={faviconUrl} alt="Favicon" style={styles.mediaImage} />
                    ) : (
                      <span style={styles.mediaPlaceholder}>Favicon preview</span>
                    )}
                  </div>
                  <div style={styles.mediaActions}>
                    <label style={styles.uploadBtn}>
                      Upload From Computer
                      <input
                        type="file"
                        accept="image/*"
                        style={styles.fileInput}
                        onChange={(e) => void handleImageUpload(e, "faviconUrl", "faviconFileName")}
                      />
                    </label>
                    <input
                      style={styles.input}
                      placeholder="or paste favicon image URL"
                      value={String(state.faviconUrl ?? "")}
                      onChange={(e) => {
                        setField("faviconUrl", e.target.value);
                        setField("faviconFileName", "");
                      }}
                    />
                  </div>
                  {faviconFileName ? <p style={styles.fileName}>Selected: {faviconFileName}</p> : null}
                </div>
              </div>
            </aside>
          </div>
        </>
      );
    }

    if (feature === "system-tax") {
      const rows = (state.rows as TaxRow[]) ?? [];
      return (
        <div style={styles.stack}>
          <label style={styles.toggleRow}>
            <input
              type="checkbox"
              checked={Boolean(state.taxInclusivePricing)}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  taxInclusivePricing: e.target.checked,
                }))
              }
            />
            Prices include tax by default
          </label>

          <div style={styles.stack}>
            {rows.map((row, index) => (
              <div key={row.id} style={styles.taxRow}>
                <input
                  style={styles.input}
                  placeholder="Tax Name"
                  value={row.label}
                  onChange={(e) => {
                    const next = [...rows];
                    next[index] = { ...row, label: e.target.value };
                    setState((prev) => ({ ...prev, rows: next }));
                  }}
                />
                <input
                  style={styles.input}
                  placeholder="Code"
                  value={row.code}
                  onChange={(e) => {
                    const next = [...rows];
                    next[index] = { ...row, code: e.target.value };
                    setState((prev) => ({ ...prev, rows: next }));
                  }}
                />
                <input
                  style={styles.input}
                  type="number"
                  step="0.01"
                  placeholder="Rate %"
                  value={String(row.rate)}
                  onChange={(e) => {
                    const next = [...rows];
                    next[index] = {
                      ...row,
                      rate: Number(e.target.value || "0"),
                    };
                    setState((prev) => ({ ...prev, rows: next }));
                  }}
                />
                <label style={styles.smallCheck}>
                  <input
                    type="checkbox"
                    checked={row.active}
                    onChange={(e) => {
                      const next = [...rows];
                      next[index] = { ...row, active: e.target.checked };
                      setState((prev) => ({ ...prev, rows: next }));
                    }}
                  />
                  Active
                </label>
                <button
                  style={styles.ghostBtn}
                  onClick={() => {
                    const next = rows.filter((x) => x.id !== row.id);
                    setState((prev) => ({ ...prev, rows: next }));
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <button
            style={styles.secondaryBtn}
            onClick={() =>
              setState((prev) => ({
                ...prev,
                rows: [
                  ...((prev.rows as TaxRow[]) ?? []),
                  { id: randomId(), label: "", code: "", rate: 0, active: true },
                ],
              }))
            }
          >
            Add Tax Rule
          </button>
        </div>
      );
    }

    if (feature === "email-template") {
      const activeTemplate = (state.activeTemplate as TemplateKey) ?? "welcome";
      const templates =
        (state.templates as Record<TemplateKey, TemplateConfig>) ??
        DEFAULT_EMAIL_TEMPLATES;
      const current = templates[activeTemplate];

      return (
        <div style={styles.stack}>
          {renderField(
            "Template",
            <select
              style={styles.input}
              value={activeTemplate}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  activeTemplate: e.target.value as TemplateKey,
                }))
              }
            >
              <option value="welcome">Welcome</option>
              <option value="password-reset">Password Reset</option>
              <option value="booking-confirmed">Booking Confirmed</option>
            </select>,
          )}

          {renderField(
            "Subject",
            <input
              style={styles.input}
              value={current.subject}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  templates: {
                    ...(prev.templates as Record<TemplateKey, TemplateConfig>),
                    [activeTemplate]: {
                      ...current,
                      subject: e.target.value,
                    },
                  },
                }))
              }
            />,
          )}

          {renderField(
            "Body",
            <textarea
              style={styles.textarea}
              value={current.body}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  templates: {
                    ...(prev.templates as Record<TemplateKey, TemplateConfig>),
                    [activeTemplate]: {
                      ...current,
                      body: e.target.value,
                    },
                  },
                }))
              }
            />,
          )}

          <p style={styles.hint}>
            Supported placeholders: {'{{firstName}}'}, {'{{resetLink}}'}, {'{{bookingId}}'}.
          </p>
        </div>
      );
    }

    if (feature === "theme-settings") {
      return (
        <div style={styles.grid2}>
          {renderField(
            "Brand Color",
            <input
              style={styles.input}
              value={String(state.brandColor ?? "")}
              onChange={(e) =>
                setState((prev) => ({ ...prev, brandColor: e.target.value }))
              }
            />,
          )}
          {renderField(
            "Secondary Color",
            <input
              style={styles.input}
              value={String(state.secondaryColor ?? "")}
              onChange={(e) =>
                setState((prev) => ({ ...prev, secondaryColor: e.target.value }))
              }
            />,
          )}
          {renderField(
            "Logo Text (Light)",
            <input
              style={styles.input}
              value={String(state.logoLightText ?? "")}
              onChange={(e) =>
                setState((prev) => ({ ...prev, logoLightText: e.target.value }))
              }
            />,
          )}
          {renderField(
            "Logo Text (Dark)",
            <input
              style={styles.input}
              value={String(state.logoDarkText ?? "")}
              onChange={(e) =>
                setState((prev) => ({ ...prev, logoDarkText: e.target.value }))
              }
            />,
          )}
        </div>
      );
    }

    if (feature === "gallery") {
      const items = normalizeGalleryItems(state.items);
      const draftUrl = String(state.draftUrl ?? "");
      const draftTitle = String(state.draftTitle ?? "");
      const draftFolder = normalizeGalleryFolder(state.draftFolder);
      const activeFolder = String(state.activeFolder ?? "All");
      const folders = Array.from(new Set(items.map((item) => item.folder))).sort(
        (a, b) => a.localeCompare(b),
      );
      const visibleItems =
        activeFolder === "All"
          ? items
          : items.filter((item) => item.folder === activeFolder);

      return (
        <div style={styles.stack}>
          <div style={styles.galleryToolbar}>
            <div style={styles.galleryComposer}>
              <h3 style={styles.galleryPanelTitle}>Add Gallery Image</h3>
              <div style={styles.galleryAddGrid}>
                <input
                  style={styles.input}
                  placeholder="Paste image URL"
                  value={draftUrl}
                  onChange={(e) =>
                    setState((prev) => ({ ...prev, draftUrl: e.target.value }))
                  }
                />
                <input
                  style={styles.input}
                  placeholder="Image title"
                  value={draftTitle}
                  onChange={(e) =>
                    setState((prev) => ({ ...prev, draftTitle: e.target.value }))
                  }
                />
                <input
                  style={styles.input}
                  placeholder="Folder name"
                  value={draftFolder}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      draftFolder: e.target.value,
                    }))
                  }
                />
                <button
                  style={styles.secondaryBtn}
                  onClick={() => {
                    const nextUrl = draftUrl.trim();
                    if (!nextUrl) return;

                    setState((prev) => ({
                      ...prev,
                      items: [
                        ...normalizeGalleryItems(prev.items),
                        createGalleryItem(nextUrl, items.length, {
                          title: draftTitle,
                          folder: draftFolder,
                        }),
                      ],
                      draftUrl: "",
                      draftTitle: "",
                      draftFolder,
                    }));
                  }}
                >
                  Add Image
                </button>
              </div>
            </div>

            <div style={styles.galleryFoldersPanel}>
              <h3 style={styles.galleryPanelTitle}>Folders</h3>
              <div style={styles.galleryFolderChips}>
                {["All", ...folders].map((folder) => {
                  const isActive = activeFolder === folder;
                  const count =
                    folder === "All"
                      ? items.length
                      : items.filter((item) => item.folder === folder).length;

                  return (
                    <button
                      key={folder}
                      style={{
                        ...styles.galleryFolderChip,
                        ...(isActive ? styles.galleryFolderChipActive : {}),
                      }}
                      onClick={() =>
                        setState((prev) => ({ ...prev, activeFolder: folder }))
                      }
                    >
                      {folder} ({count})
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={styles.gallerySummaryRow}>
            <span style={styles.gallerySummaryText}>
              {visibleItems.length} image{visibleItems.length === 1 ? "" : "s"} in{" "}
              {activeFolder === "All" ? "all folders" : activeFolder}
            </span>
          </div>

          <div style={styles.galleryGrid}>
            {visibleItems.map((item) => (
              <article key={item.id} style={styles.galleryCard}>
                <div style={styles.galleryImageWrap}>
                  <img src={item.url} alt={item.title} style={styles.galleryImage} />
                </div>
                <div style={styles.galleryMeta}>
                  <div style={styles.galleryMetaHeader}>
                    <div style={styles.galleryTextGroup}>
                      <h4 style={styles.galleryItemTitle}>{item.title}</h4>
                      <span style={styles.galleryFolderBadge}>{item.folder}</span>
                    </div>
                    <button
                      style={styles.ghostBtn}
                      onClick={() => {
                        const nextItems = items.filter(
                          (existing) => existing.id !== item.id,
                        );
                        const remainingFolders = new Set(
                          nextItems.map((existing) => existing.folder),
                        );

                        setState((prev) => ({
                          ...prev,
                          items: nextItems,
                          activeFolder:
                            activeFolder !== "All" && !remainingFolders.has(activeFolder)
                              ? "All"
                              : prev.activeFolder,
                        }));
                      }}
                    >
                      Remove
                    </button>
                  </div>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.galleryLink}
                  >
                    {item.url}
                  </a>
                </div>
              </article>
            ))}
          </div>

          {visibleItems.length === 0 ? (
            <div style={styles.galleryEmptyState}>
              No images in this folder yet. Add one above or switch folders.
            </div>
          ) : null}
        </div>
      );
    }

    if (feature === "login-setup") {
      return (
        <div style={styles.stack}>
          <label style={styles.toggleRow}>
            <input
              type="checkbox"
              checked={Boolean(state.allowPasswordLogin)}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  allowPasswordLogin: e.target.checked,
                }))
              }
            />
            Allow password login
          </label>
          <label style={styles.toggleRow}>
            <input
              type="checkbox"
              checked={Boolean(state.allowMagicLink)}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  allowMagicLink: e.target.checked,
                }))
              }
            />
            Allow magic-link login
          </label>
          <label style={styles.toggleRow}>
            <input
              type="checkbox"
              checked={Boolean(state.requireMfaForAdmins)}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  requireMfaForAdmins: e.target.checked,
                }))
              }
            />
            Require MFA for admins
          </label>
          <label style={styles.toggleRow}>
            <input
              type="checkbox"
              checked={Boolean(state.showRememberMe)}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  showRememberMe: e.target.checked,
                }))
              }
            />
            Show &quot;Remember me&quot; checkbox
          </label>
          <div style={styles.helperText}>
            If password login is disabled, admins will sign in with a 6-digit email
            access code instead of getting locked out.
          </div>
        </div>
      );
    }

    return (
      <div style={styles.grid2}>
        {renderField(
          "Meta Title",
          <input
            style={styles.input}
            value={String(state.metaTitle ?? "")}
            onChange={(e) =>
              setState((prev) => ({ ...prev, metaTitle: e.target.value }))
            }
          />,
        )}
        {renderField(
          "Open Graph Image URL",
          <input
            style={styles.input}
            value={String(state.ogImageUrl ?? "")}
            onChange={(e) =>
              setState((prev) => ({ ...prev, ogImageUrl: e.target.value }))
            }
          />,
        )}
        <div style={{ ...styles.field, gridColumn: "1 / -1" }}>
          <span style={styles.label}>Meta Description</span>
          <textarea
            style={styles.textarea}
            value={String(state.metaDescription ?? "")}
            onChange={(e) =>
              setState((prev) => ({ ...prev, metaDescription: e.target.value }))
            }
          />
        </div>
        {renderField(
          "Twitter",
          <input
            style={styles.input}
            value={String(state.twitterHandle ?? "")}
            onChange={(e) =>
              setState((prev) => ({ ...prev, twitterHandle: e.target.value }))
            }
          />,
        )}
        {renderField(
          "Facebook",
          <input
            style={styles.input}
            value={String(state.facebookPage ?? "")}
            onChange={(e) =>
              setState((prev) => ({ ...prev, facebookPage: e.target.value }))
            }
          />,
        )}
        {renderField(
          "Instagram",
          <input
            style={styles.input}
            value={String(state.instagramPage ?? "")}
            onChange={(e) =>
              setState((prev) => ({ ...prev, instagramPage: e.target.value }))
            }
          />,
        )}
        {renderField(
          "LinkedIn",
          <input
            style={styles.input}
            value={String(state.linkedinPage ?? "")}
            onChange={(e) =>
              setState((prev) => ({ ...prev, linkedinPage: e.target.value }))
            }
          />,
        )}
      </div>
    );
  }, [feature, state, isGuidelineOpen, isMapConfigLoading, mapApiKey]);

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <span style={styles.sectionBadge}>Business Settings</span>
        <h1 style={styles.title}>{title}</h1>
        <p style={styles.subtitle}>{description}</p>
      </div>

      <AdminCountryScopeBar
        scope={countryScope}
        countries={countries}
        loading={isCountriesLoading}
        allowManage
        onScopeChange={handleCountryScopeChange}
        onCreateCountry={handleCreateCountry}
        onToggleCountry={handleToggleCountry}
      />

      <section style={styles.card}>{content}</section>

      <div style={styles.actions}>
        <button
          style={styles.primaryBtn}
          onClick={() => void save()}
          disabled={isSaving || isFeatureLoading}
        >
          {isSaving ? "Saving..." : isFeatureLoading ? "Loading..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
    maxWidth: 1360,
  },
  headerRow: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  sectionBadge: {
    width: "fit-content",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "var(--muted-foreground)",
    border: "1px solid var(--input-border)",
    borderRadius: 999,
    padding: "6px 10px",
    background: "var(--surface-2)",
  },
  title: {
    margin: 0,
    fontSize: 28,
    lineHeight: 1.15,
    fontWeight: 700,
  },
  subtitle: {
    margin: 0,
    color: "var(--muted-foreground)",
    maxWidth: 760,
  },
  card: {
    borderRadius: 14,
    border: "1px solid var(--input-border)",
    background: "linear-gradient(180deg, var(--surface-2), var(--surface-2))",
    padding: 18,
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  stack: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  stackLarge: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  sectionCard: {
    border: "1px solid var(--input-border)",
    borderRadius: 12,
    background: "var(--surface-2)",
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 20,
    fontWeight: 700,
    color: "var(--foreground)",
  },
  sectionSubtitle: {
    margin: 0,
    color: "var(--muted-foreground)",
    fontSize: 14,
  },
  basicGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 16,
    alignItems: "start",
  },
  basicLeft: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    minWidth: 0,
  },
  basicRight: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    minWidth: 0,
  },
  mediaCard: {
    border: "1px solid var(--input-border)",
    borderRadius: 12,
    background: "var(--surface-1)",
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  mediaTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 700,
  },
  mediaText: {
    margin: 0,
    color: "var(--muted-foreground)",
    fontSize: 13,
  },
  mediaPreview: {
    border: "1px dashed var(--glass-20)",
    borderRadius: 10,
    height: 150,
    width: "100%",
    maxWidth: 360,
    background: "var(--surface-2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  mediaPreviewSquare: {
    border: "1px dashed var(--glass-20)",
    borderRadius: 10,
    width: 150,
    height: 150,
    background: "var(--surface-2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  mediaImage: {
    width: "100%",
    height: "100%",
    maxWidth: "100%",
    maxHeight: "100%",
    objectFit: "contain",
  },
  mediaPlaceholder: {
    color: "var(--fg-60)",
    fontSize: 12,
    fontWeight: 600,
  },
  mediaHint: {
    margin: 0,
    color: "var(--fg-60)",
    fontSize: 12,
    lineHeight: 1.4,
  },
  mediaActions: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  uploadBtn: {
    height: 38,
    borderRadius: 10,
    border: "1px solid var(--glass-10)",
    background: "var(--surface-2)",
    color: "var(--foreground)",
    padding: "0 12px",
    fontWeight: 600,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "fit-content",
    position: "relative",
    overflow: "hidden",
  },
  fileInput: {
    position: "absolute",
    inset: 0,
    opacity: 0,
    cursor: "pointer",
  },
  fileName: {
    margin: 0,
    color: "var(--fg-60)",
    fontSize: 12,
  },
  settingBlock: {
    border: "1px solid var(--input-border)",
    borderRadius: 12,
    padding: 14,
    background: "var(--surface-1)",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  blockTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 700,
  },
  blockText: {
    margin: 0,
    color: "var(--muted-foreground)",
    fontSize: 14,
  },
  toggleHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap",
  },
  noteBox: {
    borderRadius: 10,
    border: "1px solid rgba(245, 158, 11, 0.25)",
    background: "rgba(245, 158, 11, 0.12)",
    color: "#fcd34d",
    fontSize: 13,
    padding: "10px 12px",
  },
  switchLabel: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    color: "var(--foreground)",
    fontWeight: 600,
    fontSize: 13,
  },
  switchInput: {
    width: 18,
    height: 18,
    accentColor: "#3b82f6",
    cursor: "pointer",
  },
  radioRow: {
    height: 42,
    borderRadius: 10,
    border: "1px solid var(--glass-10)",
    background: "var(--surface-2)",
    display: "inline-flex",
    alignItems: "center",
    gap: 20,
    padding: "0 12px",
  },
  radioItem: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    color: "var(--foreground)",
    fontSize: 14,
    cursor: "pointer",
  },
  mapPreview: {
    border: "1px solid var(--glass-10)",
    borderRadius: 12,
    minHeight: 320,
    width: "100%",
    marginTop: 6,
    background:
      "radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.16), transparent 45%), radial-gradient(circle at 70% 75%, rgba(34, 197, 94, 0.12), transparent 40%), var(--glass-04)",
    position: "relative",
    overflow: "hidden",
  },
  mapSearchInput: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    height: 36,
    borderRadius: 9,
    border: "1px solid var(--glass-10)",
    background: "var(--surface-1)",
    color: "var(--foreground)",
    padding: "0 12px",
    fontSize: 13,
    zIndex: 3,
  },
  mapCanvas: {
    position: "absolute",
    inset: 0,
  },
  mapOverlay: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    padding: 12,
    background:
      "linear-gradient(180deg, rgba(15, 23, 42, 0.08) 0%, rgba(15, 23, 42, 0.16) 100%)",
    zIndex: 2,
  },
  mapPin: {
    width: 22,
    height: 22,
    borderRadius: 999,
    background: "#ef4444",
    boxShadow: "0 0 0 8px rgba(239, 68, 68, 0.15)",
    marginBottom: 36,
  },
  mapCaption: {
    position: "absolute",
    bottom: 10,
    left: 12,
    color: "var(--fg-60)",
    fontSize: 12,
  },
  guidelineTab: {
    position: "fixed",
    right: 0,
    top: "50%",
    transform: "translateY(-50%)",
    width: 68,
    height: 210,
    border: "1px solid var(--input-border)",
    borderRight: "none",
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
    background: "var(--surface-1)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    cursor: "pointer",
    zIndex: 25,
    boxShadow: "0 12px 30px rgba(0, 0, 0, 0.35)",
  },
  guidelineTabIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    display: "grid",
    placeItems: "center",
    background: "#1d4ed8",
    color: "#fff",
    fontWeight: 700,
    fontSize: 16,
  },
  guidelineTabText: {
    writingMode: "vertical-rl",
    transform: "rotate(180deg)",
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: 0.3,
    color: "var(--foreground)",
  },
  guidelineOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(2, 6, 23, 0.62)",
    zIndex: 40,
    display: "flex",
    justifyContent: "flex-end",
    transition: "opacity 220ms ease",
  },
  guidelineDrawer: {
    width: "min(560px, 100vw)",
    height: "100%",
    background: "var(--surface-1)",
    borderLeft: "1px solid var(--input-border)",
    padding: 18,
    display: "flex",
    flexDirection: "column",
    gap: 14,
    overflowY: "auto",
    transition: "transform 280ms cubic-bezier(0.22, 1, 0.36, 1)",
    willChange: "transform",
  },
  guidelineHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  guidelineTitle: {
    margin: 0,
    fontSize: 36,
    fontWeight: 700,
  },
  guidelineCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 999,
    border: "1px solid var(--input-border)",
    background: "var(--surface-2)",
    color: "var(--foreground)",
    fontSize: 22,
    lineHeight: 1,
    cursor: "pointer",
  },
  guidelineList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  guidelineItem: {
    border: "1px solid var(--input-border)",
    borderRadius: 12,
    background: "var(--surface-2)",
    padding: "14px 12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  guidelineItemLabel: {
    fontSize: 22,
    fontWeight: 700,
  },
  guidelineAction: {
    height: 34,
    borderRadius: 8,
    border: "1px solid rgba(59,130,246,0.45)",
    background: "rgba(59,130,246,0.18)",
    color: "#93C5FD",
    padding: "0 10px",
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  guidelineAssetCard: {
    border: "1px solid var(--input-border)",
    borderRadius: 12,
    background: "var(--surface-2)",
    padding: 14,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  phoneRow: {
    display: "grid",
    gridTemplateColumns: "98px minmax(0, 1fr)",
    gap: 8,
    width: "100%",
  },
  phoneCode: {
    height: 42,
    borderRadius: 10,
    border: "1px solid var(--glass-10)",
    background: "var(--glass-06)",
    color: "var(--foreground)",
    padding: "0 10px",
    outline: "none",
    fontSize: 14,
  },
  counter: {
    alignSelf: "flex-end",
    color: "var(--fg-60)",
    fontSize: 12,
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 12,
  },
  grid3: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    minWidth: 0,
  },
  label: {
    fontSize: 12,
    fontWeight: 700,
    color: "var(--fg-70)",
    letterSpacing: 0.2,
  },
  input: {
    height: 42,
    borderRadius: 10,
    border: "1px solid var(--glass-10)",
    background: "var(--glass-06)",
    color: "var(--foreground)",
    padding: "0 10px",
    outline: "none",
    fontSize: 14,
    width: "100%",
  },
  textarea: {
    minHeight: 96,
    borderRadius: 10,
    border: "1px solid var(--glass-10)",
    background: "var(--glass-06)",
    color: "var(--foreground)",
    padding: "10px",
    outline: "none",
    fontSize: 14,
    resize: "vertical",
    width: "100%",
  },
  hint: {
    margin: 0,
    fontSize: 12,
    color: "var(--fg-60)",
  },
  helperText: {
    margin: 0,
    fontSize: 12,
    lineHeight: 1.5,
    color: "var(--fg-60)",
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
  },
  primaryBtn: {
    height: 42,
    borderRadius: 10,
    border: "1px solid rgba(34,197,94,0.4)",
    background: "rgba(34,197,94,0.16)",
    color: "#86EFAC",
    padding: "0 14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  secondaryBtn: {
    height: 40,
    borderRadius: 10,
    border: "1px solid var(--glass-10)",
    background: "var(--glass-06)",
    color: "var(--foreground)",
    padding: "0 12px",
    fontWeight: 600,
    cursor: "pointer",
    width: "fit-content",
  },
  ghostBtn: {
    height: 34,
    borderRadius: 8,
    border: "1px solid var(--glass-10)",
    background: "transparent",
    color: "var(--foreground)",
    padding: "0 10px",
    fontWeight: 600,
    cursor: "pointer",
  },
  taxRow: {
    display: "grid",
    gridTemplateColumns: "1.2fr 0.7fr 0.6fr auto auto",
    gap: 10,
    alignItems: "center",
  },
  smallCheck: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
    color: "var(--fg-70)",
  },
  toggleRow: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontSize: 14,
    color: "var(--foreground)",
  },
  galleryToolbar: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 2fr) minmax(280px, 1fr)",
    gap: 14,
  },
  galleryComposer: {
    borderRadius: 12,
    border: "1px solid var(--input-border)",
    background: "var(--surface-2)",
    padding: 14,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  galleryFoldersPanel: {
    borderRadius: 12,
    border: "1px solid var(--input-border)",
    background: "var(--surface-2)",
    padding: 14,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  galleryPanelTitle: {
    margin: 0,
    fontSize: 15,
    fontWeight: 700,
    color: "var(--foreground)",
  },
  galleryAddGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 10,
  },
  galleryFolderChips: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  galleryFolderChip: {
    borderRadius: 999,
    border: "1px solid var(--input-border)",
    background: "var(--surface-1)",
    color: "var(--foreground)",
    padding: "8px 12px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  galleryFolderChipActive: {
    background: "var(--foreground)",
    color: "var(--background)",
    borderColor: "var(--foreground)",
  },
  gallerySummaryRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  gallerySummaryText: {
    fontSize: 13,
    color: "var(--muted-foreground)",
  },
  galleryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 14,
  },
  galleryCard: {
    borderRadius: 14,
    border: "1px solid var(--input-border)",
    background: "var(--surface-2)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  galleryImageWrap: {
    width: "100%",
    aspectRatio: "16 / 10",
    background: "var(--surface-1)",
    overflow: "hidden",
  },
  galleryImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  galleryMeta: {
    width: "100%",
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  galleryMetaHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  galleryTextGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    minWidth: 0,
  },
  galleryItemTitle: {
    margin: 0,
    fontSize: 15,
    fontWeight: 700,
    color: "var(--foreground)",
  },
  galleryFolderBadge: {
    width: "fit-content",
    borderRadius: 999,
    border: "1px solid var(--input-border)",
    background: "var(--surface-1)",
    color: "var(--muted-foreground)",
    padding: "5px 9px",
    fontSize: 12,
    fontWeight: 600,
  },
  galleryEmptyState: {
    borderRadius: 12,
    border: "1px dashed var(--input-border)",
    background: "var(--surface-2)",
    padding: 18,
    textAlign: "center",
    color: "var(--muted-foreground)",
  },
  galleryLink: {
    color: "#93C5FD",
    textDecoration: "none",
    fontSize: 13,
    lineHeight: 1.5,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
};
