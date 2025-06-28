-- =====================================================
-- 學生管理系統 - 完整資料庫建立腳本 (MS SQL Server)
-- 創建日期: 2025-01-28
-- 說明: 包含學生基本資料、家長資訊、學校資訊等完整欄位
-- =====================================================

-- 檢查並刪除已存在的觸發器
IF OBJECT_ID('tr_students_update_timestamp', 'TR') IS NOT NULL
    DROP TRIGGER tr_students_update_timestamp;

-- 檢查並刪除已存在的資料表
IF OBJECT_ID('students', 'U') IS NOT NULL
    DROP TABLE students;

GO

-- =====================================================
-- 創建學生資料表
-- =====================================================
CREATE TABLE students (
    -- 主鍵
    id INT IDENTITY(1,1) PRIMARY KEY,
    
    -- 學生基本資料
    chinese_name NVARCHAR(50) NOT NULL,        -- 學生中文姓名
    english_name NVARCHAR(100) NOT NULL,       -- 學生英文姓名
    student_phone NVARCHAR(20),                -- 學生手機號碼
    student_email NVARCHAR(100),               -- 學生電子信箱
    student_line NVARCHAR(50),                 -- 學生Line帳號
    
    -- 父親資訊
    father_name NVARCHAR(50),                  -- 父親姓名
    father_phone NVARCHAR(20),                 -- 父親手機號碼
    father_line NVARCHAR(50),                  -- 父親Line帳號
    
    -- 母親資訊
    mother_name NVARCHAR(50),                  -- 母親姓名
    mother_phone NVARCHAR(20),                 -- 母親手機號碼
    mother_line NVARCHAR(50),                  -- 母親Line帳號
    
    -- 學校資訊
    school NVARCHAR(50) NOT NULL,              -- 學校名稱
    grade NVARCHAR(10) NOT NULL,               -- 年級
    gender NVARCHAR(2) NOT NULL CHECK (gender IN (N'男', N'女')),  -- 性別
    level_type NVARCHAR(10) NOT NULL CHECK (level_type IN (N'初級', N'中級', N'進階')),  -- 程度
    class_type NVARCHAR(10) NOT NULL,          -- 班別
    
    -- 系統欄位
    created_at DATETIME2 DEFAULT GETDATE(),    -- 建立時間
    updated_at DATETIME2 DEFAULT GETDATE(),    -- 更新時間
    is_active BIT DEFAULT 1,                   -- 是否啟用 (1:啟用, 0:停用)
    
    -- 備註欄位
    notes NVARCHAR(500)                        -- 備註資訊
);

GO

-- =====================================================
-- 創建索引以提升查詢效能
-- =====================================================
CREATE INDEX IX_students_school ON students(school);
CREATE INDEX IX_students_grade ON students(grade);
CREATE INDEX IX_students_gender ON students(gender);
CREATE INDEX IX_students_level_type ON students(level_type);
CREATE INDEX IX_students_class_type ON students(class_type);
CREATE INDEX IX_students_chinese_name ON students(chinese_name);
CREATE INDEX IX_students_is_active ON students(is_active);

GO

-- =====================================================
-- 插入範例資料
-- =====================================================
INSERT INTO students (
    chinese_name, english_name, student_phone, student_email, student_line,
    father_name, father_phone, father_line,
    mother_name, mother_phone, mother_line,
    school, grade, gender, level_type, class_type, notes
) VALUES 
(N'王小明', N'Ming Wang', N'0912-345-678', N'ming@example.com', N'ming_wang',
 N'王大明', N'0911-111-111', N'wang_dad',
 N'李美麗', N'0922-222-222', N'lee_mom',
 N'建中', N'高三', N'男', N'進階', N'A班', N'數學成績優異'),

(N'李小華', N'Hua Lee', N'0923-456-789', N'hua@example.com', N'hua_lee',
 N'李大華', N'0933-333-333', N'lee_dad',
 N'陳美玉', N'0944-444-444', N'chen_mom',
 N'北一女', N'高二', N'女', N'中級', N'B班', N'英文口說需加強'),

(N'張小美', N'Mei Chang', N'0934-567-890', N'mei@example.com', N'mei_chang',
 N'張大偉', N'0955-555-555', N'chang_dad',
 N'劉淑芬', N'0966-666-666', N'liu_mom',
 N'師大附中', N'高一', N'女', N'初級', N'C班', N'剛轉學過來'),

(N'陳大雄', N'Hero Chen', N'0945-678-901', N'hero@example.com', N'hero_chen',
 N'陳志明', N'0977-777-777', N'chen_dad',
 N'黃麗華', N'0988-888-888', N'huang_mom',
 N'建中', N'高三', N'男', N'進階', N'A班', N'準備大學考試'),

(N'林小花', N'Flower Lin', N'0956-789-012', N'flower@example.com', N'flower_lin',
 N'林志強', N'0999-999-999', N'lin_dad',
 N'吳雅婷', N'0900-000-000', N'wu_mom',
 N'北一女', N'高二', N'女', N'中級', N'B班', N'物理需要補強'),

