-- =============================================
-- 學生上課時間表建立語法 (MS SQL Server)
-- =============================================

-- 方案1：創建獨立的學生上課時間表（推薦）
-- 優點：一個學生可以有多個上課時段，資料結構清晰

-- 如果表格已存在則刪除
IF OBJECT_ID('student_schedules', 'U') IS NOT NULL
    DROP TABLE student_schedules;

-- 創建學生上課時間表
CREATE TABLE student_schedules (
    id INT IDENTITY(1,1) PRIMARY KEY,
    student_id INT NOT NULL,
    day_of_week NVARCHAR(10) NOT NULL, -- 星期幾：週一、週二...週日
    start_time TIME NOT NULL, -- 開始時間：例如 14:00
    end_time TIME, -- 結束時間：例如 16:00（可選）
    course_name NVARCHAR(100), -- 課程名稱（可選）
    teacher_name NVARCHAR(50), -- 授課老師（可選）
    is_active BIT DEFAULT 1, -- 是否啟用此時段
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    
    -- 外鍵約束（假設已有 students 表）
    CONSTRAINT FK_student_schedules_student_id 
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    
    -- 約束條件
    CONSTRAINT CK_student_schedules_day_of_week 
        CHECK (day_of_week IN (N'週一', N'週二', N'週三', N'週四', N'週五', N'週六', N'週日')),
    
    CONSTRAINT CK_student_schedules_time_range
        CHECK (end_time IS NULL OR end_time > start_time)
);

-- =============================================
-- 方案2：在現有 students 表中增加欄位（簡單方案）
-- 適用於每個學生只有一個固定上課時間的情況
-- =============================================

-- 為 students 表增加上課時間欄位
-- ALTER TABLE students ADD 
--     class_day_of_week NVARCHAR(10), -- 上課星期幾
--     class_start_time TIME, -- 上課開始時間
--     class_end_time TIME, -- 上課結束時間
--     class_course_name NVARCHAR(100); -- 課程名稱

-- 增加約束條件
-- ALTER TABLE students ADD 
--     CONSTRAINT CK_students_class_day_of_week 
--         CHECK (class_day_of_week IN (N'週一', N'週二', N'週三', N'週四', N'週五', N'週六', N'週日')),
--     CONSTRAINT CK_students_class_time_range
--         CHECK (class_end_time IS NULL OR class_end_time > class_start_time);

-- =============================================
-- 創建索引以提升查詢效能
-- =============================================

-- 學生上課時間表索引
CREATE INDEX IX_student_schedules_student_id ON student_schedules(student_id);
CREATE INDEX IX_student_schedules_day_of_week ON student_schedules(day_of_week);
CREATE INDEX IX_student_schedules_start_time ON student_schedules(start_time);
CREATE INDEX IX_student_schedules_is_active ON student_schedules(is_active);
CREATE INDEX IX_student_schedules_day_time ON student_schedules(day_of_week, start_time);

-- =============================================
-- 創建更新時間觸發器
-- =============================================

CREATE TRIGGER TR_student_schedules_update_timestamp
ON student_schedules
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE student_schedules 
    SET updated_at = GETDATE()
    WHERE id IN (SELECT id FROM inserted);
END;

-- =============================================
-- 插入範例資料
-- =============================================

-- 假設學生 ID 1-8 已存在，插入上課時間安排
INSERT INTO student_schedules (student_id, day_of_week, start_time, end_time, course_name, teacher_name, is_active) VALUES
-- 學生1：週二下午 Python 課程
(1, N'週二', '14:00', '16:00', N'Python 基礎', N'小剛老師', 1),
(1, N'週四', '16:00', '18:00', N'Python 進階', N'小剛老師', 1),

-- 學生2：週三晚上 JavaScript 課程
(2, N'週三', '19:00', '21:00', N'JavaScript 入門', N'小美老師', 1),

-- 學生3：週六上午 Java 課程
(3, N'週六', '09:00', '12:00', N'Java 程式設計', N'王老師', 1),

-- 學生4：週一和週五下午 UI/UX 設計
(4, N'週一', '15:00', '17:00', N'UI/UX 設計', N'李老師', 1),
(4, N'週五', '15:00', '17:00', N'UI/UX 設計', N'李老師', 1),

-- 學生5：週日上午 C++ 課程
(5, N'週日', '10:00', '12:00', N'C++ 程式設計', N'陳老師', 1),

-- 學生6：週三和週六下午 資料科學
(6, N'週三', '14:00', '16:00', N'資料科學入門', N'阿明老師', 0), -- 已暫停
(6, N'週六', '14:00', '16:00', N'機器學習', N'阿明老師', 1),

-- 學生7：週二晚上 DevOps 課程
(7, N'週二', '19:00', '21:00', N'DevOps 實戰', N'張老師', 1),

-- 學生8：週四和週日 iOS 開發
(8, N'週四', '18:00', '20:00', N'iOS 開發基礎', N'林老師', 1),
(8, N'週日', '14:00', '16:00', N'Swift 進階', N'林老師', 1);

-- =============================================
-- 常用查詢語法範例
-- =============================================

