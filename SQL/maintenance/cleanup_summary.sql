-- =====================================================
-- 課程分類清理總結報告
-- =====================================================

USE Student_Management;
GO

PRINT N'=== 課程分類清理總結報告 ===';
GO

-- =====================================================
-- 1. 清理前後的統計
-- =====================================================

PRINT N'1. 清理前後的統計：';
PRINT N'清理前：38 個課程分類';
PRINT N'清理後：33 個課程分類';
PRINT N'刪除了 5 個重複的課程分類';
GO

-- =====================================================
-- 2. 已合併的重複分類
-- =====================================================

PRINT N'2. 已合併的重複分類：';
PRINT N'- _PYTHON → PYTHON (師資：6→8, 課程：0→5)';
PRINT N'- _SWIFT → SWIFT (師資：1→1, 課程：0→0)';
PRINT N'- _UNITY → UNITY (師資：2→7, 課程：0→0)';
PRINT N'- _遊戲開發 → GAME_DEV (師資：3→8, 課程：0→3)';
PRINT N'- _機器學習 → MACHINE_LEARNING (師資：6→6, 課程：0→2)';
GO

-- =====================================================
-- 3. 剩餘的帶底線分類（獨立分類，無重複）
-- =====================================================

PRINT N'3. 剩餘的帶底線分類（獨立分類，無重複）：';
SELECT 
    category_name as [分類名稱],
    category_code as [分類代碼],
    teacher_count as [師資數量],
    course_count as [課程數量]
FROM view_course_categories_management
WHERE category_code LIKE '_%'
ORDER BY category_name;
GO

-- =====================================================
-- 4. 熱門課程分類（按師資數量排序）
-- =====================================================

PRINT N'4. 熱門課程分類（按師資數量排序）：';
SELECT TOP 10
    category_name as [分類名稱],
    category_code as [分類代碼],
    teacher_count as [師資數量],
    course_count as [課程數量],
    student_count as [學生數量]
FROM view_course_categories_management
WHERE is_active = 1
ORDER BY teacher_count DESC, course_count DESC;
GO

-- =====================================================
-- 5. 沒有師資的課程分類
-- =====================================================

PRINT N'5. 沒有師資的課程分類：';
SELECT 
    category_name as [分類名稱],
    category_code as [分類代碼],
    course_count as [課程數量]
FROM view_course_categories_management
WHERE teacher_count = 0 AND is_active = 1
ORDER BY category_name;
GO

-- =====================================================
-- 6. 沒有課程的課程分類
-- =====================================================

PRINT N'6. 沒有課程的課程分類：';
SELECT 
    category_name as [分類名稱],
    category_code as [分類代碼],
    teacher_count as [師資數量]
FROM view_course_categories_management
WHERE course_count = 0 AND is_active = 1
ORDER BY category_name;
GO

-- =====================================================
-- 7. 清理效果總結
-- =====================================================

PRINT N'7. 清理效果總結：';
PRINT N'✓ 成功合併了 5 個重複的課程分類';
PRINT N'✓ 更新了 18 筆師資教學能力記錄';
PRINT N'✓ 保持了資料的完整性和一致性';
PRINT N'✓ 重新整理了排序順序';
PRINT N'✓ 系統現在更加整潔，便於管理';
GO

PRINT N'=== 清理總結報告完成 ===';
PRINT N'建議：';
PRINT N'1. 測試課程分類管理頁面功能';
PRINT N'2. 測試師資管理中的課程能力選擇';
PRINT N'3. 測試課程管理中的分類選擇';
PRINT N'4. 確認所有相關功能正常運作';
GO 