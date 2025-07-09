-- 單步執行版本：為課程資料表新增排序欄位
-- 適用於 MS SQL Server
-- 說明：每個 SQL 語句都是獨立的，可以逐行執行

-- 請逐行執行以下 SQL 語句：

-- 1. 檢查資料表是否存在
SELECT * FROM sys.objects WHERE name = 'courses' AND type = 'U';

-- 2. 檢查欄位是否已存在
SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('courses') AND name = 'sort_order';

-- 3. 新增 sort_order 欄位（如果步驟 2 沒有結果）
ALTER TABLE courses ADD sort_order INT NULL;

-- 4. 再次檢查欄位是否新增成功
SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('courses') AND name = 'sort_order';

-- 5. 檢查現有資料
SELECT COUNT(*) as 總課程數 FROM courses;
SELECT COUNT(*) as 無排序值課程數 FROM courses WHERE sort_order IS NULL;

-- 6. 設定初始排序值
UPDATE courses SET sort_order = id WHERE sort_order IS NULL;

-- 7. 檢查更新結果
SELECT COUNT(*) as 更新後無排序值課程數 FROM courses WHERE sort_order IS NULL;

-- 8. 設為 NOT NULL
ALTER TABLE courses ALTER COLUMN sort_order INT NOT NULL;

-- 9. 建立索引
CREATE NONCLUSTERED INDEX IX_courses_sort_order ON courses (sort_order);

-- 10. 新增預設值
ALTER TABLE courses ADD CONSTRAINT DF_courses_sort_order DEFAULT (0) FOR sort_order;

-- 11. 最終驗證
SELECT TOP 10 id, name, sort_order FROM courses ORDER BY sort_order;

-- 完成！
PRINT N'課程排序欄位新增完成！'; 