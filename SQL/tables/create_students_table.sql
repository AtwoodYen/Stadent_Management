-- =====================================================
-- 學生管理系統 - 簡化版資料表建立腳本 (MS SQL Server)
-- 創建日期: 2025-01-28
-- 說明: 包含基本學生資料結構和範例資料
-- =====================================================

-- 檢查並刪除已存在的資料表
IF OBJECT_ID('students', 'U') IS NOT NULL
    DROP TABLE students;

GO

-- 創建學生資料表
CREATE TABLE students (
    id INT IDENTITY(1,1) PRIMARY KEY,
    chinese_name NVARCHAR(50) NOT NULL,        -- 學生中文姓名
    english_name NVARCHAR(100) NOT NULL,       -- 學生英文姓名
    student_phone NVARCHAR(20),                -- 學生手機號碼
    student_email NVARCHAR(100),               -- 學生電子信箱
    student_line NVARCHAR(50),                 -- 學生Line帳號
    father_name NVARCHAR(50),                  -- 父親姓名
    father_phone NVARCHAR(20),                 -- 父親手機號碼
    father_line NVARCHAR(50),                  -- 父親Line帳號
    mother_name NVARCHAR(50),                  -- 母親姓名
    mother_phone NVARCHAR(20),                 -- 母親手機號碼
    mother_line NVARCHAR(50),                  -- 母親Line帳號
    school NVARCHAR(50) NOT NULL,              -- 學校名稱
    grade NVARCHAR(10) NOT NULL,               -- 年級
    gender NVARCHAR(2) NOT NULL CHECK (gender IN (N'男', N'女')),  -- 性別
    level_type NVARCHAR(10) NOT NULL CHECK (level_type IN (N'初級', N'中級', N'進階')),  -- 程度
    class_type NVARCHAR(10) NOT NULL,          -- 班別
    created_at DATETIME2 DEFAULT GETDATE(),    -- 建立時間
    updated_at DATETIME2 DEFAULT GETDATE()     -- 更新時間
);

GO

-- 創建索引以提升查詢效能
CREATE INDEX IX_students_school ON students(school);
CREATE INDEX IX_students_grade ON students(grade);
CREATE INDEX IX_students_gender ON students(gender);
CREATE INDEX IX_students_level_type ON students(level_type);
CREATE INDEX IX_students_class_type ON students(class_type);
CREATE INDEX IX_students_chinese_name ON students(chinese_name);

GO

-- 插入範例資料
INSERT INTO students (
    chinese_name, english_name, student_phone, student_email, student_line,
    father_name, father_phone, father_line,
    mother_name, mother_phone, mother_line,
    school, grade, gender, level_type, class_type
) VALUES 
(N'王小明', N'Ming Wang', N'0912-345-678', N'ming@example.com', N'ming_wang',
 N'王大明', N'0911-111-111', N'wang_dad',
 N'李美麗', N'0922-222-222', N'lee_mom',
 N'建中', N'高三', N'男', N'進階', N'A班'),

(N'李小華', N'Hua Lee', N'0923-456-789', N'hua@example.com', N'hua_lee',
 N'李大華', N'0933-333-333', N'lee_dad',
 N'陳美玉', N'0944-444-444', N'chen_mom',
 N'北一女', N'高二', N'女', N'中級', N'B班'),

(N'張小美', N'Mei Chang', N'0934-567-890', N'mei@example.com', N'mei_chang',
 N'張大偉', N'0955-555-555', N'chang_dad',
 N'劉淑芬', N'0966-666-666', N'liu_mom',
 N'師大附中', N'高一', N'女', N'初級', N'C班'),

(N'陳大雄', N'Hero Chen', N'0945-678-901', N'hero@example.com', N'hero_chen',
 N'陳志明', N'0977-777-777', N'chen_dad',
 N'黃麗華', N'0988-888-888', N'huang_mom',
 N'建中', N'高三', N'男', N'進階', N'A班'),

(N'林小花', N'Flower Lin', N'0956-789-012', N'flower@example.com', N'flower_lin',
 N'林志強', N'0999-999-999', N'lin_dad',
 N'吳雅婷', N'0900-000-000', N'wu_mom',
 N'北一女', N'高二', N'女', N'中級', N'B班'),

(N'黃小龍', N'Dragon Huang', N'0967-890-123', N'dragon@example.com', N'dragon_huang',
 N'黃建國', N'0911-222-333', N'huang_dad',
 N'蔡美惠', N'0922-333-444', N'tsai_mom',
 N'師大附中', N'高一', N'男', N'初級', N'C班'),

(N'吳小鳳', N'Phoenix Wu', N'0978-901-234', N'phoenix@example.com', N'phoenix_wu',
 N'吳志豪', N'0933-444-555', N'wu_dad',
 N'許雅芳', N'0944-555-666', N'hsu_mom',
 N'建中', N'高二', N'女', N'中級', N'B班'),

(N'劉小虎', N'Tiger Liu', N'0989-012-345', N'tiger@example.com', N'tiger_liu',
 N'劉建宏', N'0955-666-777', N'liu_dad',
 N'張美慧', N'0966-777-888', N'chang_mom',
 N'北一女', N'高一', N'男', N'初級', N'C班');

GO

-- 創建更新時間的觸發器
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

-- 1. 查詢所有學生基本資訊
SELECT 
    chinese_name AS '中文姓名', 
    english_name AS '英文姓名', 
    school AS '學校', 
    grade AS '年級', 
    gender AS '性別', 
    level_type AS '程度', 
    class_type AS '班別'
FROM students 
ORDER BY school, grade, class_type, chinese_name;

-- 2. 按學校統計學生人數
SELECT 
    school AS '學校', 
    COUNT(*) AS '學生人數'
FROM students 
GROUP BY school 
ORDER BY COUNT(*) DESC;

-- 3. 按年級和程度統計
SELECT 
    grade AS '年級', 
    level_type AS '程度', 
    COUNT(*) AS '學生人數'
FROM students 
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
  AND level_type = N'進階';

-- 5. 查詢學生及家長聯絡資訊
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
WHERE id = 1;

PRINT '學生資料表建立完成！';
PRINT '已插入 8 筆範例資料';
PRINT '已建立 6 個效能索引';
PRINT '已建立自動更新時間戳觸發器'; 