-- 1. 查詢特定學生的所有上課時間
-- SELECT s.name, ss.day_of_week, ss.start_time, ss.end_time, ss.course_name, ss.teacher_name
-- FROM students s
-- INNER JOIN student_schedules ss ON s.id = ss.student_id
-- WHERE s.id = 1 AND ss.is_active = 1
-- ORDER BY 
--     CASE ss.day_of_week 
--         WHEN N'週一' THEN 1 WHEN N'週二' THEN 2 WHEN N'週三' THEN 3 
--         WHEN N'週四' THEN 4 WHEN N'週五' THEN 5 WHEN N'週六' THEN 6 
--         WHEN N'週日' THEN 7 END,
--     ss.start_time;

-- 2. 查詢特定時間有哪些學生上課
-- SELECT s.name, ss.course_name, ss.teacher_name, ss.start_time, ss.end_time
-- FROM students s
-- INNER JOIN student_schedules ss ON s.id = ss.student_id
-- WHERE ss.day_of_week = N'週二' 
--   AND ss.start_time >= '14:00' 
--   AND ss.start_time <= '18:00'
--   AND ss.is_active = 1
-- ORDER BY ss.start_time;

-- 3. 查詢特定老師的課表
-- SELECT s.name as student_name, ss.day_of_week, ss.start_time, ss.end_time, ss.course_name
-- FROM students s
-- INNER JOIN student_schedules ss ON s.id = ss.student_id
-- WHERE ss.teacher_name = N'小剛老師' AND ss.is_active = 1
-- ORDER BY 
--     CASE ss.day_of_week 
--         WHEN N'週一' THEN 1 WHEN N'週二' THEN 2 WHEN N'週三' THEN 3 
--         WHEN N'週四' THEN 4 WHEN N'週五' THEN 5 WHEN N'週六' THEN 6 
--         WHEN N'週日' THEN 7 END,
--     ss.start_time;

-- 4. 統計各時段的學生人數
-- SELECT day_of_week, start_time, COUNT(*) as student_count
-- FROM student_schedules
-- WHERE is_active = 1
-- GROUP BY day_of_week, start_time
-- ORDER BY 
--     CASE day_of_week 
--         WHEN N'週一' THEN 1 WHEN N'週二' THEN 2 WHEN N'週三' THEN 3 
--         WHEN N'週四' THEN 4 WHEN N'週五' THEN 5 WHEN N'週六' THEN 6 
--         WHEN N'週日' THEN 7 END,
--     start_time;

-- 5. 查詢時間衝突的學生（同一時間有多堂課）
-- SELECT student_id, day_of_week, start_time, COUNT(*) as conflict_count
-- FROM student_schedules
-- WHERE is_active = 1
-- GROUP BY student_id, day_of_week, start_time
-- HAVING COUNT(*) > 1;

-- 6. 查詢週末上課的學生
-- SELECT s.name, ss.day_of_week, ss.start_time, ss.course_name
-- FROM students s
-- INNER JOIN student_schedules ss ON s.id = ss.student_id
-- WHERE ss.day_of_week IN (N'週六', N'週日') AND ss.is_active = 1
-- ORDER BY ss.day_of_week, ss.start_time;

-- 7. 查詢特定課程的所有學生
-- SELECT s.name, ss.day_of_week, ss.start_time, ss.teacher_name
-- FROM students s
-- INNER JOIN student_schedules ss ON s.id = ss.student_id
-- WHERE ss.course_name LIKE N'%Python%' AND ss.is_active = 1
-- ORDER BY ss.day_of_week, ss.start_time;

-- 8. 查詢每個學生的總上課時數（每週）
-- SELECT s.name, 
--        COUNT(ss.id) as class_count,
--        SUM(DATEDIFF(MINUTE, ss.start_time, ISNULL(ss.end_time, ss.start_time))) / 60.0 as total_hours_per_week
-- FROM students s
-- INNER JOIN student_schedules ss ON s.id = ss.student_id
-- WHERE ss.is_active = 1
-- GROUP BY s.id, s.name
-- ORDER BY total_hours_per_week DESC;

PRINT N'學生上課時間表創建完成！';
PRINT N'已插入範例上課時間資料';
PRINT N'支援多時段、時間衝突檢查等功能';

-- =============================================
-- 額外功能：時間衝突檢查函數
-- =============================================

-- 創建檢查時間衝突的函數
CREATE FUNCTION fn_CheckScheduleConflict(@student_id INT, @day_of_week NVARCHAR(10), @start_time TIME, @end_time TIME)
RETURNS BIT
AS
BEGIN
    DECLARE @conflict_count INT;
    
    SELECT @conflict_count = COUNT(*)
    FROM student_schedules
    WHERE student_id = @student_id 
      AND day_of_week = @day_of_week
      AND is_active = 1
      AND (
          (@start_time >= start_time AND @start_time < ISNULL(end_time, start_time))
          OR 
          (@end_time > start_time AND @end_time <= ISNULL(end_time, start_time))
          OR
          (@start_time <= start_time AND @end_time >= ISNULL(end_time, start_time))
      );
    
    RETURN CASE WHEN @conflict_count > 0 THEN 1 ELSE 0 END;
END;

-- 使用範例：
-- SELECT dbo.fn_CheckScheduleConflict(1, N'週二', '15:00', '17:00') as has_conflict; 