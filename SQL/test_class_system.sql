-- =====================================================
-- 班別系統測試腳本
-- 創建日期: 2025-01-28
-- 說明: 測試新的班別系統是否正常運作
-- =====================================================

-- 測試1: 檢查班別資料表是否正確建立
SELECT '=== 測試1: 班別資料表內容 ===' as test_name;
SELECT 
    class_code as '班別代碼',
    class_name as '班別名稱', 
    description as '描述',
    sort_order as '排序',
    is_active as '啟用狀態'
FROM class_types 
ORDER BY sort_order;

-- 測試2: 檢查學生資料與班別的關聯
SELECT '=== 測試2: 學生班別關聯 ===' as test_name;
SELECT 
    s.chinese_name as '學生姓名',
    s.class_type as '班別代碼',
    ct.class_name as '班別名稱',
    ct.description as '班別描述'
FROM students s
LEFT JOIN class_types ct ON s.class_type = ct.class_code
WHERE s.is_active = 1
ORDER BY ct.sort_order, s.chinese_name;

-- 測試3: 班別統計
SELECT '=== 測試3: 班別學生統計 ===' as test_name;
SELECT 
    ct.class_name as '班別名稱',
    COUNT(s.id) as '學生人數',
    ct.description as '班別描述'
FROM class_types ct
LEFT JOIN students s ON ct.class_code = s.class_type AND s.is_active = 1
WHERE ct.is_active = 1
GROUP BY ct.class_code, ct.class_name, ct.description, ct.sort_order
ORDER BY ct.sort_order;

-- 測試4: 檢查外鍵約束是否正常
SELECT '=== 測試4: 外鍵約束檢查 ===' as test_name;
SELECT 
    fk.name as '外鍵名稱',
    OBJECT_NAME(fk.parent_object_id) as '子表',
    COL_NAME(fkc.parent_object_id, fkc.parent_column_id) as '子表欄位',
    OBJECT_NAME(fk.referenced_object_id) as '父表',
    COL_NAME(fkc.referenced_object_id, fkc.referenced_column_id) as '父表欄位'
FROM sys.foreign_keys fk
INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
WHERE fk.name = 'FK_students_class_type';

-- 測試5: 驗證 API 查詢的 SQL（模擬 API 呼叫）
SELECT '=== 測試5: API 查詢測試 ===' as test_name;

-- 模擬 /api/class-types API
SELECT 'GET /api/class-types' as api_endpoint;
SELECT class_code, class_name, description, sort_order 
FROM class_types 
WHERE is_active = 1 
ORDER BY sort_order, class_name;

-- 模擬 /api/class-types/stats API
SELECT 'GET /api/class-types/stats' as api_endpoint;
SELECT 
    ct.class_code,
    ct.class_name,
    ct.description,
    COUNT(s.id) as student_count
FROM class_types ct
LEFT JOIN students s ON ct.class_code = s.class_type AND s.is_active = 1
WHERE ct.is_active = 1
GROUP BY ct.class_code, ct.class_name, ct.description, ct.sort_order
ORDER BY ct.sort_order, ct.class_name;

-- 測試6: 檢查是否有無效的班別代碼
SELECT '=== 測試6: 資料完整性檢查 ===' as test_name;
SELECT 
    s.id as '學生ID',
    s.chinese_name as '學生姓名',
    s.class_type as '班別代碼',
    '找不到對應的班別' as '狀態'
FROM students s
LEFT JOIN class_types ct ON s.class_type = ct.class_code
WHERE s.is_active = 1 AND ct.class_code IS NULL;

PRINT '=== 班別系統測試完成 ===';
PRINT '請檢查以上查詢結果：';
PRINT '1. 班別資料表是否包含6個班別';
PRINT '2. 學生資料是否正確關聯到班別';
PRINT '3. 班別統計是否正確';
PRINT '4. 外鍵約束是否存在';
PRINT '5. API 查詢是否返回正確結果';
PRINT '6. 是否有無效的班別代碼（應該為空）'; 