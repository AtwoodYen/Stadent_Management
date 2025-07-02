-- =====================================================
-- 學校管理系統 - 完整資料庫建立腳本 (MS SQL Server)
-- 創建日期: 2025-01-28
-- 說明: 包含學校基本資料、聯絡資訊等完整欄位
-- =====================================================

-- 檢查並刪除已存在的觸發器
IF OBJECT_ID('tr_schools_update_timestamp', 'TR') IS NOT NULL
    DROP TRIGGER tr_schools_update_timestamp;

-- 檢查並刪除已存在的資料表
IF OBJECT_ID('schools', 'U') IS NOT NULL
    DROP TABLE schools;

GO

-- =====================================================
-- 創建學校資料表
-- =====================================================
CREATE TABLE schools (
    -- 主鍵
    id INT IDENTITY(1,1) PRIMARY KEY,
    
    -- 學校基本資料
    school_name NVARCHAR(100) NOT NULL,        -- 學校全名
    short_name NVARCHAR(20) NOT NULL,          -- 簡稱
    school_type NVARCHAR(10) NOT NULL CHECK (school_type IN (N'公立', N'國立', N'私立')),  -- 性質
    district NVARCHAR(20) NOT NULL,            -- 行政區
    education_level NVARCHAR(10) NOT NULL CHECK (education_level IN (N'國小', N'國中', N'高中', N'大學')),  -- 學制
    
    -- 聯絡資訊
    phone NVARCHAR(20),                        -- 學校電話
    address NVARCHAR(200),                     -- 學校地址
    website NVARCHAR(100),                     -- 學校網站
    email NVARCHAR(100),                       -- 學校信箱
    
    -- 統計資訊（自動計算）
    our_student_count INT DEFAULT 0,           -- 我們的學生數（會自動更新）
    
    -- 系統欄位
    created_at DATETIME2 DEFAULT GETDATE(),    -- 建立時間
    updated_at DATETIME2 DEFAULT GETDATE(),    -- 更新時間
    is_active BIT DEFAULT 1,                   -- 是否啟用 (1:啟用, 0:停用)
    
    -- 備註欄位
    notes NVARCHAR(500),                       -- 備註資訊
    
    -- 唯一約束
    CONSTRAINT UK_schools_name UNIQUE (school_name),
    CONSTRAINT UK_schools_short_name UNIQUE (short_name)
);

GO

-- =====================================================
-- 創建索引以提升查詢效能
-- =====================================================
CREATE INDEX IX_schools_type ON schools(school_type);
CREATE INDEX IX_schools_district ON schools(district);
CREATE INDEX IX_schools_education_level ON schools(education_level);
CREATE INDEX IX_schools_short_name ON schools(short_name);
CREATE INDEX IX_schools_is_active ON schools(is_active);
CREATE INDEX IX_schools_our_student_count ON schools(our_student_count);

GO

-- =====================================================
-- 創建更新時間的觸發器
-- =====================================================
CREATE TRIGGER tr_schools_update_timestamp
ON schools
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE schools 
    SET updated_at = GETDATE()
    FROM schools s
    INNER JOIN inserted i ON s.id = i.id;
END;

GO

-- =====================================================
-- 創建自動更新學生數的觸發器
-- =====================================================
IF OBJECT_ID('tr_update_school_student_count', 'TR') IS NOT NULL
    DROP TRIGGER tr_update_school_student_count;
GO

CREATE TRIGGER tr_update_school_student_count
ON students
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- 更新受影響學校的學生數
    UPDATE schools 
    SET our_student_count = (
        SELECT COUNT(*) 
        FROM students 
        WHERE students.school = schools.short_name 
          AND students.is_active = 1
    ),
    updated_at = GETDATE()
    WHERE schools.short_name IN (
        SELECT DISTINCT school FROM inserted
        UNION
        SELECT DISTINCT school FROM deleted
    );
END;
GO

