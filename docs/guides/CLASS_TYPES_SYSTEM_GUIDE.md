# 班別管理系統部署指南

## 概述

本指南說明如何將現有的硬編碼班別系統升級為動態的班別管理系統。新系統支援以下班別：

- **C/C++** - C/C++程式設計課程
- **專題製作** - 專題製作課程，培養學生完整專案開發能力
- **Scratch** - Scratch視覺化程式設計，適合程式設計初學者
- **美國APCS A** - 美國大學先修課程 Computer Science A
- **美國APCS P** - 美國大學先修課程 Computer Science Principles
- **動畫美術** - 動畫製作與美術設計課程

## 系統架構變更

### 資料庫變更

1. **新增 `class_types` 資料表**
   - 存儲班別的基本資訊（代碼、名稱、描述等）
   - 支援啟用/停用功能
   - 內建排序功能

2. **修改 `students` 表**
   - `class_type` 欄位從存儲班別名稱改為存儲班別代碼
   - 建立外鍵約束確保資料完整性

### API 變更

1. **新增 API 端點**
   - `GET /api/class-types` - 獲取所有啟用的班別
   - `GET /api/class-types/stats` - 獲取班別統計資料

2. **現有 API 保持不變**
   - 學生相關 API 無需修改
   - 前端會自動處理班別代碼與名稱的轉換

### 前端變更

1. **動態載入班別選項**
   - 學生表單自動從 API 載入班別選項
   - 學生管理頁面的篩選器也使用動態班別

2. **顯示優化**
   - 表格中顯示班別名稱而非代碼
   - 保持用戶體驗的一致性

## 腳本檔案說明

本系統包含以下 SQL 腳本檔案：

1. **`SQL/tables/create_class_types_table.sql`** - 建立班別資料表
2. **`SQL/maintenance/migrate_class_types_fixed.sql`** - 修正版資料遷移腳本（推薦使用）
3. **`SQL/maintenance/check_migration_status.sql`** - 狀態檢查和診斷腳本
4. **`SQL/maintenance/rollback_class_system.sql`** - 自動回滾腳本
5. **`SQL/test_class_system.sql`** - 系統驗證腳本
6. **`SQL/maintenance/migrate_class_types.sql`** - 原始遷移腳本（已棄用，有錯誤）

## 部署步驟

### 步驟 1: 備份現有資料

```sql
-- 備份學生資料（預防措施）
SELECT * INTO students_backup_$(date +%Y%m%d) FROM students;
```

### 步驟 2: 建立班別資料表

```bash
# 執行班別資料表建立腳本
sqlcmd -S your_server -d your_database -i SQL/tables/create_class_types_table.sql
```

### 步驟 3: 檢查當前狀態

```bash
# 先檢查當前資料庫狀態
sqlcmd -S your_server -d your_database -i SQL/maintenance/check_migration_status.sql
```

### 步驟 4: 執行資料遷移

```bash
# 執行修正版資料遷移腳本
sqlcmd -S your_server -d your_database -i SQL/maintenance/migrate_class_types_fixed.sql
```

**重要：** 此步驟會：
- 自動檢查前置條件
- 備份現有班別資料
- 將 A班→C/C++，B班→Scratch，C班→專題製作
- 建立外鍵約束
- 重建索引
- 提供詳細的執行狀態

### 步驟 5: 驗證遷移結果

```bash
# 執行測試腳本
sqlcmd -S your_server -d your_database -i SQL/test_class_system.sql
```

檢查輸出確保：
- 班別資料表包含 6 個班別
- 所有學生都正確關聯到新班別
- 外鍵約束正常運作
- 無遺失資料

### 步驟 6: 更新應用程式

前端代碼已經更新，重新啟動應用程式：

```bash
# 重新啟動後端服務
npm restart

# 如果使用 PM2
pm2 restart your-app-name
```

## 使用說明

### 管理班別

目前班別由資料庫直接管理。如需新增或修改班別：

