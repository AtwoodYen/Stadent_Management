-- =============================================
-- 老師資料表建立語法 (MS SQL Server)
-- =============================================

-- 如果表格已存在則刪除
IF OBJECT_ID('teachers', 'U') IS NOT NULL
    DROP TABLE teachers;

-- 創建老師資料表
CREATE TABLE teachers (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(50) NOT NULL,
    email NVARCHAR(100) NOT NULL UNIQUE,
    phone NVARCHAR(20),
    specialties NVARCHAR(500), -- 以逗號分隔的專長領域
    available_days NVARCHAR(200), -- 以逗號分隔的可授課時間
    hourly_rate INT DEFAULT 1200, -- 時薪
    experience INT DEFAULT 0, -- 教學經驗年數
    bio NVARCHAR(1000), -- 個人簡介
    is_active BIT DEFAULT 1, -- 是否啟用
    avatar_url NVARCHAR(500), -- 頭像URL
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    
    -- 約束條件
    CONSTRAINT CK_teachers_hourly_rate CHECK (hourly_rate >= 0),
    CONSTRAINT CK_teachers_experience CHECK (experience >= 0),
    CONSTRAINT CK_teachers_email_format CHECK (email LIKE '%@%.%')
);

-- 創建老師課程能力表
IF OBJECT_ID('teacher_courses', 'U') IS NOT NULL
    DROP TABLE teacher_courses;

CREATE TABLE teacher_courses (
    id INT IDENTITY(1,1) PRIMARY KEY,
    teacher_id INT NOT NULL,
    course_category NVARCHAR(100) NOT NULL,
    max_level NVARCHAR(20) NOT NULL, -- 初級、中級、高級
    is_preferred BIT DEFAULT 0, -- 是否為主力課程
    created_at DATETIME2 DEFAULT GETDATE(),
    
    -- 外鍵約束
    CONSTRAINT FK_teacher_courses_teacher_id 
        FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    
    -- 約束條件
    CONSTRAINT CK_teacher_courses_max_level 
        CHECK (max_level IN (N'初級', N'中級', N'高級')),
    
    -- 唯一約束（一個老師的同一課程類別只能有一筆記錄）
    CONSTRAINT UK_teacher_courses_teacher_category 
        UNIQUE (teacher_id, course_category)
);

-- =============================================
-- 創建索引以提升查詢效能
-- =============================================

-- 老師表索引
CREATE INDEX IX_teachers_name ON teachers(name);
CREATE INDEX IX_teachers_email ON teachers(email);
CREATE INDEX IX_teachers_is_active ON teachers(is_active);
CREATE INDEX IX_teachers_hourly_rate ON teachers(hourly_rate);
CREATE INDEX IX_teachers_experience ON teachers(experience);
CREATE INDEX IX_teachers_created_at ON teachers(created_at);

-- 老師課程表索引
CREATE INDEX IX_teacher_courses_teacher_id ON teacher_courses(teacher_id);
CREATE INDEX IX_teacher_courses_category ON teacher_courses(course_category);
CREATE INDEX IX_teacher_courses_preferred ON teacher_courses(is_preferred);

-- =============================================
-- 創建更新時間觸發器
-- =============================================

-- 老師表更新時間觸發器
CREATE TRIGGER TR_teachers_update_timestamp
ON teachers
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE teachers 
    SET updated_at = GETDATE()
    WHERE id IN (SELECT id FROM inserted);
END;

-- =============================================
-- 插入範例資料
-- =============================================

-- 插入老師基本資料
INSERT INTO teachers (name, email, phone, specialties, available_days, hourly_rate, experience, bio, is_active) VALUES
(N'小剛老師', 'gang@example.com', '0912-345-678', N'Python,Web開發,演算法', N'週一,週二,週三,週四,週五', 1500, 5, N'資深軟體工程師，專精於 Python 和 Web 開發，有豐富的教學經驗。', 1),
(N'小美老師', 'mei@example.com', '0923-456-789', N'JavaScript,React,Node.js', N'週二,週四,週六,週日', 1400, 3, N'前端開發專家，熟悉現代 JavaScript 框架，善於引導學生理解複雜概念。', 1),
(N'阿明老師', 'ming@example.com', '0934-567-890', N'資料科學,機器學習,Python', N'週三,週五,週六', 1800, 7, N'資料科學博士，在機器學習領域有深厚造詣，教學風格嚴謹細緻。', 0),
(N'王老師', 'wang@example.com', '0945-678-901', N'Java,Spring Boot,資料庫設計', N'週一,週三,週五,週日', 1600, 6, N'後端開發專家，專精於 Java 企業級應用開發，有豐富的系統架構經驗。', 1),
(N'李老師', 'li@example.com', '0956-789-012', N'UI/UX設計,Figma,Adobe Creative Suite', N'週二,週四,週六', 1300, 4, N'視覺設計師，擅長使用者體驗設計，能夠將複雜的設計概念簡化教學。', 1),
(N'陳老師', 'chen@example.com', '0967-890-123', N'C++,遊戲開發,Unity', N'週一,週二,週五,週六', 1700, 8, N'遊戲開發資深工程師，專精於 C++ 和 Unity 引擎，教學風格生動有趣。', 1),
(N'張老師', 'zhang@example.com', '0978-901-234', N'DevOps,Docker,Kubernetes,AWS', N'週三,週四,週日', 2000, 9, N'DevOps 專家，在雲端部署和容器化技術方面有豐富經驗，注重實戰教學。', 1),
(N'林老師', 'lin@example.com', '0989-012-345', N'iOS開發,Swift,SwiftUI', N'週一,週四,週六,週日', 1550, 5, N'iOS 開發專家，熟悉 Swift 和 SwiftUI，曾參與多個上架 App 的開發。', 1);

