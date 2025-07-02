-- 確保 teacher_courses 表格存在
-- 如果不存在則建立，如果存在則跳過

USE students_management;

-- 檢查表格是否存在
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[teacher_courses]') AND type in (N'U'))
BEGIN
    -- 建立 teacher_courses 表格
    CREATE TABLE [dbo].[teacher_courses] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [teacher_id] INT NOT NULL,
        [course_category] NVARCHAR(100) NOT NULL,
        [max_level] NVARCHAR(10) NOT NULL,
        [is_preferred] BIT NOT NULL DEFAULT 0,
        [created_at] DATETIME2 DEFAULT GETDATE(),
        [updated_at] DATETIME2 DEFAULT GETDATE(),
        
        -- 外鍵約束
        CONSTRAINT [FK_teacher_courses_teacher_id] FOREIGN KEY ([teacher_id])
            REFERENCES [dbo].[teachers] ([id])
            ON DELETE CASCADE,
            
        -- 檢查約束
        CONSTRAINT [CHK_teacher_courses_max_level] CHECK ([max_level] IN (N'初級', N'中級', N'高級')),
        
        -- 唯一約束：每個師資每個課程分類只能有一筆記錄
        CONSTRAINT [UQ_teacher_courses] UNIQUE ([teacher_id], [course_category])
    );

    -- 建立索引
    CREATE NONCLUSTERED INDEX [IX_teacher_courses_teacher_id] ON [dbo].[teacher_courses] ([teacher_id]);
    CREATE NONCLUSTERED INDEX [IX_teacher_courses_category] ON [dbo].[teacher_courses] ([course_category]);
    CREATE NONCLUSTERED INDEX [IX_teacher_courses_preferred] ON [dbo].[teacher_courses] ([is_preferred]);

    PRINT N'已成功建立 teacher_courses 資料表';
END
ELSE
BEGIN
    PRINT N'teacher_courses 資料表已存在，跳過建立';
END

-- 檢查表格是否建立成功
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'teacher_courses'
ORDER BY ORDINAL_POSITION;

-- 顯示目前的資料數量
SELECT COUNT(*) as 'teacher_courses 資料筆數' FROM teacher_courses;

PRINT N'teacher_courses 表格狀態檢查完成'; 