```sql
-- 新增班別
INSERT INTO class_types (class_code, class_name, description, sort_order) 
VALUES (N'NEW_CLASS', N'新班別名稱', N'班別描述', 7);

-- 停用班別
UPDATE class_types SET is_active = 0 WHERE class_code = 'OLD_CLASS';

-- 修改班別名稱
UPDATE class_types SET class_name = N'新名稱' WHERE class_code = 'CLASS_CODE';
```

### 查看班別統計

```sql
-- 查看各班別學生人數
SELECT 
    ct.class_name as '班別名稱',
    COUNT(s.id) as '學生人數'
FROM class_types ct
LEFT JOIN students s ON ct.class_code = s.class_type AND s.is_active = 1
WHERE ct.is_active = 1
GROUP BY ct.class_name, ct.sort_order
ORDER BY ct.sort_order;
```

## 故障排除

### 診斷工具

如果遇到問題，請先執行狀態檢查腳本：

```bash
sqlcmd -S your_server -d your_database -i SQL/maintenance/check_migration_status.sql
```

### 常見問題與解決方案

1. **執行遷移腳本時出現「無效的資料行名稱 'new_class_type'」錯誤**
   - **原因**: 原始遷移腳本有 SQL 語法錯誤
   - **解決**: 使用修正版腳本 `migrate_class_types_fixed.sql`
   - **檢查**: 執行 `check_migration_status.sql` 確認當前狀態

2. **前端顯示空白班別選項**
   - 檢查 API `/api/class-types` 是否正常
   - 確認班別資料表有資料且 `is_active = 1`
   - 檢查瀏覽器網路面板是否有 API 錯誤

3. **學生班別顯示代碼而非名稱**
   - 檢查前端的 `getClassTypeName` 函數
   - 確認 `classTypes` 資料已正確載入
   - 重新整理頁面或清除瀏覽器快取

4. **無法新增學生（外鍵錯誤）**
   - 確認使用的班別代碼存在於 `class_types` 表
   - 檢查外鍵約束 `FK_students_class_type`
   - 執行 `check_migration_status.sql` 檢查資料完整性

5. **遷移過程中斷**
   - 執行 `check_migration_status.sql` 確認狀態
   - 如果狀態為「遷移中斷」，執行回滾腳本
   - 重新執行修正版遷移腳本

### 完整回滾程序

如果需要完全回滾到舊系統，使用自動化回滾腳本：

```bash
# 執行自動回滾腳本
sqlcmd -S your_server -d your_database -i SQL/maintenance/rollback_class_system.sql
```

回滾腳本會：
- 檢查備份表是否存在
- 移除新系統的外鍵約束和索引
- 將班別代碼轉換回原始的 A班、B班、C班 格式
- 恢復原始的資料表結構
- 提供詳細的回滾狀態報告

### 手動回滾（僅在自動回滾失敗時使用）

```sql
-- 1. 移除外鍵約束
ALTER TABLE students DROP CONSTRAINT FK_students_class_type;

-- 2. 恢復舊的班別資料
UPDATE students SET class_type = 
CASE 
    WHEN class_type = 'CPP' THEN N'A班'
    WHEN class_type = 'SCRATCH' THEN N'B班'
    WHEN class_type = 'PROJECT' THEN N'C班'
    ELSE N'A班'
END;

-- 3. 刪除班別資料表
DROP TABLE class_types;
```

## 未來擴展

### 建議的增強功能

1. **班別管理界面**
   - 建立前端界面來管理班別
   - 支援新增、編輯、停用班別

2. **班別詳細資訊**
   - 增加課程時間、費用等欄位
   - 關聯到教師和課程資料

3. **班別容量管理**
   - 設定每班最大學生數
   - 自動檢查班級是否額滿

4. **歷史記錄**
   - 記錄學生班別變更歷史
   - 支援學期制度

## 結論

新的班別管理系統提供了更好的彈性和維護性，同時保持了現有功能的完整性。所有變更都是向後相容的，不會影響現有的用戶體驗。

如有任何問題，請參考測試腳本的輸出或聯繫開發團隊。 