-- =====================================================
-- 插入範例資料
-- =====================================================
INSERT INTO schools (
    school_name, short_name, school_type, district, education_level,
    phone, address, website, email, notes
) VALUES 
(N'國立建國高級中學', N'建中', N'國立', N'中正區', N'高中',
 N'02-2303-4381', N'台北市中正區南海路56號', N'https://www.ck.tp.edu.tw', N'ck@ck.tp.edu.tw', N'台北市第一志願男校'),

(N'台北市立第一女子高級中學', N'北一女', N'公立', N'中正區', N'高中',
 N'02-2382-0484', N'台北市中正區重慶南路一段165號', N'https://www.fg.tp.edu.tw', N'fg@fg.tp.edu.tw', N'台北市第一志願女校'),

(N'國立師範大學附屬高級中學', N'師大附中', N'國立', N'大安區', N'高中',
 N'02-2707-5215', N'台北市大安區信義路三段143號', N'https://www.hs.ntnu.edu.tw', N'hs@hs.ntnu.edu.tw', N'師範大學附屬中學'),

(N'台北市立成功高級中學', N'成功高中', N'公立', N'中正區', N'高中',
 N'02-2321-6256', N'台北市中正區濟南路一段71號', N'https://www.cksh.tp.edu.tw', N'cksh@cksh.tp.edu.tw', N'歷史悠久的男校'),

(N'台北市立中山女子高級中學', N'中山女高', N'公立', N'中山區', N'高中',
 N'02-2508-4050', N'台北市中山區長安東路二段141號', N'https://www.csghs.tp.edu.tw', N'csghs@csghs.tp.edu.tw', N'知名女子高中'),

(N'台北市立大同高級中學', N'大同高中', N'公立', N'中山區', N'高中',
 N'02-2505-4269', N'台北市中山區長春路167號', N'https://www.ttsh.tp.edu.tw', N'ttsh@ttsh.tp.edu.tw', N'完全中學'),

(N'台北市立松山高級中學', N'松山高中', N'公立', N'信義區', N'高中',
 N'02-2753-5968', N'台北市信義區基隆路一段156號', N'https://www.sssh.tp.edu.tw', N'sssh@sssh.tp.edu.tw', N'社區高中'),

(N'台北市立內湖高級中學', N'內湖高中', N'公立', N'內湖區', N'高中',
 N'02-2797-7035', N'台北市內湖區文德路218號', N'https://www.nhsh.tp.edu.tw', N'nhsh@nhsh.tp.edu.tw', N'內湖區指標學校');

GO

-- =====================================================
-- 手動更新學生數（初始化）
-- =====================================================
-- 根據現有學生資料更新學校的學生數
UPDATE schools 
SET our_student_count = (
    SELECT COUNT(*) 
    FROM students 
    WHERE students.school = schools.short_name 
      AND students.is_active = 1
),
updated_at = GETDATE();

GO

-- =====================================================
-- 常用查詢範例
-- =====================================================

-- 1. 查詢所有啟用學校的基本資訊
SELECT 
    id,
    school_name AS '學校全名',
    short_name AS '簡稱',
    school_type AS '性質',
    district AS '行政區',
    education_level AS '學制',
    our_student_count AS '我們的學生數',
    created_at AS '建立時間'
FROM schools 
WHERE is_active = 1
ORDER BY district, school_type, short_name;

-- 2. 按行政區統計學校數量
SELECT 
    district AS '行政區',
    COUNT(*) AS '學校數量',
    SUM(our_student_count) AS '總學生數'
FROM schools 
WHERE is_active = 1
GROUP BY district 
ORDER BY COUNT(*) DESC;

-- 3. 按學校性質統計
SELECT 
    school_type AS '學校性質',
    COUNT(*) AS '學校數量',
    SUM(our_student_count) AS '總學生數',
    AVG(CAST(our_student_count AS FLOAT)) AS '平均學生數'
