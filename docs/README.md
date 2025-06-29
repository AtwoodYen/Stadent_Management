# 學生管理系統文檔中心

本目錄包含學生管理系統的所有文檔，按功能和類型分類整理。

## 📁 目錄結構

### 📖 guides/ - 使用指南
包含系統使用和配置的指南文檔：

- `LOGIN_SYSTEM_GUIDE.md` - 登入系統使用指南

### 🔧 fixes/ - 修復記錄  
包含系統問題修復的詳細記錄：

- `CLEANUP_SUMMARY.md` - 資料庫清理修復記錄
- `GRID_FIX_SUMMARY.md` - 網格佈局修復記錄
- `SCHEDULE_FIX_SUMMARY.md` - 課表功能修復記錄
- `SCHEDULE_WEEK_VIEW_FIX.md` - 課表週視圖修復記錄

### 💻 development/ - 開發文檔
包含開發相關的技術文檔：

- `client-README.md` - 前端專案說明文檔
- `DEBUG_INSTRUCTIONS.md` - 除錯指導說明

## 📋 文檔使用指南

### 🎯 適用對象
- **系統管理員**：主要參考 `guides/` 目錄
- **開發人員**：主要參考 `development/` 和 `fixes/` 目錄
- **維護人員**：主要參考 `fixes/` 目錄

### 📝 新增文檔規範
所有新的 `.md` 文檔都應該建立在此 `docs/` 目錄中：

1. **使用指南** → `docs/guides/`
2. **修復記錄** → `docs/fixes/`
3. **開發文檔** → `docs/development/`
4. **API 文檔** → `docs/api/`（未來新增）
5. **部署文檔** → `docs/deployment/`（未來新增）

### 📄 文檔命名規範
- 使用英文檔名，單字間用 `-` 或 `_` 連接
- 檔名應該清楚描述內容
- 範例：`user-management-guide.md`, `database-setup.md`

## 🔗 相關文檔
- 主專案 README：`../README.md`
- SQL 腳本說明：`../SQL/README.md`

---
*最後更新：2025-06-30* 