-- 插入老師課程能力資料
INSERT INTO teacher_courses (teacher_id, course_category, max_level, is_preferred) VALUES
-- 小剛老師的課程能力
(1, N'Python', N'高級', 1),
(1, N'Web開發', N'中級', 1),
(1, N'演算法', N'中級', 0),

-- 小美老師的課程能力
(2, N'JavaScript', N'高級', 1),
(2, N'Web開發', N'高級', 1),

-- 阿明老師的課程能力
(3, N'資料科學', N'高級', 1),
(3, N'機器學習', N'高級', 1),

-- 王老師的課程能力
(4, N'Java', N'高級', 1),
(4, N'資料庫設計', N'高級', 1),
(4, N'Web開發', N'中級', 0),

-- 李老師的課程能力
(5, N'UI/UX設計', N'高級', 1),
(5, N'平面設計', N'中級', 0),

-- 陳老師的課程能力
(6, N'C++', N'高級', 1),
(6, N'遊戲開發', N'高級', 1),
(6, N'演算法', N'中級', 0),

-- 張老師的課程能力
(7, N'DevOps', N'高級', 1),
(7, N'雲端技術', N'高級', 1),
(7, N'Linux', N'中級', 0),

-- 林老師的課程能力
(8, N'iOS開發', N'高級', 1),
(8, N'Swift', N'高級', 1),
(8, N'移動應用開發', N'中級', 0);

-- =============================================
-- 常用查詢語法範例
-- =============================================

-- 1. 查詢所有啟用的老師
-- SELECT * FROM teachers WHERE is_active = 1 ORDER BY name;

-- 2. 查詢特定專長的老師
-- SELECT * FROM teachers WHERE specialties LIKE N'%Python%' AND is_active = 1;

-- 3. 查詢時薪範圍內的老師
-- SELECT * FROM teachers WHERE hourly_rate BETWEEN 1400 AND 1800 AND is_active = 1;

-- 4. 查詢老師及其課程能力
-- SELECT t.name, t.email, tc.course_category, tc.max_level, tc.is_preferred
-- FROM teachers t
-- LEFT JOIN teacher_courses tc ON t.id = tc.teacher_id
-- WHERE t.is_active = 1
-- ORDER BY t.name, tc.course_category;

-- 5. 查詢主力課程為特定類別的老師
-- SELECT t.name, t.email, t.hourly_rate
-- FROM teachers t
-- INNER JOIN teacher_courses tc ON t.id = tc.teacher_id
-- WHERE tc.course_category = N'Python' AND tc.is_preferred = 1 AND t.is_active = 1;

-- 6. 統計各課程類別的老師數量
-- SELECT course_category, COUNT(*) as teacher_count
-- FROM teacher_courses tc
-- INNER JOIN teachers t ON tc.teacher_id = t.id
-- WHERE t.is_active = 1
-- GROUP BY course_category
-- ORDER BY teacher_count DESC;

-- 7. 查詢經驗豐富的老師（5年以上）
-- SELECT name, email, experience, hourly_rate
-- FROM teachers
-- WHERE experience >= 5 AND is_active = 1
-- ORDER BY experience DESC;

-- 8. 查詢可在週末授課的老師
-- SELECT name, email, available_days
-- FROM teachers
-- WHERE (available_days LIKE N'%週六%' OR available_days LIKE N'%週日%')
-- AND is_active = 1
-- ORDER BY name;

PRINT N'老師資料表創建完成！';
PRINT N'已插入 8 位老師的範例資料';
PRINT N'已建立相關索引和觸發器'; 