FROM schools 
WHERE is_active = 1
GROUP BY school_type 
ORDER BY school_type;

-- 4. 查詢有學生的學校
SELECT 
    school_name AS '學校全名',
    short_name AS '簡稱',
    district AS '行政區',
    our_student_count AS '我們的學生數',
    phone AS '學校電話'
FROM schools 
WHERE our_student_count > 0 
  AND is_active = 1
ORDER BY our_student_count DESC;

-- 5. 查詢學校完整資訊
SELECT 
    school_name AS '學校全名',
    short_name AS '簡稱',
    school_type AS '性質',
    district AS '行政區',
    education_level AS '學制',
    phone AS '電話',
    address AS '地址',
    our_student_count AS '我們的學生數',
    notes AS '備註'
FROM schools 
WHERE is_active = 1
ORDER BY short_name;

-- 6. 搜尋學校 (模糊搜尋)
SELECT 
    school_name AS '學校全名',
    short_name AS '簡稱',
    district AS '行政區',
    our_student_count AS '我們的學生數'
FROM schools 
WHERE (school_name LIKE N'%建國%' OR short_name LIKE N'%建%')
  AND is_active = 1;

-- 7. 查詢最近新增的學校
SELECT TOP 10
    school_name AS '學校全名',
    short_name AS '簡稱',
    district AS '行政區',
    created_at AS '建立時間'
FROM schools 
WHERE is_active = 1
ORDER BY created_at DESC;

-- 8. 查詢需要關注的學校（學生數為0的學校）
SELECT 
    school_name AS '學校全名',
    short_name AS '簡稱',
    district AS '行政區',
    phone AS '電話',
    notes AS '備註'
FROM schools 
WHERE our_student_count = 0 
  AND is_active = 1
ORDER BY district, short_name;

-- =====================================================
-- 檢視資料表結構
-- =====================================================
SELECT 
    COLUMN_NAME AS '欄位名稱',
    DATA_TYPE AS '資料型態',
    CHARACTER_MAXIMUM_LENGTH AS '最大長度',
    IS_NULLABLE AS '允許空值',
    COLUMN_DEFAULT AS '預設值'
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'schools'
ORDER BY ORDINAL_POSITION;

-- =====================================================
-- 檢視索引資訊
-- =====================================================
SELECT 
    i.name AS '索引名稱',
    c.name AS '欄位名稱',
    i.type_desc AS '索引類型'
FROM sys.indexes i
INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE i.object_id = OBJECT_ID('schools')
ORDER BY i.name, ic.key_ordinal;

-- =====================================================
-- 資料維護用SQL範例
-- =====================================================

-- 新增學校
/*
INSERT INTO schools (school_name, short_name, school_type, district, education_level, phone, address, notes)
VALUES (N'新學校全名', N'新校', N'公立', N'行政區', N'高中', N'電話', N'地址', N'備註');
*/

-- 更新學校資訊
/*
UPDATE schools 
SET phone = N'新電話', 
    address = N'新地址',
    notes = N'更新備註',
    updated_at = GETDATE()
WHERE id = 1;
*/

-- 停用學校（軟刪除）
/*
UPDATE schools 
SET is_active = 0, 
    updated_at = GETDATE() 
WHERE id = 1;
*/

-- 重新啟用學校
/*
UPDATE schools 
SET is_active = 1, 
    updated_at = GETDATE() 
WHERE id = 1;
*/

-- 手動重新計算所有學校的學生數
/*
UPDATE schools 
SET our_student_count = (
    SELECT COUNT(*) 
    FROM students 
    WHERE students.school = schools.short_name 
      AND students.is_active = 1
),
updated_at = GETDATE()
WHERE is_active = 1;
*/

PRINT '學校資料表建立完成！';
PRINT '已插入 8 筆範例資料';
PRINT '已建立 6 個效能索引';
PRINT '已建立自動更新時間戳觸發器';
PRINT '已建立自動更新學生數觸發器'; 