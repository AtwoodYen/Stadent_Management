-- 統一課程分類名稱
-- 將資料庫中不一致的課程分類名稱更新為標準名稱

USE StudentManagement;

-- 更新 teacher_courses 表格中的課程分類名稱
UPDATE teacher_courses 
SET course_category = '網頁開發/APP/應用程式/遊戲'
WHERE course_category = 'Web開發';

-- 檢查更新結果
SELECT DISTINCT course_category 
FROM teacher_courses 
ORDER BY course_category;

PRINT '課程分類名稱統一完成'; 