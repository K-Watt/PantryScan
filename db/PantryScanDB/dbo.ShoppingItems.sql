CREATE TABLE [dbo].[ShoppingItems]
(
	[ShoppingItemId] INT           IDENTITY (1, 1) NOT NULL,
	[ClientId]       NVARCHAR (64) NOT NULL,
	[Name]           NVARCHAR (200) NOT NULL,
	[Qty]            NVARCHAR (100) NULL,
	[Category]       NVARCHAR (100) NULL,
	[Store]          NVARCHAR (200) NULL,
	[Note]           NVARCHAR (500) NULL,
	[RecipesJson]    NVARCHAR (MAX) NULL,
	[IsChecked]      BIT           CONSTRAINT [DF_ShoppingItems_IsChecked] DEFAULT (0) NOT NULL,
	[CreatedAt]      DATETIME2 (7) CONSTRAINT [DF_ShoppingItems_CreatedAt] DEFAULT (SYSUTCDATETIME()) NOT NULL,
	CONSTRAINT [PK_ShoppingItems]        PRIMARY KEY CLUSTERED ([ShoppingItemId] ASC),
	CONSTRAINT [UQ_ShoppingItems_ClientId] UNIQUE ([ClientId])
);
