# 學生程度等級升級指南

## 概述
將學生程度從原本的三個等級（初級、中級、進階）升級為五個等級（新手、入門、進階、高階、精英），以提供更精細的程度分類。

## 新等級對應關係
- **初級** → **新手**
- **中級** → **入門**  
- **進階** → **進階**（保持不變）
- 新增 **高階** 和 **精英** 等級

## 部署步驟

### 1. 資料庫更新
執行完整的資料庫更新腳本（包含約束修正）：
```sql
-- 執行完整更新腳本
SQL/maintenance/update_student_levels_complete.sql
```

**注意**：如果遇到約束衝突錯誤，請使用此完整腳本，它會自動處理約束修正。

### 2. 前端更新
前端組件已更新完成：
- ✅ `StudentsPage.tsx` - 學生管理頁面篩選選項
- ✅ `StudentFormOptimized.tsx` - 學生新增表單
- ✅ `StudentEditFormImproved.tsx` - 學生編輯表單

### 3. 驗證更新
執行檢查腳本確認更新結果：
```sql
-- 檢查程度分佈
SQL/maintenance/check_student_levels.sql
```

## 回滾程序

如需回滾到原本的三個等級：
```sql
-- 執行回滾腳本
SQL/maintenance/rollback_student_levels.sql
```

## 檔案清單

### 新增檔案
- `SQL/maintenance/update_student_levels.sql` - 基本更新腳本
- `SQL/maintenance/update_student_levels_complete.sql` - 完整更新腳本（推薦）
- `SQL/maintenance/fix_level_constraint.sql` - 約束修正腳本
- `SQL/maintenance/rollback_student_levels.sql` - 回滾腳本
- `SQL/maintenance/check_student_levels.sql` - 檢查腳本
- `docs/guides/STUDENT_LEVEL_UPGRADE_GUIDE.md` - 本指南

### 修改檔案
- `client/src/pages/StudentsPage.tsx` - 更新篩選選項
- `client/src/components/StudentFormOptimized.tsx` - 更新表單選項
- `client/src/components/StudentEditFormImproved.tsx` - 更新編輯選項

## 注意事項

1. **備份保護**：更新腳本會自動建立備份表 `students_level_backup`
2. **約束處理**：完整腳本會自動移除舊約束並新增新約束
3. **資料完整性**：更新後會檢查資料完整性
4. **向後相容**：如果回滾，所有新等級會對應到最接近的舊等級
5. **前端同步**：前端所有相關組件已同步更新

## 故障排除

### 約束衝突錯誤
如果遇到 `CHECK 條件約束衝突` 錯誤，請使用 `update_student_levels_complete.sql` 腳本，它會自動處理約束修正。

### 手動約束修正
如需手動修正約束，可執行：
```sql
-- 執行約束修正腳本
SQL/maintenance/fix_level_constraint.sql
```

## 測試建議

1. 執行更新腳本
2. 檢查資料庫中的程度分佈
3. 測試前端篩選功能
4. 測試新增/編輯學生功能
5. 確認所有程度選項正常顯示

## 完成確認

更新完成後，請確認：
- [ ] 資料庫更新成功
- [ ] 前端選項正確顯示
- [ ] 篩選功能正常運作
- [ ] 新增/編輯功能正常
- [ ] 備份表已建立 