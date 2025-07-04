# 課程分類管理指南

## 📋 概述

改版後的課程分類管理系統統一由 `courses_categories` 表管理，提供多種管理方式來維護課程分類資料。

## 🎯 管理方式

### 1. 前端管理介面（推薦）

#### 進入管理頁面
1. 在系統導航中選擇「課程分類管理」
2. 或直接訪問 `/course-categories` 路徑

#### 功能操作
- **查看列表**：顯示所有課程分類及其統計資訊
- **新增分類**：點擊「新增課程分類」按鈕
- **編輯分類**：點擊分類行的編輯圖示
- **啟用/停用**：點擊眼睛圖示切換狀態
- **刪除分類**：點擊刪除圖示（僅限未使用的分類）

#### 欄位說明
- **分類名稱**：顯示名稱，用於前端顯示
- **分類代碼**：系統內部代碼，自動生成
- **描述**：分類的詳細說明
- **排序**：顯示順序，數字越小越靠前
- **課程數量**：該分類下的課程數量
- **師資數量**：具備此分類教學能力的師資數量
- **學生數量**：學習此分類課程的學生數量
- **狀態**：啟用/停用狀態

### 2. 資料庫直接操作

#### 執行管理腳本
```bash
# 執行課程分類管理腳本
sqlcmd -S 104.199.210.184,1433 -U d2_db -P mfwtj-k4pwc -d Student_Management -C -i SQL/maintenance/course_categories_management.sql
```

#### 使用預存程序

**新增課程分類**
```sql
EXEC sp_add_course_category 
    @category_name = N'新課程分類',
    @description = N'課程分類描述',
    @sort_order = 50;
```

**修改課程分類**
```sql
EXEC sp_update_course_category 
    @category_name = N'Python',
    @new_name = N'Python程式設計',
    @description = N'更新後的描述',
    @sort_order = 5;
```

**停用/啟用課程分類**
```sql
-- 停用
EXEC sp_toggle_course_category @category_name = N'舊分類', @enable = 0;

-- 啟用
EXEC sp_toggle_course_category @category_name = N'新分類', @enable = 1;
```

**重新排序**
```sql
EXEC sp_reorder_course_categories;
```

### 3. API 操作

#### 取得所有課程分類
```bash
GET /api/course-categories
```

#### 新增課程分類
```bash
POST /api/course-categories
Content-Type: application/json

{
  "category_name": "新課程分類",
  "description": "課程分類描述",
  "sort_order": 50,
  "is_active": true
}
```

#### 更新課程分類
```bash
PUT /api/course-categories/:id
Content-Type: application/json

{
  "category_name": "更新後的名稱",
  "description": "更新後的描述",
  "sort_order": 25,
  "is_active": true
}
```

#### 切換啟用狀態
```bash
PATCH /api/course-categories/:id/toggle
Content-Type: application/json

{
  "is_active": false
}
```

#### 刪除課程分類
```bash
DELETE /api/course-categories/:id
```

## 📊 查詢工具

### 基本查詢

**查看所有課程分類統計**
```sql
SELECT 
    category_name as [分類名稱],
    course_count as [課程數量],
    teacher_count as [師資數量],
    student_count as [學生數量],
    is_active as [啟用狀態]
FROM view_course_categories_management
ORDER BY sort_order;
```

**查看啟用的課程分類**
```sql
SELECT category_name, category_code, sort_order
FROM courses_categories 
WHERE is_active = 1
ORDER BY sort_order;
```

**查看停用的課程分類**
```sql
SELECT category_name, category_code, sort_order
FROM courses_categories 
WHERE is_active = 0
ORDER BY sort_order;
```

### 進階查詢

**查看沒有師資的課程分類**
```sql
SELECT cc.category_name, cc.description
FROM courses_categories cc
LEFT JOIN teacher_courses tc ON cc.id = tc.category_id
WHERE tc.category_id IS NULL AND cc.is_active = 1
ORDER BY cc.category_name;
```

**查看熱門課程分類（按師資數量排序）**
```sql
SELECT 
    cc.category_name,
    COUNT(DISTINCT tc.teacher_id) as teacher_count,
    COUNT(*) as total_records
FROM courses_categories cc
LEFT JOIN teacher_courses tc ON cc.id = tc.category_id
WHERE cc.is_active = 1
GROUP BY cc.id, cc.category_name
ORDER BY teacher_count DESC;
```

**查看師資教學能力分佈**
```sql
SELECT 
    category_name as [課程分類],
    max_level as [教學水準],
    COUNT(*) as [師資人數]
FROM view_teacher_capabilities
GROUP BY category_name, max_level
ORDER BY category_name, 
    CASE max_level
        WHEN N'初級' THEN 1
        WHEN N'中級' THEN 2
        WHEN N'高級' THEN 3
    END;
```

## ⚠️ 注意事項

### 刪除限制
- 無法刪除已被師資使用的課程分類
- 無法刪除已被課程使用的課程分類
- 建議先停用分類，確認無影響後再刪除

### 命名規範
- 分類名稱必須唯一
- 分類代碼自動生成，基於分類名稱
- 建議使用中文名稱，便於理解

### 排序建議
- 常用分類設定較小的排序值
- 每10個為一組，便於插入新分類
- 可使用 `sp_reorder_course_categories` 重新整理排序

## 🔄 工作流程

### 新增課程分類流程
1. 在前端管理介面點擊「新增課程分類」
2. 填寫分類名稱、描述、排序等資訊
3. 設定啟用狀態
4. 儲存後自動出現在師資課程能力管理中

### 修改課程分類流程
1. 在列表中點擊編輯圖示
2. 修改相關資訊
3. 儲存後立即生效
4. 相關的師資課程能力會自動更新

### 停用課程分類流程
1. 點擊眼睛圖示切換狀態
2. 停用後不會出現在新增師資課程能力的選項中
3. 已存在的師資課程能力不受影響
4. 可隨時重新啟用

## 🛠️ 故障排除

### 常見問題

**Q: 無法刪除課程分類**
A: 檢查是否有師資或課程在使用此分類，先停用再確認無影響後刪除

**Q: 課程分類名稱重複**
A: 系統會自動檢查重複，請使用不同的名稱

**Q: 排序不正確**
A: 執行 `sp_reorder_course_categories` 重新整理排序

**Q: 前端顯示異常**
A: 檢查課程分類是否已啟用，停用的分類不會顯示

### 聯絡支援
如遇到其他問題，請檢查：
1. 資料庫連接狀態
2. API 服務是否正常運行
3. 前端控制台是否有錯誤訊息
4. 資料庫日誌是否有異常記錄

## 📈 最佳實踐

1. **定期維護**：定期檢查未使用的課程分類
2. **命名一致性**：保持分類命名的一致性
3. **排序管理**：合理設定排序值，便於管理
4. **備份資料**：重要變更前先備份資料
5. **測試驗證**：新增分類後測試相關功能是否正常 