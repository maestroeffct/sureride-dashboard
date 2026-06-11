export const GLOBAL_REGION_SCOPE = "ALL";

export type Region = { code: string; label: string };

// Sub-country region catalog. Only countries with meaningful sub-national tax
// or regulatory variance are listed — for everywhere else, the region picker
// stays hidden and pricing falls back to country-wide rules.
export const REGIONS_BY_COUNTRY: Record<string, Region[]> = {
  US: [
    { code: "AL", label: "Alabama" },
    { code: "AK", label: "Alaska" },
    { code: "AZ", label: "Arizona" },
    { code: "AR", label: "Arkansas" },
    { code: "CA", label: "California" },
    { code: "CO", label: "Colorado" },
    { code: "CT", label: "Connecticut" },
    { code: "DE", label: "Delaware" },
    { code: "DC", label: "District of Columbia" },
    { code: "FL", label: "Florida" },
    { code: "GA", label: "Georgia" },
    { code: "HI", label: "Hawaii" },
    { code: "ID", label: "Idaho" },
    { code: "IL", label: "Illinois" },
    { code: "IN", label: "Indiana" },
    { code: "IA", label: "Iowa" },
    { code: "KS", label: "Kansas" },
    { code: "KY", label: "Kentucky" },
    { code: "LA", label: "Louisiana" },
    { code: "ME", label: "Maine" },
    { code: "MD", label: "Maryland" },
    { code: "MA", label: "Massachusetts" },
    { code: "MI", label: "Michigan" },
    { code: "MN", label: "Minnesota" },
    { code: "MS", label: "Mississippi" },
    { code: "MO", label: "Missouri" },
    { code: "MT", label: "Montana" },
    { code: "NE", label: "Nebraska" },
    { code: "NV", label: "Nevada" },
    { code: "NH", label: "New Hampshire" },
    { code: "NJ", label: "New Jersey" },
    { code: "NM", label: "New Mexico" },
    { code: "NY", label: "New York" },
    { code: "NC", label: "North Carolina" },
    { code: "ND", label: "North Dakota" },
    { code: "OH", label: "Ohio" },
    { code: "OK", label: "Oklahoma" },
    { code: "OR", label: "Oregon" },
    { code: "PA", label: "Pennsylvania" },
    { code: "RI", label: "Rhode Island" },
    { code: "SC", label: "South Carolina" },
    { code: "SD", label: "South Dakota" },
    { code: "TN", label: "Tennessee" },
    { code: "TX", label: "Texas" },
    { code: "UT", label: "Utah" },
    { code: "VT", label: "Vermont" },
    { code: "VA", label: "Virginia" },
    { code: "WA", label: "Washington" },
    { code: "WV", label: "West Virginia" },
    { code: "WI", label: "Wisconsin" },
    { code: "WY", label: "Wyoming" },
  ],
  CA: [
    { code: "AB", label: "Alberta" },
    { code: "BC", label: "British Columbia" },
    { code: "MB", label: "Manitoba" },
    { code: "NB", label: "New Brunswick" },
    { code: "NL", label: "Newfoundland and Labrador" },
    { code: "NS", label: "Nova Scotia" },
    { code: "ON", label: "Ontario" },
    { code: "PE", label: "Prince Edward Island" },
    { code: "QC", label: "Quebec" },
    { code: "SK", label: "Saskatchewan" },
    { code: "NT", label: "Northwest Territories" },
    { code: "NU", label: "Nunavut" },
    { code: "YT", label: "Yukon" },
  ],
  AU: [
    { code: "NSW", label: "New South Wales" },
    { code: "VIC", label: "Victoria" },
    { code: "QLD", label: "Queensland" },
    { code: "WA", label: "Western Australia" },
    { code: "SA", label: "South Australia" },
    { code: "TAS", label: "Tasmania" },
    { code: "ACT", label: "Australian Capital Territory" },
    { code: "NT", label: "Northern Territory" },
  ],
};

export function countryHasRegions(country: string | null | undefined): boolean {
  if (!country) return false;
  return (REGIONS_BY_COUNTRY[country.toUpperCase()]?.length ?? 0) > 0;
}

export function regionsFor(country: string | null | undefined): Region[] {
  if (!country) return [];
  return REGIONS_BY_COUNTRY[country.toUpperCase()] ?? [];
}
