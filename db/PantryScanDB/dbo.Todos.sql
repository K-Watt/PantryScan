CREATE TABLE [dbo].[Todos]
(
    [TodoId]      INT           IDENTITY (1, 1) NOT NULL,
    [Title]       NVARCHAR (300) NOT NULL,
    [Notes]       NVARCHAR (1000) NULL,
    [DueDate]     DATE          NULL,
    [ListName]    NVARCHAR (100) NOT NULL CONSTRAINT [DF_Todos_ListName]    DEFAULT (N'General'),
    [Priority]    TINYINT       NOT NULL CONSTRAINT [DF_Todos_Priority]    DEFAULT (1),
    [IsCompleted] BIT           NOT NULL CONSTRAINT [DF_Todos_IsCompleted] DEFAULT (0),
    [CompletedAt] DATETIME2 (7) NULL,
    [CreatedAt]   DATETIME2 (7) NOT NULL CONSTRAINT [DF_Todos_CreatedAt]   DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT [PK_Todos] PRIMARY KEY CLUSTERED ([TodoId] ASC)
);
