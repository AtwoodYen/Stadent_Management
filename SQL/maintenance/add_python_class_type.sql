-- =====================================================
-- 新增 Python 課程到班別系統
-- 創建日期: 2025-01-28
-- 說明: 在 class_types 資料表中新增 Python 程式設計課程
-- =====================================================

PRINT '=== 開始新增 Python 課程 ===';

-- 檢查 class_types 資料表是否存在
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'class_types')
BEGIN
    PRINT '錯誤: class_types 資料表不存在，請先執行 create_class_types_table.sql';
    RETURN;
END

-- 檢查是否已存在 Python 課程
IF EXISTS (SELECT * FROM class_types WHERE class_code = 'PYTHON')
BEGIN
    PRINT 'Python 課程已存在，跳過新增';
    RETURN;
END

-- 取得最大的排序順序
DECLARE @max_sort_order INT;
SELECT @max_sort_order = ISNULL(MAX(sort_order), 0) FROM class_types;

-- 新增 Python 課程
INSERT INTO class_types (class_code, class_name, description, sort_order) 
VALUES (N'PYTHON', N'Python', N'Python程式設計課程，適合初學者學習程式設計基礎', @max_sort_order + 1);

PRINT '已新增 Python 課程';

-- 驗證新增結果
PRINT '=== 驗證新增結果 ===';
SELECT 
    class_code AS '班別代碼',
    class_name AS '班別名稱',
    description AS '描述',
    sort_order AS '排序順序',
    is_active AS '啟用狀態'
FROM class_types 
WHERE class_code = 'PYTHON';

-- 顯示所有班別（按排序順序）
PRINT '';
PRINT '=== 所有班別列表 ===';
SELECT 
    class_code AS '班別代碼',
    class_name AS '班別名稱',
    description AS '描述',
    sort_order AS '排序順序'
FROM class_types 
WHERE is_active = 1
ORDER BY sort_order, class_name;

PRINT '';
PRINT '=== Python 課程新增完成 ===';
PRINT '班別代碼: PYTHON';
PRINT '班別名稱: Python';
PRINT '描述: Python程式設計課程，適合初學者學習程式設計基礎';
PRINT '排序順序: ' + CAST(@max_sort_order + 1 AS NVARCHAR(10)); 