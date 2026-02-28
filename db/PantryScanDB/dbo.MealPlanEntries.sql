CREATE TABLE [dbo].[MealPlanEntries]
(
    [MealPlanEntryId] INT IDENTITY (1, 1) NOT NULL,
    [PlanDate]        DATE NOT NULL,
    [MealType]        NVARCHAR (40) NOT NULL,
    [RecipeId]        INT NULL,
    [RecipeName]      NVARCHAR (200) NOT NULL,
    [Notes]           NVARCHAR (1000) NULL,
    [CreatedAt]       DATETIME2 (7) CONSTRAINT [DF_MealPlanEntries_CreatedAt] DEFAULT (SYSUTCDATETIME()) NOT NULL,
    CONSTRAINT [PK_MealPlanEntries] PRIMARY KEY CLUSTERED ([MealPlanEntryId] ASC),
    CONSTRAINT [FK_MealPlanEntries_Recipes_RecipeId] FOREIGN KEY ([RecipeId]) REFERENCES [dbo].[Recipes] ([RecipeId])
);
