# 木作裝潢工具管理系統

一套完整的工具庫存管理系統，專為木作裝潢工程設計。支援工具借用、歸還、庫存追蹤、使用排程、維護管理及數據匯出等功能。

## 功能特性

### 核心功能

- **工具管理** - 完整的工具資料庫，包含工具名稱、類別、規格、照片等詳細資訊
- **庫存追蹤** - 即時追蹤每件工具的可用數量，自動更新庫存狀態
- **借用登記** - 支援單項和多項工具借用，記錄借用人、案場名稱、預計歸還日期
- **歸還管理** - 快速標記工具歸還，支援批量歸還操作
- **使用排程** - 30天視覺化排程表，顯示工具的借用期間和可用性
- **搜尋篩選** - 按工具名稱、類別、狀態等條件快速搜尋
- **歷史記錄** - 完整的借用歸還歷史，支援按日期、案場名稱篩選
- **Excel匯出** - 將借用記錄匯出為格式化的Excel檔案，支援日期和案場篩選
- **維護提醒** - 基於使用週期和次數的自動維護提醒系統
- **統計儀表板** - 展示工具使用率、庫存狀態、借用趨勢等關鍵指標

### 技術特性

- **多角色支援** - 管理員和普通使用者的不同權限控制
- **響應式設計** - 優雅的UI設計，支援各種設備尺寸
- **完整測試** - 23個單元測試，確保系統穩定性
- **雲端存儲** - 工具照片存儲在S3雲端，支援快速訪問

## 技術棧

### 後端

- **框架** - Express.js 4.x
- **API** - tRPC 11.x（類型安全的RPC框架）
- **資料庫** - MySQL/TiDB with Drizzle ORM
- **驗證** - Manus OAuth 2.0

### 前端

- **框架** - React 19.x
- **樣式** - Tailwind CSS 4.x
- **UI組件** - shadcn/ui
- **路由** - Wouter
- **數據管理** - TanStack Query
- **表單** - React Hook Form + Zod

### 工具

- **打包** - Vite + esbuild
- **測試** - Vitest
- **代碼格式** - Prettier
- **類型檢查** - TypeScript 5.9

## 快速開始

### 前置需求

- Node.js 22.x 或更高版本
- pnpm 10.x 或更高版本
- MySQL 5.7+ 或 TiDB

### 安裝

```bash
# 安裝依賴
pnpm install

# 推送資料庫架構
pnpm db:push

# 啟動開發服務器
pnpm dev
```

開發服務器將在 `http://localhost:3000` 啟動。

### 構建

```bash
# 構建生產版本
pnpm build

# 啟動生產服務器
pnpm start
```

### 測試

```bash
# 運行所有單元測試
pnpm test

# 監視模式下運行測試
pnpm test:watch
```

## 專案結構

```
woodworking-tool-manager/
├── client/                    # 前端應用
│   ├── public/               # 靜態資源
│   ├── src/
│   │   ├── components/       # React組件
│   │   ├── pages/           # 頁面組件
│   │   ├── lib/             # 工具函數
│   │   ├── contexts/        # React Context
│   │   └── App.tsx          # 主應用組件
│   └── index.html           # HTML入口
├── server/                    # 後端應用
│   ├── routers/             # tRPC路由
│   ├── db.ts                # 資料庫查詢函數
│   ├── routers.ts           # 主路由器
│   └── _core/               # 核心框架代碼
├── drizzle/                  # 資料庫架構
│   └── schema.ts            # 資料表定義
├── shared/                   # 共享代碼
├── storage/                  # S3存儲助手
└── package.json             # 專案配置
```

## API文檔

### 工具管理

- `tools.list` - 獲取所有工具列表
- `tools.create` - 新增工具
- `tools.update` - 編輯工具
- `tools.delete` - 刪除工具
- `tools.getById` - 獲取工具詳情

### 借用管理

- `borrow.create` - 建立單項借用記錄
- `borrow.createMultiple` - 建立多項借用記錄
- `borrow.getActive` - 獲取活躍借用記錄
- `borrow.getByToolId` - 獲取特定工具的借用記錄
- `borrow.search` - 搜尋借用記錄

### 歸還管理

- `return.create` - 建立歸還記錄
- `return.getHistory` - 獲取歸還歷史

### 數據匯出

- `export.borrowRecords` - 匯出借用記錄（支援日期和案場篩選）

### 統計分析

- `analytics.getStats` - 獲取系統統計數據
- `analytics.getMaintenanceReminders` - 獲取維護提醒

## 資料庫架構

### 主要表格

- **users** - 使用者帳戶
- **tools** - 工具資訊
- **borrowRecords** - 借用記錄
- **returnRecords** - 歸還記錄
- **maintenanceRecords** - 維護記錄

## 環境變數

```env
# 資料庫
DATABASE_URL=mysql://user:password@localhost:3306/woodworking_tools

# OAuth
VITE_APP_ID=your_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://auth.manus.im

# JWT
JWT_SECRET=your_jwt_secret

# 存儲
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your_api_key
```

## 開發指南

### 新增功能

1. 在 `drizzle/schema.ts` 中定義資料表
2. 運行 `pnpm db:push` 推送資料庫變更
3. 在 `server/db.ts` 中新增查詢函數
4. 在 `server/routers/` 中建立或更新tRPC路由
5. 在 `client/src/pages/` 中建立前端頁面
6. 編寫單元測試並運行 `pnpm test`

### 代碼風格

- 使用TypeScript進行類型安全
- 遵循Prettier代碼格式化規則
- 編寫清晰的JSDoc註解
- 使用React Hook和函數式組件

## 測試

系統包含23個單元測試，涵蓋：

- 工具管理API
- 借用記錄API
- 預計歸還日期功能
- Excel匯出功能
- 身份驗證

運行測試：

```bash
pnpm test
```

## 部署

### 使用Manus平台

本系統已配置為Manus Web應用，可直接在Manus平台上部署。

1. 點擊Management UI中的「Publish」按鈕
2. 系統將自動構建和部署
3. 訪問自動生成的域名或綁定自訂域名

### 自訂部署

如需部署到其他平台（如Railway、Render等），請參考各平台的部署文檔。

## 常見問題

### 如何新增工具？

進入「工具管理」頁面，點擊「新增工具」按鈕，填寫工具資訊並上傳照片。

### 如何匯出借用記錄？

進入「借用管理」頁面，點擊「匯出Excel」按鈕，選擇日期範圍和案場名稱，點擊匯出。

### 如何設定維護提醒？

進入「維護管理」頁面，為工具設定維護週期（天數）和使用次數閾值。

## 貢獻

歡迎提交Issue和Pull Request來改進本系統。

## 授權

MIT License

## 聯絡方式

如有任何問題或建議，請聯絡開發團隊。

---

**最後更新** - 2026年1月

**版本** - 1.0.0
