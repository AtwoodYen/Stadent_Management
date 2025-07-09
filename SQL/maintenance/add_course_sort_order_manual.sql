-- 手動執行版本：為課程資料表新增排序欄位
-- 適用於 MS SQL Server
-- 說明：最簡單的版本，手動執行每個步驟

-- 步驟 1: 新增 sort_order 欄位
ALTER TABLE courses ADD sort_order INT NULL;
PRINT N'已新增 sort_order 欄位';

-- 步驟 2: 設定初始值
UPDATE courses SET sort_order = id WHERE sort_order IS NULL;
PRINT N'已設定初始排序值';

-- 步驟 3: 設為 NOT NULL
ALTER TABLE courses ALTER COLUMN sort_order INT NOT NULL;
PRINT N'已設為 NOT NULL';

-- 步驟 4: 建立索引
CREATE NONCLUSTERED INDEX IX_courses_sort_order ON courses (sort_order);
PRINT N'已建立索引';

-- 步驟 5: 新增預設值
ALTER TABLE courses ADD CONSTRAINT DF_courses_sort_order DEFAULT (0) FOR sort_order;
PRINT N'已新增預設值';

-- 步驟 6: 驗證結果
SELECT TOP 5 id, name, sort_order FROM courses ORDER BY sort_order;
PRINT N'執行完成！'; 