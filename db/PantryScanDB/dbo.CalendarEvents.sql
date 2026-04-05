CREATE TABLE [dbo].[CalendarEvents]
(
    [EventId]     INT           IDENTITY (1, 1) NOT NULL,
    [Title]       NVARCHAR (200) NOT NULL,
    [StartDate]   DATETIME2 (7) NOT NULL,
    [EndDate]     DATETIME2 (7) NULL,
    [AllDay]      BIT           NOT NULL CONSTRAINT [DF_CalendarEvents_AllDay]     DEFAULT (0),
    [Description] NVARCHAR (1000) NULL,
    [Category]    NVARCHAR (50) NULL,
    [Color]       NVARCHAR (20) NULL,
    [CreatedAt]   DATETIME2 (7) NOT NULL CONSTRAINT [DF_CalendarEvents_CreatedAt] DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT [PK_CalendarEvents] PRIMARY KEY CLUSTERED ([EventId] ASC)
);
