-- =====================================================
-- 為 teachers 表添加 is_deleted 欄位 (PostgreSQL 版本)
-- 用於區分啟用/停用狀態和軟刪除狀態
-- =====================================================

-- 1. 添加 is_deleted 欄位
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'teachers' AND column_name = 'is_deleted'
    ) THEN
        ALTER TABLE teachers ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
        RAISE NOTICE '已添加 is_deleted 欄位到 teachers 表';
    ELSE
        RAISE NOTICE 'is_deleted 欄位已存在';
    END IF;
END $$;

-- 2. 為 is_deleted 欄位添加索引
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'teachers' AND indexname = 'ix_teachers_is_deleted'
    ) THEN
        CREATE INDEX ix_teachers_is_deleted ON teachers(is_deleted);
        RAISE NOTICE '已為 is_deleted 欄位添加索引';
    ELSE
        RAISE NOTICE 'is_deleted 欄位的索引已存在';
    END IF;
END $$;

-- 3. 更新查詢視圖以包含 is_deleted 欄位
DROP VIEW IF EXISTS view_teachers_summary;

CREATE VIEW view_teachers_summary AS
SELECT 
    t.id,
    t.name,
    t.email,
    t.phone,
    t.specialties,
    t.available_days,
    t.hourly_rate,
    t.experience,
    t.bio,
    t.is_active,
    t.is_deleted,
    CASE 
        WHEN t.is_deleted = TRUE THEN '已刪除'
        WHEN t.is_active = TRUE THEN '啟用'
        ELSE '停用'
    END as status_name,
    t.created_at,
    t.updated_at,
    -- 統計課程數量（只計算未刪除的師資）
    CASE 
        WHEN t.is_deleted = TRUE THEN 0
        ELSE (SELECT COUNT(*) FROM teacher_courses tc WHERE tc.teacher_id = t.id)
    END as total_courses,
    CASE 
        WHEN t.is_deleted = TRUE THEN 0
        ELSE (SELECT COUNT(*) FROM teacher_courses tc WHERE tc.teacher_id = t.id AND tc.is_preferred = TRUE)
    END as preferred_courses
FROM teachers t;

-- 4. 顯示更新結果
SELECT 
    'teachers' as table_name,
    COUNT(*) as total_records,
    SUM(CASE WHEN is_active = TRUE AND is_deleted = FALSE THEN 1 ELSE 0 END) as active_records,
    SUM(CASE WHEN is_active = FALSE AND is_deleted = FALSE THEN 1 ELSE 0 END) as inactive_records,
    SUM(CASE WHEN is_deleted = TRUE THEN 1 ELSE 0 END) as deleted_records
FROM teachers;

-- 5. 顯示欄位結構
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'teachers' 
ORDER BY ordinal_position;

-- 6. 顯示完成訊息
DO $$
BEGIN
    RAISE NOTICE '=== is_deleted 欄位添加完成 ===';
    RAISE NOTICE '現在 teachers 表有以下狀態：';
    RAISE NOTICE '1. is_active = TRUE, is_deleted = FALSE: 啟用中';
    RAISE NOTICE '2. is_active = FALSE, is_deleted = FALSE: 停用中';
    RAISE NOTICE '3. is_deleted = TRUE: 已刪除（軟刪除）';
END $$; 