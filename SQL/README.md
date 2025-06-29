# SQL 資料庫腳本目錄

本目錄包含學生管理系統的所有 SQL 腳本，按功能分類整理。

## 目錄結構

### 📁 tables/ - 資料表結構
包含資料庫表格的建立腳本和完整資料庫結構：

- `create_courses_table.sql` - 課程表結構
- `create_students_table.sql` - 學生表結構  
- `create_teachers_table.sql` - 師資表結構
- `create_users_table.sql` - 用戶表結構
- `schools_database_complete.sql` - 學校資料庫完整結構
- `students_database_complete.sql` - 學生資料庫完整結構

### 📁 data/ - 測試資料
包含各種測試資料的插入腳本：

- `insert_teachers_data.sql` - 師資基本資料
- `insert_lessons_test_data.sql` - 課程測試資料（原始版本）
- `insert_lessons_test_data_fixed.sql` - 課程測試資料（修復版本）
- `insert_lessons_test_data_final.sql` - 課程測試資料（最終版本）

### 📁 schedules/ - 課表管理
包含課表相關的腳本：

- `assign_student_schedule.sql` - 學生課表分配
- `update_students_schedule.sql` - 學生課表更新
- `drop_student_schedules_table.sql` - 移除學生課表表格

### 📁 maintenance/ - 資料庫維護
包含資料庫清理和修復腳本：

- `cleanup_existing_tables.sql` - 清理現有表格
- `force_cleanup_students.sql` - 強制清理學生資料
- `fix_teachers_data.sql` - 修復師資資料

## 使用說明

1. **初次建立資料庫**：先執行 `tables/` 目錄中的建表腳本
2. **插入測試資料**：使用 `data/` 目錄中的腳本
3. **課表管理**：使用 `schedules/` 目錄中的腳本
4. **資料庫維護**：需要時使用 `maintenance/` 目錄中的腳本

## 注意事項

- 執行腳本前請先備份資料庫
- 建議按照功能順序執行腳本
- 測試環境請使用 `data/` 目錄中的測試資料
- 生產環境請謹慎使用 `maintenance/` 目錄中的清理腳本 