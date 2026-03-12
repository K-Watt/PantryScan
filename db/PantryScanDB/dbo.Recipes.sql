CREATE TABLE [dbo].[Recipes]
(
    [RecipeId]       INT IDENTITY (1, 1) NOT NULL,
    [Name]           NVARCHAR (200) NOT NULL,
    [Course]         NVARCHAR (100) NULL,
    [Cuisine]        NVARCHAR (300) NULL,
    [Source]         NVARCHAR (200) NULL,
    [TagsJson]       NVARCHAR (MAX) NULL,
    [Rating]         INT CONSTRAINT [DF_Recipes_Rating] DEFAULT (0) NOT NULL,
    [AddedAt]        DATETIME2 (7) NULL,
    [Servings]       INT NULL,
    [IngredientsJson] NVARCHAR (MAX) NOT NULL,
    [StepsJson]      NVARCHAR (MAX) NOT NULL,
    [Comments]       NVARCHAR (MAX) NULL,
    [ImageUrl]       NVARCHAR (MAX) NULL,
    [CreatedAt]      DATETIME2 (7) CONSTRAINT [DF_Recipes_CreatedAt] DEFAULT (SYSUTCDATETIME()) NOT NULL,
    CONSTRAINT [PK_Recipes] PRIMARY KEY CLUSTERED ([RecipeId] ASC)
);
