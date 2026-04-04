"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import toast from "react-hot-toast";
import { apiRequest } from "@/src/lib/api";
import {
  createProviderLocation,
  deleteProviderLocation,
  listProviderCountries,
  listProviderLocations,
  updateProviderLocation,
  type ProviderCountryOption,
  type ProviderLocation,
} from "@/src/lib/providerApi";

type FormState = {
  name: string;
  address: string;
  countryId: string;
  latitude: string;
  longitude: string;
};

type ClientPlatformConfig = {
  maps?: {
    enabled?: boolean;
    apiKey?: string;
  };
};

const initialForm: FormState = {
  name: "",
  address: "",
  countryId: "",
  latitude: "",
  longitude: "",
};

const DEFAULT_CENTER = { lat: 6.5244, lng: 3.3792 };
let googleMapsScriptPromise: Promise<void> | null = null;

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

export default function ProviderLocationsPage() {
  const [locations, setLocations] = useState<ProviderLocation[]>([]);
  const [countries, setCountries] = useState<ProviderCountryOption[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [mapApiKey, setMapApiKey] = useState("");
  const [mapLoadError, setMapLoadError] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapSearchInputRef = useRef<HTMLInputElement | null>(null);
  const mapRef = useRef<any>(null);
  const mapMarkerRef = useRef<any>(null);
  const mapAutocompleteRef = useRef<any>(null);
  const mapGeocoderRef = useRef<any>(null);
  const suppressMapSyncRef = useRef(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [countryRows, locationRows, platformConfig] = await Promise.all([
          listProviderCountries(),
          listProviderLocations(),
          apiRequest<ClientPlatformConfig>("/platform/client-config", {
            headers: {
              Authorization: "",
            },
          }).catch(() => null),
        ]);
        setCountries(countryRows);
        setLocations(locationRows);
        setMapApiKey(platformConfig?.maps?.apiKey?.trim() || "");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to load locations",
        );
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const sortedLocations = useMemo(
    () => [...locations].sort((a, b) => a.name.localeCompare(b.name)),
    [locations],
  );

  const selectedLocation = useMemo(
    () =>
      selectedLocationId
        ? locations.find((location) => location.id === selectedLocationId) ?? null
        : null,
    [locations, selectedLocationId],
  );

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const syncAddressFromCoords = async (lat: number, lng: number) => {
    const geocoder = mapGeocoderRef.current;
    if (!geocoder) return;

    geocoder.geocode(
      { location: { lat, lng } },
      (
        results: Array<{ formatted_address?: string; address_components?: any[] }> = [],
        status: string,
      ) => {
        if (status !== "OK" || !results[0]) {
          return;
        }

        const result = results[0];
        const countryComponent = result.address_components?.find((component) =>
          Array.isArray(component.types) && component.types.includes("country"),
        );

        setForm((prev) => {
          const nextCountryId =
            countries.find((country) => {
              const longName = String(countryComponent?.long_name ?? "").toLowerCase();
              const shortName = String(countryComponent?.short_name ?? "").toLowerCase();
              return (
                country.name.toLowerCase() === longName ||
                country.code.toLowerCase() === shortName
              );
            })?.id ?? prev.countryId;

          return {
            ...prev,
            address: result.formatted_address || prev.address,
            countryId: nextCountryId,
          };
        });
      },
    );
  };

  const loadLocationIntoForm = (location: ProviderLocation) => {
    setSelectedLocationId(location.id);
    setForm({
      name: location.name,
      address: location.address,
      countryId: location.countryId,
      latitude:
        typeof location.latitude === "number" ? String(location.latitude) : "",
      longitude:
        typeof location.longitude === "number" ? String(location.longitude) : "",
    });
  };

  const resetForm = () => {
    setSelectedLocationId(null);
    setForm(initialForm);
  };

  const validate = () => {
    if (!form.name.trim()) return "Location name is required";
    if (!form.address.trim()) return "Address is required";
    if (!form.countryId) return "Country is required";

    if (form.latitude.trim()) {
      const latitude = Number(form.latitude);
      if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
        return "Latitude must be between -90 and 90";
      }
    }

    if (form.longitude.trim()) {
      const longitude = Number(form.longitude);
      if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
        return "Longitude must be between -180 and 180";
      }
    }

    return null;
  };

  const onSave = async () => {
    const validationError = validate();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        address: form.address.trim(),
        countryId: form.countryId,
        latitude: form.latitude.trim() || null,
        longitude: form.longitude.trim() || null,
      };

      if (selectedLocationId) {
        const response = await updateProviderLocation(selectedLocationId, payload);
        setLocations((prev) =>
          prev.map((location) =>
            location.id === selectedLocationId ? response.location : location,
          ),
        );
        toast.success("Location updated");
      } else {
        const response = await createProviderLocation(payload);
        setLocations((prev) => [response.location, ...prev]);
        setSelectedLocationId(response.location.id);
        toast.success("Location created");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save location",
      );
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (location: ProviderLocation) => {
    const confirmed = window.confirm(
      `Delete "${location.name}"? This only works if no car is attached to it.`,
    );
    if (!confirmed) return;

    try {
      setDeletingId(location.id);
      await deleteProviderLocation(location.id);
      setLocations((prev) => prev.filter((item) => item.id !== location.id));
      if (selectedLocationId === location.id) {
        resetForm();
      }
      toast.success("Location deleted");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete location",
      );
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    if (!mapApiKey) {
      setMapLoadError(null);
      setIsMapReady(false);
      mapRef.current = null;
      mapMarkerRef.current = null;
      mapAutocompleteRef.current = null;
      mapGeocoderRef.current = null;
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

        const latitude = Number.parseFloat(form.latitude);
        const longitude = Number.parseFloat(form.longitude);
        const center =
          Number.isFinite(latitude) && Number.isFinite(longitude)
            ? { lat: latitude, lng: longitude }
            : DEFAULT_CENTER;

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

          mapGeocoderRef.current = new googleMaps.maps.Geocoder();

          mapRef.current.addListener("click", (event: any) => {
            if (!event.latLng) return;
            suppressMapSyncRef.current = true;
            const nextLat = event.latLng.lat();
            const nextLng = event.latLng.lng();
            mapMarkerRef.current?.setPosition(event.latLng);
            setForm((prev) => ({
              ...prev,
              latitude: nextLat.toFixed(6),
              longitude: nextLng.toFixed(6),
            }));
            void syncAddressFromCoords(nextLat, nextLng);
            window.setTimeout(() => {
              suppressMapSyncRef.current = false;
            }, 0);
          });

          mapMarkerRef.current.addListener("dragend", (event: any) => {
            if (!event.latLng) return;
            suppressMapSyncRef.current = true;
            const nextLat = event.latLng.lat();
            const nextLng = event.latLng.lng();
            setForm((prev) => ({
              ...prev,
              latitude: nextLat.toFixed(6),
              longitude: nextLng.toFixed(6),
            }));
            void syncAddressFromCoords(nextLat, nextLng);
            window.setTimeout(() => {
              suppressMapSyncRef.current = false;
            }, 0);
          });

          mapAutocompleteRef.current =
            new googleMaps.maps.places.Autocomplete(searchInput, {
              fields: ["formatted_address", "geometry", "address_components", "name"],
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

            setForm((prev) => {
              const countryComponent = place.address_components?.find((component: any) =>
                Array.isArray(component.types) && component.types.includes("country"),
              );
              const nextCountryId =
                countries.find((country) => {
                  const longName = String(countryComponent?.long_name ?? "").toLowerCase();
                  const shortName = String(countryComponent?.short_name ?? "").toLowerCase();
                  return (
                    country.name.toLowerCase() === longName ||
                    country.code.toLowerCase() === shortName
                  );
                })?.id ?? prev.countryId;

              return {
                ...prev,
                address:
                  place.formatted_address || place.name || prev.address,
                latitude: nextLat.toFixed(6),
                longitude: nextLng.toFixed(6),
                countryId: nextCountryId,
              };
            });

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
  }, [mapApiKey, form.latitude, form.longitude, countries]);

  useEffect(() => {
    if (!isMapReady || suppressMapSyncRef.current) return;
    if (!mapRef.current || !mapMarkerRef.current) return;

    const latitude = Number.parseFloat(form.latitude);
    const longitude = Number.parseFloat(form.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

    const nextPosition = { lat: latitude, lng: longitude };
    mapRef.current.panTo(nextPosition);
    mapMarkerRef.current.setPosition(nextPosition);
  }, [form.latitude, form.longitude, isMapReady]);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Locations</h1>
          <p style={styles.subtitle}>
            Manage the pickup locations your cars can be assigned to.
          </p>
        </div>
        <button style={styles.primaryButton} onClick={resetForm}>
          New Location
        </button>
      </div>

      <div style={styles.layout}>
        <section style={styles.listCard}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Saved Locations</h2>
            <span style={styles.counter}>
              {loading ? "..." : `${locations.length} total`}
            </span>
          </div>

          <div style={styles.locationList}>
            {loading ? (
              <div style={styles.empty}>Loading locations...</div>
            ) : sortedLocations.length === 0 ? (
              <div style={styles.empty}>
                No locations yet. Create the first one so cars can be assigned.
              </div>
            ) : (
              sortedLocations.map((location) => {
                const isActive = selectedLocationId === location.id;
                return (
                  <article
                    key={location.id}
                    style={{
                      ...styles.locationCard,
                      ...(isActive ? styles.locationCardActive : {}),
                    }}
                  >
                    <button
                      style={styles.locationButton}
                      onClick={() => loadLocationIntoForm(location)}
                    >
                      <div style={styles.locationTopRow}>
                        <strong style={styles.locationName}>{location.name}</strong>
                        <span style={styles.countryBadge}>
                          {location.countryCode || location.countryName || "Country"}
                        </span>
                      </div>
                      <p style={styles.locationAddress}>{location.address}</p>
                    </button>

                    <div style={styles.locationActions}>
                      <button
                        style={styles.secondaryButton}
                        onClick={() => loadLocationIntoForm(location)}
                      >
                        Edit
                      </button>
                      <button
                        style={styles.ghostDanger}
                        onClick={() => void onDelete(location)}
                        disabled={deletingId === location.id}
                      >
                        {deletingId === location.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>

        <section style={styles.formCard}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>
                {selectedLocation ? "Edit Location" : "Create Location"}
              </h2>
              <p style={styles.sectionText}>
                Search on the map, click the right point, and the address will fill
                itself in.
              </p>
            </div>
            {selectedLocation ? (
              <button style={styles.linkButton} onClick={resetForm}>
                Clear
              </button>
            ) : null}
          </div>

          <div style={styles.formGrid}>
            <div style={styles.topGrid}>
              <Field label="Location Name">
                <input
                  style={styles.input}
                  value={form.name}
                  onChange={(event) => setField("name", event.target.value)}
                  placeholder="Lekki Flagship Hub"
                />
              </Field>

              <Field label="Country">
                <select
                  style={styles.input}
                  value={form.countryId}
                  onChange={(event) => setField("countryId", event.target.value)}
                >
                  <option value="">Select country</option>
                  {countries.map((country) => (
                    <option key={country.id} value={country.id}>
                      {country.name} ({country.code})
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div style={styles.mapCard}>
              <Field label="Map Search">
                <input
                  ref={mapSearchInputRef}
                  style={styles.input}
                  placeholder={
                    mapApiKey
                      ? "Search address or landmark"
                      : "Enable Google Maps in platform settings first"
                  }
                  disabled={!mapApiKey}
                />
              </Field>

              <div ref={mapContainerRef} style={styles.mapCanvas} />

              {mapLoadError ? <p style={styles.mapError}>{mapLoadError}</p> : null}
              {!mapApiKey ? (
                <p style={styles.mapHint}>
                  Google Maps API key is not available yet. Set it in the admin
                  dashboard map settings.
                </p>
              ) : (
                <p style={styles.mapHint}>
                  Pick a place from search or click the map to set coordinates and
                  address automatically.
                </p>
              )}
            </div>

            <Field label="Address">
              <textarea
                style={styles.textarea}
                value={form.address}
                onChange={(event) => setField("address", event.target.value)}
                placeholder="12 Admiralty Way, Lekki Phase 1, Lagos"
              />
            </Field>

            <div style={styles.coordinatesGrid}>
              <Field label="Latitude">
                <input
                  style={styles.input}
                  value={form.latitude}
                  onChange={(event) => setField("latitude", event.target.value)}
                  placeholder="6.4474"
                />
              </Field>

              <Field label="Longitude">
                <input
                  style={styles.input}
                  value={form.longitude}
                  onChange={(event) => setField("longitude", event.target.value)}
                  placeholder="3.4722"
                />
              </Field>
            </div>
          </div>

          <div style={styles.formFooter}>
            <button
              style={styles.primaryButton}
              onClick={() => void onSave()}
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : selectedLocation
                  ? "Update Location"
                  : "Create Location"}
            </button>
            <p style={styles.footerHint}>
              Cars can only be assigned to locations owned by this provider.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label style={styles.field}>
      <span style={styles.label}>{label}</span>
      {children}
    </label>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
    maxWidth: 1380,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    flexWrap: "wrap",
  },
  title: {
    margin: 0,
    fontSize: 28,
    fontWeight: 700,
  },
  subtitle: {
    margin: "8px 0 0",
    color: "var(--fg-60)",
    maxWidth: 640,
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "minmax(260px, 0.78fr) minmax(420px, 1.42fr)",
    gap: 18,
  },
  listCard: {
    borderRadius: 18,
    border: "1px solid var(--input-border)",
    background: "var(--surface-1)",
    padding: 18,
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  formCard: {
    borderRadius: 18,
    border: "1px solid var(--input-border)",
    background: "var(--surface-1)",
    padding: 18,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  sectionHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  sectionTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 700,
  },
  sectionText: {
    margin: "6px 0 0",
    color: "var(--fg-60)",
    fontSize: 13,
    lineHeight: 1.5,
    maxWidth: 520,
  },
  counter: {
    fontSize: 12,
    color: "var(--fg-60)",
  },
  locationList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  locationCard: {
    borderRadius: 12,
    border: "1px solid var(--input-border)",
    background: "var(--surface-2)",
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  locationCardActive: {
    borderColor: "rgba(34,197,94,0.42)",
    boxShadow: "0 0 0 1px rgba(34,197,94,0.16) inset",
  },
  locationButton: {
    border: "none",
    background: "transparent",
    padding: 0,
    textAlign: "left",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    color: "inherit",
  },
  locationTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  locationName: {
    fontSize: 15,
  },
  countryBadge: {
    borderRadius: 999,
    border: "1px solid var(--input-border)",
    background: "var(--surface-1)",
    padding: "4px 10px",
    fontSize: 11,
    color: "var(--fg-70)",
    fontWeight: 700,
  },
  locationAddress: {
    margin: 0,
    color: "var(--foreground)",
    fontSize: 13,
    lineHeight: 1.5,
  },
  locationActions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  formGrid: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  topGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
  },
  mapCard: {
    borderRadius: 14,
    border: "1px solid var(--input-border)",
    background: "var(--surface-2)",
    padding: 14,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  mapCanvas: {
    width: "100%",
    minHeight: 320,
    borderRadius: 12,
    overflow: "hidden",
    border: "1px solid var(--input-border)",
    background:
      "linear-gradient(135deg, rgba(15,23,42,0.9), rgba(13,148,136,0.22))",
  },
  mapHint: {
    margin: 0,
    color: "var(--fg-60)",
    fontSize: 12,
    lineHeight: 1.5,
  },
  mapError: {
    margin: 0,
    color: "#fca5a5",
    fontSize: 12,
    fontWeight: 600,
  },
  coordinatesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 12,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: 700,
    color: "var(--fg-70)",
    letterSpacing: 0.2,
  },
  input: {
    height: 44,
    borderRadius: 12,
    border: "1px solid var(--input-border)",
    background: "var(--surface-1)",
    color: "var(--foreground)",
    padding: "0 14px",
    outline: "none",
    fontSize: 14,
  },
  textarea: {
    minHeight: 110,
    borderRadius: 12,
    border: "1px solid var(--input-border)",
    background: "var(--surface-1)",
    color: "var(--foreground)",
    padding: "12px 14px",
    outline: "none",
    resize: "vertical",
    fontSize: 14,
    fontFamily: "inherit",
  },
  formFooter: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  footerHint: {
    margin: 0,
    color: "var(--fg-60)",
    fontSize: 13,
  },
  primaryButton: {
    height: 44,
    borderRadius: 12,
    border: "none",
    background: "var(--brand-primary)",
    color: "#fff",
    padding: "0 16px",
    fontWeight: 700,
    cursor: "pointer",
  },
  secondaryButton: {
    height: 36,
    borderRadius: 10,
    border: "1px solid var(--input-border)",
    background: "var(--surface-1)",
    color: "var(--foreground)",
    padding: "0 14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  ghostDanger: {
    height: 36,
    borderRadius: 10,
    border: "1px solid rgba(239,68,68,0.22)",
    background: "rgba(239,68,68,0.08)",
    color: "#fca5a5",
    padding: "0 14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  linkButton: {
    border: "none",
    background: "transparent",
    color: "#93C5FD",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    padding: 0,
  },
  empty: {
    borderRadius: 12,
    border: "1px dashed var(--input-border)",
    background: "var(--surface-2)",
    padding: 18,
    textAlign: "center",
    color: "var(--fg-60)",
    fontSize: 13,
  },
};
