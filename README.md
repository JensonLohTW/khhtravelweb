# 360 度虛擬導覽專案

這是一個使用 Marzipano Tool 生成的 360 度虛擬導覽網頁應用程式。

專案網址：http://www.marzipano.net

---

## 專案分支說明

本專案提供兩個分支，對應不同的功能需求：

### 📦 main 分支（基礎版本）

**功能特點**：
- 360 度全景瀏覽
- 場景切換和熱點導航
- 自動旋轉和全螢幕控制
- URL 狀態管理（支援場景連結分享）
- 瀏覽器前進/後退支援

**適合對象**：
- 需要基本虛擬導覽功能
- 希望保持程式碼簡潔
- 不需要 QR Code 分享功能

**下載方式**：
```bash
git clone -b main https://github.com/JensonLohTW/khhtravelweb.git
```

---

### 🎯 qr 分支（QR 分享功能版本）

**功能特點**：
- 包含 main 分支的所有功能
- **QR Code 分享功能**：一鍵生成當前場景的 QR Code
- **模組化架構**：程式碼重構為多個模組，更易維護和擴展
- **改進的啟動腳本**：自動檢測並啟動開發伺服器

**新增模組**：
- `qrService.js` - QR Code 生成服務
- `qrUi.js` - QR 按鈕和彈窗 UI
- `sceneManager.js` - 場景管理
- `hotspots.js` - 熱點管理
- `urlState.js` - URL 狀態管理
- `uiControls.js` - UI 控制
- `environment.js` - 環境偵測

**適合對象**：
- 需要 QR Code 快速分享場景
- 希望使用模組化架構便於維護
- 計畫未來擴展更多功能

**下載方式**：
```bash
git clone -b qr https://github.com/JensonLohTW/khhtravelweb.git
```

---

## 功能對比

| 功能 | main 分支 | qr 分支 |
|------|-----------|---------|
| 360 度全景瀏覽 | ✅ | ✅ |
| 場景切換 | ✅ | ✅ |
| 熱點導航 | ✅ | ✅ |
| URL 狀態管理 | ✅ | ✅ |
| 瀏覽器前進/後退 | ✅ | ✅ |
| QR Code 生成 | ❌ | ✅ |
| QR 按鈕 UI | ❌ | ✅ |
| 模組化架構 | ❌ | ✅ |
| 一鍵啟動腳本 | ❌ | ✅ |

---

## 快速開始

### 啟動方式

由於瀏覽器對 `file://` URL 的安全限制，應用程式需要透過網頁伺服器運行。

#### main 分支

```bash
# 使用 Python 3
python3 -m http.server 8000

# 然後在瀏覽器開啟
# http://localhost:8000/app-files/index.html
```

#### qr 分支

```bash
# 方式 1：使用一鍵啟動腳本（推薦）
./scripts/start.sh

# 方式 2：手動啟動
python3 -m http.server 8000
# 然後開啟 http://localhost:8000/app-files/index.html
```

### 其他啟動選項

```bash
# 使用 Python 2
python -m http.server 8000

# 使用 Node.js
npx http-server
```

---

## 部署

要部署到生產環境，上傳 `app-files/` 資料夾的內容到您的網頁主機服務。

應用程式完全在客戶端運行，無需後端伺服器。

---

## 檔案結構

```
khhtravelweb/
├── app-files/               # 主應用程式目錄
│   ├── index.html          # 主 HTML 文件
│   ├── index.js            # 應用程式邏輯
│   ├── data.js             # 場景配置資料
│   ├── style.css           # 樣式表
│   ├── tiles/              # 全景圖片磚塊
│   ├── img/                # UI 圖示
│   ├── modules/            # 模組化程式碼（僅 qr 分支）
│   └── vendor/             # 第三方函式庫
├── scripts/                # 啟動腳本（僅 qr 分支）
├── CLAUDE.md               # 開發指南
└── README.md               # 本文件
```

---

## 自訂開發

您可以透過編輯以下檔案來自訂應用程式：

- `app-files/index.html` - HTML 結構和場景列表
- `app-files/index.js` - 應用程式邏輯
- `app-files/data.js` - 場景定義和熱點配置
- `app-files/style.css` - 視覺樣式

詳細的開發指南請參考 [CLAUDE.md](CLAUDE.md)。

---

## 技術棧

- **核心函式庫**：Marzipano.js（360 度全景查看器）
- **輔助函式庫**：Screenfull.js、Bowser.js
- **QR Code**：qrcode.min.js（僅 qr 分支）
- **純前端應用**：無需建置工具或後端

---

## 瀏覽器支援

- Chrome（推薦）
- Firefox
- Safari
- Edge
- 支援觸控裝置（手機、平板）

---

## 授權

本專案基於 Marzipano Tool 生成，遵循相關授權條款。

---

## 聯絡方式

- GitHub: [JensonLohTW](https://github.com/JensonLohTW)
- 專案連結: https://github.com/JensonLohTW/khhtravelweb

---

**最後更新**：2025-10-31
