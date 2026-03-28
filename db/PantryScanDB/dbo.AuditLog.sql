CREATE TABLE [dbo].[AuditLog] (
    [AuditId]          INT            IDENTITY(1,1) NOT NULL,
    [IdempotencyKey]   NVARCHAR(64)   NULL,
    [ActionId]         NVARCHAR(64)   NULL,
    [Actor]            NVARCHAR(100)  NULL,
    [Source]           NVARCHAR(100)  NULL,
    [Method]           NVARCHAR(10)   NOT NULL,
    [Endpoint]         NVARCHAR(200)  NOT NULL,
    [RequestBody]      NVARCHAR(MAX)  NULL,
    [StatusCode]       INT            NOT NULL,
    [Outcome]          NVARCHAR(20)   NOT NULL,
    [RequestedAtUtc]   DATETIME2      NULL,
    [CreatedAt]        DATETIME2      NOT NULL CONSTRAINT [DF_AuditLog_CreatedAt] DEFAULT (GETUTCDATE()),
    CONSTRAINT [PK_AuditLog] PRIMARY KEY CLUSTERED ([AuditId] ASC)
);
GO
CREATE UNIQUE INDEX [UX_AuditLog_IdempotencyKey]
    ON [dbo].[AuditLog]([IdempotencyKey])
    WHERE [IdempotencyKey] IS NOT NULL;
GO
