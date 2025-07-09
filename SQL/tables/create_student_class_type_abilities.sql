-- =====================================================
-- 學生 class_type 能力資料表建立腳本
-- 適用於 MS SQL Server
-- 創建日期：2025-01-28
-- 說明：記錄學生在各個 class_type 領域的能力程度
-- =====================================================

-- 1. 創建學生 class_type 能力資料表
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[student_class_type_abilities]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[student_class_type_abilities] (
        [id] INT PRIMARY KEY IDENTITY(1,1),
        [student_id] INT NOT NULL,
        [class_type] NVARCHAR(50) NOT NULL,  -- 對應 class_types 表的 class_code
        [ability_level] NVARCHAR(10) NOT NULL,  -- 學生在該領域的能力程度：[新手][入門][中階][高階][大師]
        [assessment_date] DATE NOT NULL DEFAULT GETDATE(),  -- 評估日期
        [assessor_id] INT,  -- 評估者ID（老師或管理員）
        [notes] NVARCHAR(500),  -- 評估備註
        [is_active] BIT NOT NULL DEFAULT 1,
        [created_at] DATETIME2 NOT NULL DEFAULT GETDATE(),
        [updated_at] DATETIME2 NOT NULL DEFAULT GETDATE(),
        
        -- 外鍵約束
        CONSTRAINT [FK_student_class_type_abilities_student_id] FOREIGN KEY ([student_id])
            REFERENCES [dbo].[students] ([id])
            ON DELETE CASCADE,
            
        -- 檢查約束
        CONSTRAINT [CHK_student_class_type_abilities_level] CHECK ([ability_level] IN (N'新手', N'入門', N'中階', N'高階', N'大師')),
        
        -- 唯一約束：每個學生每個 class_type 只能有一筆記錄
        CONSTRAINT [UQ_student_class_type_abilities] UNIQUE ([student_id], [class_type])
    );

    -- 建立索引
    CREATE NONCLUSTERED INDEX [IX_student_class_type_abilities_student_id] ON [dbo].[student_class_type_abilities] ([student_id]);
    CREATE NONCLUSTERED INDEX [IX_student_class_type_abilities_class_type] ON [dbo].[student_class_type_abilities] ([class_type]);
    CREATE NONCLUSTERED INDEX [IX_student_class_type_abilities_level] ON [dbo].[student_class_type_abilities] ([ability_level]);
    CREATE NONCLUSTERED INDEX [IX_student_class_type_abilities_active] ON [dbo].[student_class_type_abilities] ([is_active]);

    PRINT N'已建立 student_class_type_abilities 資料表';
END
ELSE
BEGIN
    PRINT N'student_class_type_abilities 資料表已存在';
END

GO

-- 2. 創建更新時間觸發器
IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_student_class_type_abilities_update_timestamp')
BEGIN
    EXEC('
    CREATE TRIGGER [dbo].[TR_student_class_type_abilities_update_timestamp]
    ON [dbo].[student_class_type_abilities]
    AFTER UPDATE
    AS
    BEGIN
        UPDATE [dbo].[student_class_type_abilities]
        SET [updated_at] = GETDATE()
        FROM [dbo].[student_class_type_abilities] sca
        INNER JOIN inserted i ON sca.id = i.id;
    END
    ');
    PRINT N'已建立 student_class_type_abilities 更新時間觸發器';
END
ELSE
BEGIN
    PRINT N'student_class_type_abilities 更新時間觸發器已存在';
END

GO

-- 3. 插入範例資料
PRINT N'插入範例資料...';

-- 檢查是否有學生和 class_types 資料
IF EXISTS (SELECT 1 FROM students WHERE is_active = 1) AND EXISTS (SELECT 1 FROM class_types WHERE is_active = 1)
BEGIN
    -- 為前5個學生插入範例能力資料
    INSERT INTO student_class_type_abilities (student_id, class_type, ability_level, assessment_date, notes)
    SELECT 
        s.id,
        ct.class_code,
        CASE 
            WHEN ROW_NUMBER() OVER (PARTITION BY s.id ORDER BY ct.id) = 1 THEN N'新手'
            WHEN ROW_NUMBER() OVER (PARTITION BY s.id ORDER BY ct.id) = 2 THEN N'入門'
            WHEN ROW_NUMBER() OVER (PARTITION BY s.id ORDER BY ct.id) = 3 THEN N'中階'
            WHEN ROW_NUMBER() OVER (PARTITION BY s.id ORDER BY ct.id) = 4 THEN N'高階'
            ELSE N'大師'
        END as ability_level,
        DATEADD(day, -RAND(CHECKSUM(NEWID())) * 30, GETDATE()) as assessment_date,
        N'系統自動生成的範例資料' as notes
    FROM students s
    CROSS JOIN class_types ct
    WHERE s.is_active = 1 
    AND ct.is_active = 1
    AND s.id <= 5  -- 只為前5個學生生成資料
    AND NOT EXISTS (
        SELECT 1 FROM student_class_type_abilities sca 
        WHERE sca.student_id = s.id AND sca.class_type = ct.class_code
    );
    
    PRINT N'已插入範例資料';
END
ELSE
BEGIN
    PRINT N'沒有足夠的學生或 class_types 資料，跳過範例資料插入';
END

GO

-- 4. 建立查詢視圖
CREATE OR ALTER VIEW [dbo].[view_student_class_type_abilities] AS
SELECT 
    sca.[id],
    s.[chinese_name] as [學生姓名],
    s.[english_name] as [學生英文姓名],
    ct.[class_name] as [領域名稱],
    ct.[class_code] as [領域代碼],
    sca.[ability_level] as [能力程度],
    sca.[assessment_date] as [評估日期],
    sca.[notes] as [評估備註],
    CASE sca.[is_active] WHEN 1 THEN N'啟用' ELSE N'停用' END as [狀態],
    sca.[created_at] as [建立時間],
    sca.[updated_at] as [更新時間]
FROM [dbo].[student_class_type_abilities] sca
INNER JOIN [dbo].[students] s ON sca.[student_id] = s.[id]
INNER JOIN [dbo].[class_types] ct ON sca.[class_type] = ct.[class_code]
WHERE sca.[is_active] = 1 AND s.[is_active] = 1 AND ct.[is_active] = 1;

GO

-- 5. 建立統計視圖
CREATE OR ALTER VIEW [dbo].[view_student_abilities_summary] AS
SELECT 
    s.[id] as [學生ID],
    s.[chinese_name] as [學生姓名],
    s.[english_name] as [學生英文姓名],
    COUNT(sca.[id]) as [已評估領域數],
    STRING_AGG(ct.[class_name] + '(' + sca.[ability_level] + ')', ', ') as [能力概況],
    MAX(sca.[assessment_date]) as [最後評估日期]
FROM [dbo].[students] s
LEFT JOIN [dbo].[student_class_type_abilities] sca ON s.[id] = sca.[student_id] AND sca.[is_active] = 1
LEFT JOIN [dbo].[class_types] ct ON sca.[class_type] = ct.[class_code] AND ct.[is_active] = 1
WHERE s.[is_active] = 1
GROUP BY s.[id], s.[chinese_name], s.[english_name];

GO

PRINT N'=== student_class_type_abilities 資料表建立完成 ===';
PRINT N'1. 資料表：student_class_type_abilities';
PRINT N'2. 視圖：view_student_class_type_abilities';
PRINT N'3. 視圖：view_student_abilities_summary';
PRINT N'4. 能力程度：[新手][入門][中階][高階][大師]';
PRINT N'5. 唯一約束：每個學生每個 class_type 只能有一筆記錄'; 