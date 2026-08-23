CREATE TABLE dbo.Items (
  ItemId INT IDENTITY (1,1) PRIMARY KEY,
  Name NVARCHAR (200) NOT NULL,
  Quantity INT NOT NULL DEFAULT (0),
  LowStockThreshold INT NOT NULL DEFAULT (2),
  NeedsReview BIT NOT NULL DEFAULT (0),
  Barcode NVARCHAR (64) NULL,
  Brand NVARCHAR (200) NULL,
  ImageUrl NVARCHAR (500) NULL,
  LastScannedAt DATETIME2 NULL,
  CreatedAt DATETIME2 NOT NULL DEFAULT (SYSDATETIME())
);

-- One pantry row per barcode so re-scanning increments quantity.
CREATE UNIQUE INDEX UX_Items_Barcode ON dbo.Items (Barcode) WHERE Barcode IS NOT NULL;
