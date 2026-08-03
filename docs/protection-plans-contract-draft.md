# Protection Plans (Rental Insurance) Contract — Backend Ticket (Draft)

**Owner:** Backend • **Consumers:** Dashboard (provider + admin), Mobile app (renter booking) • **Status:** Draft for implementation

Purpose: replace the current thin "insurance package" model with a proper, region-aware, **tiered protection-plan** product — the way P2P rental marketplaces (Turo, Getaround) and traditional rentals (Hertz/Avis) actually model it. This unblocks the dashboard UI (currently forced to show prices with no currency and no coverage detail) and closes a real regulatory exposure.

Base paths: `/provider/insurance` (provider), `/admin/insurance` (admin), plus renter-facing selection at booking.
Auth: `Bearer <provider_token>` / `Bearer <admin_token>`.

---

## 0. Why this is needed (context)

Today a "package" is `{ name, description, dailyPrice, carId?, providerId?, isActive }`. Problems:

1. **It's a price tag, not a coverage product** — no deductible, no coverage limit, no covered/excluded perils. A renter can't tell what they actually get in a crash.
2. **We call it "Insurance"** and let unlicensed providers author it. Marketplaces deliberately sell a **damage waiver / "protection plan"** (a contractual risk allocation), *not* insurance, because selling insurance requires a license — in Nigeria, **NAICOM**. (Turo/Getaround both do this; CDW/LDW is a waiver, not a policy — Cornell LII, LegalClarity.)
3. **No statutory third-party cover tracking.** Nigeria mandates third-party motor insurance, **min ₦3,000,000** property-damage per incident, enforced nationwide since **Feb 1 2025** (Insurance Act 2003 §68). That is *real* insurance and must be underwritten by a NAICOM-licensed carrier — architecturally separate from the waiver tiers.
4. **Currency is not on the model**, so the dashboard cannot render the right symbol (it now shows currency-neutral numbers by necessity).
5. **No admin approval gate** for a financial/liability product; **no underwriter/policy metadata** for a claims paper trail.

Target model: **3 mutually-exclusive renter tiers differentiated by deductible**, a separate **owner-protection** concept, and a separate **statutory coverage** record. Renter picks exactly one tier at booking; fee = per-day × days (or % of trip).

---

## 1. Recommended Prisma Schema

