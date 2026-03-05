import { apiRequest } from "@/src/lib/api";
import type { RawCarApi, RentalCarRow } from "@/src/types/rentalCar";

function toDashboardStatus(car: RawCarApi): RentalCarRow["dashboardStatus"] {
  const isActive = car.isActive !== false;
  const providerStatus = (car.provider?.status || "").toUpperCase();

  if (!isActive) {
    return "flagged";
  }

  if (providerStatus && providerStatus !== "ACTIVE") {
    return "pending";
  }

  return "active";
}

export function mapCarToRow(car: RawCarApi): RentalCarRow {
  const locationName = car.location?.name || "-";
  const address = car.location?.address || "";

  return {
    id: car.id,
    brand: car.brand || "-",
    model: car.model || "-",
    category: car.category || "-",
    year: typeof car.year === "number" ? car.year : null,
    seats: typeof car.seats === "number" ? car.seats : null,
    transmission: car.transmission || "-",
    dailyRate: typeof car.dailyRate === "number" ? car.dailyRate : null,
    hourlyRate: typeof car.hourlyRate === "number" ? car.hourlyRate : null,
    isActive: car.isActive !== false,
    providerId: car.provider?.id || "",
    providerName: car.provider?.name || "Unknown Provider",
    providerStatus: car.provider?.status || "UNKNOWN",
    locationId: car.location?.id || "",
    locationName,
    city: address || locationName,
    imageUrl: car.images?.[0]?.url || "",
    createdAt: car.createdAt || new Date().toISOString(),
    dashboardStatus: toDashboardStatus(car),
  };
}

export async function listCars() {
  const cars = await apiRequest<RawCarApi[]>("/rental/cars", {
    method: "GET",
  });

  return cars.map(mapCarToRow);
}
