-- 為 teachers 表添加排序欄位
-- 這個欄位用於儲存師資的顯示順序

-- 添加 sort_order 欄位
ALTER TABLE teachers 
ADD sort_order INT DEFAULT 0;

-- 為現有的師資設定初始排序值（按照 id 順序）
UPDATE teachers 
SET sort_order = id 
WHERE sort_order = 0 OR sort_order IS NULL;

-- 為 sort_order 欄位添加索引以提高查詢效能
CREATE INDEX IX_teachers_sort_order ON teachers(sort_order);

-- 顯示更新結果
SELECT id, name, sort_order 
FROM teachers 
ORDER BY sort_order, id; 