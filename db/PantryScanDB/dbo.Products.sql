-- Local cache of product metadata looked up by barcode.
-- Populated from OpenFoodFacts (https://world.openfoodfacts.org) on first scan,
-- so subsequent scans of the same product resolve instantly and offline.
CREATE TABLE dbo.Products (
  Barcode NVARCHAR (64) NOT NULL PRIMARY KEY,
  Name NVARCHAR (300) NULL,
  Brand NVARCHAR (200) NULL,
  ImageUrl NVARCHAR (500) NULL,
  Categories NVARCHAR (500) NULL,
  PackageSize NVARCHAR (100) NULL,
  NutritionJson NVARCHAR (MAX) NULL,     -- normalized per-100g nutrition + grades
  Source NVARCHAR (50) NOT NULL DEFAULT ('openfoodfacts'),
  FetchedAt DATETIME2 NOT NULL DEFAULT (SYSUTCDATETIME())
);