```prisma
enum ProtectionTier {
  PREMIUM    // $0 / lowest deductible, highest price
  STANDARD   // mid deductible
  MINIMUM    // highest deductible, lowest price (statutory floor only)
}

enum ProtectionProductType {
  DAMAGE_WAIVER  // DEFAULT — contractual, NOT insurance; never labeled "insurance"
  INSURANCE      // only when backed by a licensed (e.g. NAICOM) underwriter
}

enum ProtectionPricingModel {
  PER_DAY
  PER_RENTAL
  PERCENT_OF_TRIP
}

enum ProtectionCoverageType {
  PRIMARY    // pays first
  SECONDARY  // excess over the renter's own policy
}

enum ProtectionScope {
  RENTER  // guest-facing tier chosen at booking
  OWNER   // owner/provider-side protection (separate contract)
}

enum ProtectionApprovalStatus {
  PENDING
  APPROVED
  REJECTED
}

model ProtectionPlan {
  id            String  @id @default(uuid())

  // Identity / classification
  tier          ProtectionTier
  scope         ProtectionScope        @default(RENTER)
  productType   ProtectionProductType  @default(DAMAGE_WAIVER)
  name          String
  description   String

  // The money model — currency is REQUIRED (fixes the dashboard blocker)
  currency      String                 // ISO-4217, e.g. "NGN", "USD"
  pricingModel  ProtectionPricingModel @default(PER_DAY)
  pricePerDay   Decimal?               @db.Decimal(12, 2)
  pricePercent  Decimal?               @db.Decimal(5, 2)   // when PERCENT_OF_TRIP

  // Coverage economics — the deductible is what DEFINES a tier
  deductibleAmount     Decimal  @db.Decimal(12, 2)
  liabilityLimit       Decimal  @db.Decimal(14, 2)  // third-party cap (NG floor 3,000,000)
  physicalDamageLimit  Decimal? @db.Decimal(14, 2)  // car damage cap; null = ACV
  processingFee        Decimal? @db.Decimal(12, 2)  // flat per-claim handling fee
  securityDepositAmount Decimal? @db.Decimal(12, 2)

  // What's in / out
  coveredPerils  String[]  // e.g. ["COLLISION","THEFT","FIRE","VANDALISM","WEATHER","GLASS","THIRD_PARTY"]
  exclusions     String[]  // e.g. ["INTERIOR","MECHANICAL","TIRES","WRONG_FUEL","DUI","UNLISTED_DRIVER"]
  roadsideAssistanceIncluded Boolean @default(false)
  coverageType   ProtectionCoverageType @default(SECONDARY)

  // Regulatory / provenance
  underwriter        String?  // required when productType = INSURANCE
  minLiabilityRequired Decimal? @db.Decimal(14, 2) // regional floor the tier must satisfy
  allowedRegions     String[] // ISO country codes; empty = provider's region only

  // Scoping (unchanged semantics from today)
  providerId   String?   // null => global/admin-owned
  carId        String?   // null => all cars in scope
  provider     Provider? @relation(fields: [providerId], references: [id])
  car          Car?      @relation(fields: [carId], references: [id])

  // Lifecycle
  isActive        Boolean                  @default(true)
  approvalStatus  ProtectionApprovalStatus @default(PENDING)
  rejectionReason String?
  createdBy       String?  // admin/provider staff id
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  bookings Booking[] @relation("BookingProtectionPlan")

  @@index([providerId, scope, isActive])
  @@index([carId])
  @@index([tier])
}

// Real, licensed statutory cover — NOT a waiver. One per car (per period).
model StatutoryCoverage {
  id            String   @id @default(uuid())
  carId         String
  car           Car      @relation(fields: [carId], references: [id])
  countryCode   String                       // e.g. "NG"
  underwriter   String                       // NAICOM-licensed insurer name
  policyNumber  String
  liabilityLimit Decimal @db.Decimal(14, 2)  // NG: >= 3,000,000
  currency      String
  documentUrl   String?                      // uploaded certificate
  effectiveFrom DateTime
  effectiveTo   DateTime
  isVerified    Boolean  @default(false)     // admin-verified
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([carId, effectiveTo])
}
```

### Booking additions

```prisma
model Booking {
  // ... existing fields ...
  protectionPlanId  String?
  protectionPlan    ProtectionPlan? @relation("BookingProtectionPlan", fields: [protectionPlanId], references: [id])

  // Snapshot at time of booking (plans can change/deactivate later):
  protectionTier        ProtectionTier?
  protectionFeeTotal    Decimal? @db.Decimal(12, 2)  // = pricePerDay * rentalDays (or % * subtotal)
  protectionDeductible  Decimal? @db.Decimal(12, 2)  // deductible that applies to THIS booking
  protectionCurrency    String?
}
```
> Keep the existing `insuranceFee` field mapping to `protectionFeeTotal` during transition (see §4).

---

## 2. API Contract

All money responses MUST include `currency` (ISO-4217). This is the field the dashboard needs.

### Provider (`Bearer <provider_token>`)
- `GET /provider/insurance` → `{ items: ProtectionPlan[] }` (scope=RENTER + OWNER for this provider)
- `POST /provider/insurance` → create (forced `productType=DAMAGE_WAIVER`, `approvalStatus=PENDING`)
- `PATCH /provider/insurance/:id` → update (re-enters PENDING if coverage economics change)
- `DELETE /provider/insurance/:id`
- Providers **cannot** set `productType=INSURANCE` or `underwriter` (admin-only).

### Admin (`Bearer <admin_token>`)
- `GET /admin/insurance?scope=global|provider|all&providerId=&isActive=&approvalStatus=&search=`
- `POST /admin/insurance` (may create global plans, set `productType=INSURANCE` + `underwriter`)
- `PATCH /admin/insurance/:id`
- `PATCH /admin/insurance/:id/approval` → `{ approvalStatus, rejectionReason? }` (the **approval gate**)
- `DELETE /admin/insurance/:id`
- Statutory: `GET/POST/PATCH /admin/cars/:carId/statutory-coverage`, `PATCH .../verification`

### Renter / booking (public or `Bearer <user_token>`)
- `GET /cars/:carId/protection-plans` → the **selectable RENTER tiers** for that car (active + approved, region-valid), each with deductible/limits/perils so the app can render tier cards.
- Booking create accepts `protectionPlanId`; server recomputes `protectionFeeTotal` and snapshots deductible/currency (never trust client-sent fee).