(N'黃小龍', N'Dragon Huang', N'0967-890-123', N'dragon@example.com', N'dragon_huang',
 N'黃建國', N'0911-222-333', N'huang_dad',
 N'蔡美惠', N'0922-333-444', N'tsai_mom',
 N'師大附中', N'高一', N'男', N'初級', N'C班', N'對程式設計有興趣'),

(N'吳小鳳', N'Phoenix Wu', N'0978-901-234', N'phoenix@example.com', N'phoenix_wu',
 N'吳志豪', N'0933-444-555', N'wu_dad',
 N'許雅芳', N'0944-555-666', N'hsu_mom',
 N'建中', N'高二', N'女', N'中級', N'B班', N'化學實驗能力強'),

(N'劉小虎', N'Tiger Liu', N'0989-012-345', N'tiger@example.com', N'tiger_liu',
 N'劉建宏', N'0955-666-777', N'liu_dad',
 N'張美慧', N'0966-777-888', N'chang_mom',
 N'北一女', N'高一', N'男', N'初級', N'C班', N'體育表現優秀');

GO

-- =====================================================
-- 創建更新時間的觸發器
-- =====================================================
CREATE TRIGGER tr_students_update_timestamp
ON students
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE students 
    SET updated_at = GETDATE()
    FROM students s
    INNER JOIN inserted i ON s.id = i.id;
END;

GO

-- =====================================================
-- 常用查詢範例
-- =====================================================

-- 1. 查詢所有啟用學生的基本資訊
SELECT 
    id,
    chinese_name AS '中文姓名',
    english_name AS '英文姓名',
    school AS '學校',
    grade AS '年級',
    gender AS '性別',
    level_type AS '程度',
    class_type AS '班別',
    created_at AS '建立時間'
FROM students 
WHERE is_active = 1
ORDER BY school, grade, class_type, chinese_name;

-- 2. 按學校統計學生人數
SELECT 
    school AS '學校',
    COUNT(*) AS '學生人數'
FROM students 
WHERE is_active = 1
GROUP BY school 
ORDER BY COUNT(*) DESC;

-- 3. 按年級和程度統計
SELECT 
    grade AS '年級',
    level_type AS '程度',
    COUNT(*) AS '學生人數'
FROM students 
WHERE is_active = 1
GROUP BY grade, level_type 
ORDER BY grade, level_type;

-- 4. 查詢特定條件的學生
SELECT 
    chinese_name AS '中文姓名',
    english_name AS '英文姓名',
    school AS '學校',
    grade AS '年級',
    student_phone AS '學生電話',
    student_email AS '學生信箱'
FROM students 
WHERE school = N'建中' 
  AND grade = N'高三' 
  AND level_type = N'進階'
  AND is_active = 1;

-- 5. 查詢學生及家長完整聯絡資訊
SELECT 
    chinese_name AS '學生中文姓名',
    english_name AS '學生英文姓名',
    student_phone AS '學生電話',
    student_email AS '學生信箱',
    student_line AS '學生Line',
    father_name AS '父親姓名',
    father_phone AS '父親電話',
    father_line AS '父親Line',
    mother_name AS '母親姓名',
    mother_phone AS '母親電話',
    mother_line AS '母親Line'
FROM students 
WHERE is_active = 1
ORDER BY chinese_name;

-- 6. 搜尋學生 (模糊搜尋)
SELECT 
    chinese_name AS '中文姓名',
    english_name AS '英文姓名',
    school AS '學校',
    grade AS '年級',
    student_phone AS '學生電話'
FROM students 
WHERE (chinese_name LIKE N'%王%' OR english_name LIKE N'%Wang%')
  AND is_active = 1;

-- 7. 查詢最近新增的學生
SELECT TOP 10
    chinese_name AS '中文姓名',
    english_name AS '英文姓名',
    school AS '學校',
    grade AS '年級',
    created_at AS '建立時間'
FROM students 
WHERE is_active = 1
ORDER BY created_at DESC;

-- 8. 查詢需要聯絡的家長資訊
SELECT 
    chinese_name AS '學生姓名',
    school AS '學校',
    grade AS '年級',
    COALESCE(father_name, N'無') AS '父親姓名',
    COALESCE(father_phone, N'無') AS '父親電話',
    COALESCE(mother_name, N'無') AS '母親姓名',
    COALESCE(mother_phone, N'無') AS '母親電話'
FROM students 
WHERE is_active = 1
  AND (father_phone IS NOT NULL OR mother_phone IS NOT NULL)
ORDER BY school, grade, chinese_name;

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
WHERE TABLE_NAME = 'students'
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
WHERE i.object_id = OBJECT_ID('students')
ORDER BY i.name, ic.key_ordinal;

PRINT '學生資料表建立完成！';
PRINT '已插入 8 筆範例資料';
PRINT '已建立 7 個效能索引';
PRINT '已建立自動更新時間戳觸發器'; 