# Car Metadata Config Contract (Draft)

Purpose: import `category -> brand -> model` data from an external API, review/store it in SureRide backend, and use the backend as the system of record for dashboard configuration and car creation.

Base: `/admin/cars/meta`
Auth: `Bearer <admin_token>`

## Recommended Prisma Schema

```prisma
model CarCategoryConfig {
  id          String   @id @default(uuid())
  name        String
  slug        String   @unique
  externalId  String?
  source      String?  // e.g. "car-query-api"
  isActive    Boolean  @default(true)
  sortOrder   Int      @default(0)
  metadata    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  brands      CarBrandConfig[]

  @@index([isActive])
  @@index([externalId])
}

model CarBrandConfig {
  id          String   @id @default(uuid())
  categoryId  String?
  name        String
  slug        String
  externalId  String?
  source      String?
  isActive    Boolean  @default(true)
  sortOrder   Int      @default(0)
  metadata    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  category    CarCategoryConfig? @relation(fields: [categoryId], references: [id])
  models      CarModelConfig[]

  @@unique([name, categoryId])
  @@index([categoryId])
  @@index([externalId])
  @@index([isActive])
}

model CarModelConfig {
  id          String   @id @default(uuid())
  categoryId  String?
  brandId     String
  name        String
  slug        String
  externalId  String?
  source      String?
  isActive    Boolean  @default(true)
  sortOrder   Int      @default(0)
  metadata    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  category    CarCategoryConfig? @relation(fields: [categoryId], references: [id])
  brand       CarBrandConfig     @relation(fields: [brandId], references: [id])

  @@unique([name, brandId])
  @@index([brandId])
  @@index([categoryId])
  @@index([externalId])
  @@index([isActive])
}
```

## Why this structure

- `Car.category` on current cars can stay as-is for now.
- New config tables give you normalized metadata without breaking existing cars.
- `externalId` + `source` allow future re-sync from the external provider.
- `isActive` lets admin disable values without deleting history.

## API Contract

## 1) Categories

### `GET /admin/cars/meta/categories`
Query params:
- `q?: string`
- `isActive?: boolean`
- `page?: number`
- `limit?: number`