### JSON shape (what the dashboard consumes)
```jsonc
{
  "id": "uuid",
  "tier": "STANDARD",
  "scope": "RENTER",
  "productType": "DAMAGE_WAIVER",
  "name": "Standard Protection",
  "description": "…",
  "currency": "NGN",                 // <-- REQUIRED, unblocks symbol rendering
  "pricingModel": "PER_DAY",
  "pricePerDay": 5000,
  "deductibleAmount": 150000,
  "liabilityLimit": 3000000,
  "physicalDamageLimit": null,
  "coveredPerils": ["COLLISION","THEFT","FIRE","THIRD_PARTY"],
  "exclusions": ["INTERIOR","MECHANICAL","TIRES"],
  "coverageType": "SECONDARY",
  "roadsideAssistanceIncluded": false,
  "underwriter": null,
  "isActive": true,
  "approvalStatus": "APPROVED",
  "providerId": "…", "carId": null,
  "provider": { "id": "…", "name": "…" },
  "car": null,
  "createdAt": "…"
}
```

---

## 3. Validation & business rules

- **Currency** required; must be a supported ISO-4217 code. Deductible/limits are in that currency.
- **Tier ↔ deductible ordering:** `PREMIUM.deductible <= STANDARD.deductible <= MINIMUM.deductible` within the same provider/car scope (reject inversions).
- **Region floor:** if `allowedRegions` includes `NG`, `liabilityLimit >= 3,000,000` (block otherwise). Make the floor a per-region config, not a constant.
- **Product labeling:** `productType=INSURANCE` requires a non-empty `underwriter`; providers can never set it.
- **Mutually-exclusive selection:** a booking references exactly one RENTER plan; server rejects >1.
- **Fee is server-computed:** `PER_DAY → pricePerDay * rentalDays`; `PERCENT_OF_TRIP → subtotal * pricePercent/100`. Ignore any client-sent fee.
- **Lock after start:** the selected plan/deductible cannot change once the rental has started.
- **Approval gate:** renter-selectable only when `isActive && approvalStatus=APPROVED`.

---

## 4. Migration & backfill (from current `InsurancePackage`)

1. Create `ProtectionPlan` / `StatutoryCoverage` tables + booking columns.
2. Backfill each existing package → `ProtectionPlan` with:
   - `tier = STANDARD`, `scope = RENTER`, `productType = DAMAGE_WAIVER`, `pricingModel = PER_DAY`, `pricePerDay = dailyPrice`, `approvalStatus = APPROVED` (grandfather existing), `isActive` preserved, `providerId`/`carId` preserved.
   - `currency`: infer from the provider's country/car region; default to the provider's primary market. **This is the value the dashboard is currently missing.**
   - `deductibleAmount`/`liabilityLimit`: seed with region defaults (NG: liability `3,000,000`, a sensible default deductible) and flag for provider review.
3. Map `Booking.insuranceFee → protectionFeeTotal`, keep `insuranceFee` as a read alias for one release, then deprecate.
4. Keep `/…/insurance` route paths (the dashboard already points there) to avoid a coordinated URL change.

---

## 5. What this unblocks on the dashboard (frontend follow-ups)

Once the API returns the fields above (esp. **`currency`**):
- Provider + admin plan lists render the **correct currency symbol** (revert the currency-neutral fallback in `formatMoney`). See `src/lib/currencyForCountry.ts` (`formatMoney`) and the optional `currency` already added to `AdminInsurancePackage` in `src/lib/adminInsuranceApi.ts`.
- Build the **tiered create/edit form** (tier, deductible, limits, perils, exclusions) and the **approval queue** in admin.
- Mobile: **single-select tier cards** at booking, each showing deductible + covered/excluded, with the server-computed fee.

---

## 6. Sources (for the model)

Turo protection tiers & "not insurance" framing — Policygenius, ValuePenguin, Turo blog. Getaround excess/buy-down levels — getaround.com/insurance & help articles. Waiver-vs-insurance legal distinction — Cornell LII (LDW), LegalClarity (CDW/LDW). P2P liability (primary/secondary) — Erie, Alias, CarInsurance.com. Nigeria statutory third-party (₦3M, Feb 2025 enforcement, NAICOM) — InsureNG, FactCheckHub, TONBOFA Law.
```
