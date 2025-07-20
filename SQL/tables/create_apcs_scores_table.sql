-- =====================================================
-- 建立臺灣APCS成績記錄表
-- 創建日期: 2025-01-28
-- 說明: 記錄學生參加臺灣APCS考試的成績
-- =====================================================

-- 建立APCS成績記錄表
CREATE TABLE apcs_scores (
    id INT IDENTITY(1,1) PRIMARY KEY,
    student_id INT NOT NULL,
    exam_year INT NOT NULL,                    -- 考試年份
    exam_month INT NOT NULL,                   -- 考試月份 (1,3,6,7,10,11)
    reading_score INT,                         -- 程式識讀分數 (0-100)
    reading_level INT,                         -- 程式識讀級數 (1-5)
    programming_level VARCHAR(20),             -- 程式實作報名等級 (初級、中級、中高級、高級)
    programming_score INT,                     -- 程式實作分數 (0-300)
    programming_level_achieved INT,            -- 程式實作獲得級數 (1-5)
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    is_active BIT DEFAULT 1,
    
    -- 外鍵約束
    CONSTRAINT FK_apcs_scores_student_id 
        FOREIGN KEY (student_id) REFERENCES students(id),
    
    -- 檢查約束
    CONSTRAINT CK_apcs_scores_exam_month 
        CHECK (exam_month IN (1, 3, 6, 7, 10, 11)),
    CONSTRAINT CK_apcs_scores_reading_score 
        CHECK (reading_score >= 0 AND reading_score <= 100),
    CONSTRAINT CK_apcs_scores_reading_level 
        CHECK (reading_level >= 1 AND reading_level <= 5),
    CONSTRAINT CK_apcs_scores_programming_level 
        CHECK (programming_level IN ('初級', '中級', '中高級', '高級')),
    CONSTRAINT CK_apcs_scores_programming_score 
        CHECK (programming_score >= 0 AND programming_score <= 300),
    CONSTRAINT CK_apcs_scores_programming_level_achieved 
        CHECK (programming_level_achieved >= 1 AND programming_level_achieved <= 5),
    
    -- 唯一約束：同一學生同一年同一月份只能有一筆記錄
    CONSTRAINT UQ_apcs_scores_student_year_month 
        UNIQUE (student_id, exam_year, exam_month)
);

-- 建立索引
CREATE INDEX IX_apcs_scores_student_id ON apcs_scores(student_id);
CREATE INDEX IX_apcs_scores_exam_year ON apcs_scores(exam_year);
CREATE INDEX IX_apcs_scores_exam_month ON apcs_scores(exam_month);
CREATE INDEX IX_apcs_scores_active ON apcs_scores(is_active);

PRINT 'APCS成績記錄表建立完成';

GO

-- 建立觸發器更新 updated_at
CREATE TRIGGER TR_apcs_scores_update_timestamp
ON apcs_scores
AFTER UPDATE
AS
BEGIN
    UPDATE apcs_scores 
    SET updated_at = GETDATE()
    FROM apcs_scores a
    INNER JOIN inserted i ON a.id = i.id;
END;

PRINT 'APCS成績記錄表觸發器建立完成'; 