Response:
```json
{
  "items": [
    {
      "id": "cat_1",
      "name": "SUV",
      "slug": "suv",
      "externalId": "ext_cat_10",
      "source": "external-cars-api",
      "isActive": true,
      "sortOrder": 1,
      "brandsCount": 12,
      "modelsCount": 86,
      "createdAt": "2026-03-21T10:00:00.000Z",
      "updatedAt": "2026-03-21T10:00:00.000Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

### `POST /admin/cars/meta/categories/import`
Body:
```json
{
  "source": "external-cars-api",
  "items": [
    {
      "externalId": "ext_cat_10",
      "name": "SUV",
      "slug": "suv",
      "sortOrder": 1,
      "metadata": {}
    }
  ]
}
```

Response:
```json
{
  "message": "Categories imported",
  "created": 3,
  "updated": 9,
  "skipped": 0
}
```

### `POST /admin/cars/meta/categories`
Body:
```json
{
  "name": "Convertible",
  "slug": "convertible",
  "isActive": true,
  "sortOrder": 20
}
```

### `PATCH /admin/cars/meta/categories/:categoryId`
Body:
```json
{
  "name": "SUV",
  "isActive": true,
  "sortOrder": 1
}
```

## 2) Brands

### `GET /admin/cars/meta/brands`
Query params:
- `categoryId?: string`
- `q?: string`
- `isActive?: boolean`
- `page?: number`
- `limit?: number`

Response:
```json
{
  "items": [
    {
      "id": "brand_1",
      "categoryId": "cat_1",
      "categoryName": "SUV",
      "name": "Toyota",
      "slug": "toyota",
      "externalId": "ext_brand_3",
      "source": "external-cars-api",
      "isActive": true,
      "sortOrder": 1,
      "modelsCount": 24,
      "createdAt": "2026-03-21T10:00:00.000Z",
      "updatedAt": "2026-03-21T10:00:00.000Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

### `POST /admin/cars/meta/brands/import`
Body:
```json
{
  "source": "external-cars-api",
  "categoryId": "cat_1",
  "items": [
    {
      "externalId": "ext_brand_3",
      "name": "Toyota",
      "slug": "toyota",
      "sortOrder": 1,
      "metadata": {}
    }
  ]
}
```

### `POST /admin/cars/meta/brands`
Body:
```json
{
  "categoryId": "cat_1",
  "name": "Toyota",
  "slug": "toyota",
  "isActive": true,
  "sortOrder": 1
}
```

### `PATCH /admin/cars/meta/brands/:brandId`
Body:
```json
{
  "categoryId": "cat_1",
  "name": "Toyota",
  "isActive": true,
  "sortOrder": 1
}
```

## 3) Models

### `GET /admin/cars/meta/models`
Query params:
- `categoryId?: string`
- `brandId?: string`
- `q?: string`
- `isActive?: boolean`
- `page?: number`
- `limit?: number`

Response:
```json
{
  "items": [
    {
      "id": "model_1",
      "categoryId": "cat_1",
      "categoryName": "SUV",
      "brandId": "brand_1",
      "brandName": "Toyota",
      "name": "RAV4",
      "slug": "rav4",
      "externalId": "ext_model_88",
      "source": "external-cars-api",
      "isActive": true,
      "sortOrder": 1,
      "createdAt": "2026-03-21T10:00:00.000Z",
      "updatedAt": "2026-03-21T10:00:00.000Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

### `POST /admin/cars/meta/models/import`
Body:
```json
{
  "source": "external-cars-api",
  "categoryId": "cat_1",
  "brandId": "brand_1",
  "items": [
    {
      "externalId": "ext_model_88",
      "name": "RAV4",
      "slug": "rav4",
      "sortOrder": 1,
      "metadata": {}
    }
  ]
}
```

### `POST /admin/cars/meta/models`
Body:
```json
{
  "categoryId": "cat_1",
  "brandId": "brand_1",
  "name": "RAV4",
  "slug": "rav4",
  "isActive": true,
  "sortOrder": 1
}
```

### `PATCH /admin/cars/meta/models/:modelId`
Body:
```json
{
  "brandId": "brand_1",
  "name": "RAV4",
  "isActive": true,
  "sortOrder": 1
}
```

## Dashboard Import Flow

### Category page
1. Click `Import Categories`
2. Dashboard calls external API
3. Show preview table
4. Admin selects items
5. Dashboard sends selected items to `POST /admin/cars/meta/categories/import`
6. Backend upserts and stores them

### Brand page
1. Admin selects category
2. Click `Import Brands`
3. Dashboard calls external API using selected category mapping
4. Admin confirms items
5. Dashboard sends to `POST /admin/cars/meta/brands/import`

### Model page
1. Admin selects category and brand
2. Click `Import Models`
3. Dashboard calls external API
4. Admin confirms items
5. Dashboard sends to `POST /admin/cars/meta/models/import`

## Add Car Flow After This

### Recommended backend endpoints for dropdowns
- `GET /admin/cars/meta/categories?isActive=true&limit=200`
- `GET /admin/cars/meta/brands?categoryId=:id&isActive=true&limit=500`
- `GET /admin/cars/meta/models?brandId=:id&isActive=true&limit=1000`

### Recommended create/update payload change
Current car payload uses free text:
```json
{
  "brand": "Toyota",
  "model": "RAV4",
  "category": "SUV"
}
```

Recommended future-safe payload:
```json
{
  "categoryId": "cat_1",
  "brandId": "brand_1",
  "modelId": "model_1",
  "category": "SUV",
  "brand": "Toyota",
  "model": "RAV4"
}
```

Reason:
- IDs give normalization
- names still get denormalized onto `Car` for simple querying/history

## Validation Rules

- `slug`: lowercase kebab-case
- no duplicate category slug
- no duplicate brand name within same category
- no duplicate model name within same brand
- imports should upsert by `externalId` when present, otherwise by normalized slug/name
- manual entries should set `source = "manual"`

## Recommendation

Phase 1:
- add metadata tables and admin endpoints
- keep `Car` table unchanged
- use config tables for dashboard dropdowns

Phase 2:
- add `categoryId`, `brandId`, `modelId` to `Car`
- backfill existing cars gradually

This is the safest path because it does not break current car APIs while giving you a professional admin configuration system.
