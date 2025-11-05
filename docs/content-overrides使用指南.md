# 📝 Content Overrides 使用指南

## 🎯 概述

`content-overrides.json` 是一個強大的配置系統，允許你在**不修改源代碼**的情況下，覆蓋場景名稱、描述和熱點內容。這對於多語言版本、客戶定制版本或內容更新非常有用。

## 📁 文件位置

```
app-files/
└── config/
    └── content-overrides.json
```

## 🔧 配置格式

### 基本結構

```json
{
  "version": 1,
  "scenes": {
    "場景ID": {
      "name": "場景名稱",
      "description": "場景描述"
    }
  },
  "hotspots": {
    "場景ID": {
      "infoHotspots": [
        {
          "index": 0,
          "title": "熱點標題",
          "text": "熱點內容"
        }
      ],
      "linkHotspots": [
        {
          "target": "目標場景ID",
          "label": "連結標籤",
          "body": "連結描述"
        }
      ]
    }
  }
}
```

### 完整範例

```json
{
  "version": 1,
  "scenes": {
    "0-1-7": {
      "name": "大廳入口",
      "description": "飯店主要入口和接待區域"
    },
    "1-1f-12": {
      "name": "一樓展示區"
    }
  },
  "hotspots": {
    "0-1-7": {
      "infoHotspots": [
        {
          "index": 0,
          "title": "歡迎光臨",
          "text": "這是飯店的主要入口，24小時開放。"
        },
        {
          "index": 1,
          "title": "服務台",
          "text": "需要幫助嗎？我們的服務人員隨時為您服務。"
        }
      ],
      "linkHotspots": [
        {
          "target": "1-1f-12",
          "label": "前往展示區",
          "body": "點擊前往一樓展示區域"
        }
      ]
    }
  }
}
```

## 📖 配置說明

### 1. 場景覆寫 (scenes)

用於修改場景的顯示名稱和描述。

**格式：**
```json
"scenes": {
  "場景ID": {
    "name": "新的場景名稱",         // 可選：覆蓋場景名稱
    "description": "場景的詳細描述"  // 可選：添加或覆蓋描述
  }
}
```

**注意事項：**
- 場景ID 必須與 `data.js` 中定義的完全一致
- `name` 和 `description` 都是可選的，可以只覆蓋其中一個
- 如果只需要修改名稱，可以省略 `description`

### 2. 信息熱點覆寫 (infoHotspots)

用於修改信息熱點的標題和內容。

**格式：**
```json
"infoHotspots": [
  {
    "index": 0,              // 必填：熱點索引（從0開始）
    "title": "新標題",       // 可選：覆蓋標題
    "text": "新的詳細內容"   // 可選：覆蓋內容
  }
]
```

**匹配規則：**
- 使用 `index` 來匹配 `data.js` 中的熱點順序
- 第一個 infoHotspot 的 index 為 0，第二個為 1，依此類推
- 支持 HTML 標籤，例如：`<p>段落</p>`、`<strong>粗體</strong>`

### 3. 連結熱點覆寫 (linkHotspots)

用於修改連結熱點的標籤和描述。

**格式：**
```json
"linkHotspots": [
  {
    "target": "目標場景ID",  // 必填：用於匹配熱點
    "label": "新標籤",       // 可選：覆蓋工具提示標籤
    "body": "新描述"         // 可選：覆蓋詳細描述
  }
]
```

**匹配規則：**
- 使用 `target` (目標場景ID) 來匹配熱點
- 如果一個場景有多個指向同一目標的熱點，它們都會被覆蓋
- `label` 對應工具提示中顯示的簡短文字
- `body` 對應詳細描述（如果有的話）

## 🚀 使用流程

### 步驟 1：獲取場景ID和熱點索引

#### 方法 A：查看 data.js 文件

打開 `app-files/data.js`，找到對應的場景定義：

```javascript
{
  "id": "0-1-7",  // 這是場景ID
  "name": "1-7",
  "infoHotspots": [
    {
      "yaw": 0.5,
      "pitch": 0.2,
      "title": "標題",  // 第 0 個 infoHotspot
      "text": "內容"
    },
    {
      "yaw": 1.0,
      "pitch": 0.3,
      "title": "標題2", // 第 1 個 infoHotspot
      "text": "內容2"
    }
  ],
  "linkHotspots": [
    {
      "yaw": 2.0,
      "pitch": 0.1,
      "target": "1-1f-12"  // 連結到場景 1-1f-12
    }
  ]
}
```

#### 方法 B：使用開發者工具（開發模式）

1. 打開應用（確保在開發模式）
2. 按 F12 打開開發者控制台
3. 執行以下命令：

```javascript
// 查看所有場景
console.log(window.APP_DATA.scenes.map(s => ({
  id: s.id,
  name: s.name,
  infoCount: s.infoHotspots.length,
  linkCount: s.linkHotspots.length
})));

// 查看特定場景的詳細信息
var scene = window.APP_DATA.scenes.find(s => s.id === '0-1-7');
console.log('場景:', scene.name);
console.log('信息熱點:', scene.infoHotspots);
console.log('連結熱點:', scene.linkHotspots);
```

### 步驟 2：編輯配置文件

打開 `app-files/config/content-overrides.json`，按照上面的格式添加或修改配置。

**重要：確保 JSON 格式正確！**
- 使用雙引號 `"` 不是單引號 `'`
- 最後一項後面不要有逗號
- 使用 JSON 驗證工具檢查語法

### 步驟 3：驗證修改

#### 開發模式（推薦）

1. **刷新頁面**（開發模式會自動繞過緩存）
   - Windows: `Ctrl + F5` 或 `F5`
   - Mac: `Cmd + R`

2. **查看控制台日誌**
   ```
   [ConfigLoader] 🔄 使用緩存破壞機制載入配置
   [ConfigLoader] ✅ 配置載入成功
   [ConfigLoader] 📊 配置版本: 1
   [ConfigLoader] 🎬 場景覆寫數量: 2
   [ConfigLoader] 📍 熱點覆寫數量: 1
   ```

3. **使用調試工具重新載入**
   ```javascript
   // 在控制台執行
   __reloadConfig();

   // 或查看配置狀態
   __configStatus();
   ```

#### 生產模式

1. **強制刷新頁面**
   - Windows: `Ctrl + Shift + R` 或 `Ctrl + F5`
   - Mac: `Cmd + Shift + R`

2. **或清除瀏覽器緩存**
   - Chrome: `Ctrl/Cmd + Shift + Delete`
   - 選擇「圖片和文件」
   - 點擊「清除數據」

3. **驗證修改已應用**
   - 檢查場景列表中的名稱
   - 點擊熱點查看內容是否更新

## 🔍 問題排查

### 問題 1：修改沒有生效

**可能原因和解決方案：**

1. **瀏覽器緩存（最常見）**
   - ✅ 解決：強制刷新 `Ctrl/Cmd + Shift + R`
   - ✅ 或：清除瀏覽器緩存

2. **JSON 語法錯誤**
   - ✅ 檢查：打開 F12 控制台查看錯誤訊息
   - ✅ 驗證：使用 [JSONLint](https://jsonlint.com/) 驗證 JSON
   - ✅ 常見錯誤：
     - 最後一項後面有多餘逗號
     - 使用了單引號 `'` 而非雙引號 `"`
     - 括號不匹配

3. **場景ID不匹配**
   - ✅ 檢查：場景ID必須與 `data.js` 完全一致（區分大小寫）
   - ✅ 驗證：在控制台執行
     ```javascript
     console.log(window.APP_DATA.scenes.map(s => s.id));
     ```

4. **熱點索引錯誤**
   - ✅ 檢查：索引從 0 開始計數
   - ✅ 驗證：查看 `data.js` 中熱點的順序

### 問題 2：配置文件沒有載入

**檢查步驟：**

1. **驗證文件路徑**
   ```
   app-files/config/content-overrides.json  ✅ 正確
   app-files/content-overrides.json         ❌ 錯誤
   config/content-overrides.json            ❌ 錯誤
   ```

2. **檢查 Network 請求**
   - F12 → Network 標籤
   - 刷新頁面
   - 搜索 `content-overrides.json`
   - 查看狀態碼：
     - `200 OK` ✅ 成功載入
     - `304 Not Modified` ⚠️ 使用緩存
     - `404 Not Found` ❌ 文件不存在

3. **查看控制台日誌**
   ```javascript
   // 應該看到類似的日誌
   [ConfigLoader] 📄 載入配置文件: config/content-overrides.json
   [ConfigLoader] ✅ 配置載入成功

   // 如果失敗會顯示
   [ConfigLoader] ❌ 載入失敗 (HTTP 404)
   ```

### 問題 3：只有部分內容生效

**可能原因：**

1. **配置優先級**
   - 場景名稱可能被 localStorage 覆蓋（開發模式）
   - 檢查：Application → Local Storage → 查看是否有覆蓋值

2. **部分語法錯誤**
   - JSON 部分格式錯誤可能導致某些配置被忽略
   - 查看控制台是否有警告訊息

3. **匹配規則問題**
   - infoHotspots 使用 `index` 匹配
   - linkHotspots 使用 `target` 匹配
   - 確保匹配鍵正確

## 🛠️ 開發工具

### 快速調試命令（開發模式）

在瀏覽器控制台中執行：

```javascript
// 1. 重新載入配置（強制刷新）
__reloadConfig();

// 2. 查看配置狀態
__configStatus();

// 3. 查看當前應用的配置
window.MarzipanoApp.ConfigLoader.loadContentOverrides().then(console.log);

// 4. 查看所有場景ID
console.log('所有場景ID:', window.APP_DATA.scenes.map(s => s.id));

// 5. 查看特定場景的熱點
var sceneId = '0-1-7';
var scene = window.APP_DATA.scenes.find(s => s.id === sceneId);
console.log('場景:', scene.name);
console.table(scene.infoHotspots);
console.table(scene.linkHotspots);

// 6. 匯出當前所有場景名稱（用於創建配置模板）
var template = {
  version: 1,
  scenes: {},
  hotspots: {}
};
window.APP_DATA.scenes.forEach(s => {
  template.scenes[s.id] = { name: s.name };
});
console.log(JSON.stringify(template, null, 2));
```

### 配置模板生成器

使用開發模式的匯出功能：

1. 打開應用（開發模式）
2. 點擊場景列表頂部的「匯出設定」按鈕
3. 系統會生成包含所有場景的配置模板
4. 複製到 `content-overrides.json` 後修改

## 💡 最佳實踐

### 1. 版本管理

```json
{
  "version": 1,  // 每次重大修改時遞增版本號
  "scenes": { ... }
}
```

**建議：**
- 使用 Git 追蹤配置變更
- 為不同版本創建備份
- 在註釋中記錄修改日期和原因（JSON 不支持註釋，可在文檔中記錄）

### 2. 逐步測試

1. 先修改一個場景
2. 驗證生效
3. 再繼續修改其他場景

避免一次性修改太多內容，難以定位問題。

### 3. 保持備份

修改前先備份原文件：
```bash
cp app-files/config/content-overrides.json app-files/config/content-overrides.json.backup
```

### 4. 使用 JSON 編輯器

推薦工具：
- [VS Code](https://code.visualstudio.com/) - 自動格式化和語法檢查
- [JSONLint](https://jsonlint.com/) - 在線驗證
- [JSON Editor Online](https://jsoneditoronline.org/) - 視覺化編輯

### 5. 文檔化自定義內容

創建一個單獨的 `CUSTOMIZATIONS.md` 文檔，記錄：
- 修改了哪些場景
- 修改原因
- 修改日期
- 修改者

## 📚 進階應用

### 多語言支持

為不同語言創建不同的配置文件：

```
app-files/config/
├── content-overrides.json        # 默認（中文）
├── content-overrides.en.json     # 英文版
├── content-overrides.ja.json     # 日文版
└── content-overrides.ko.json     # 韓文版
```

在應用初始化時根據語言選擇：

```javascript
var language = navigator.language.split('-')[0];  // 'zh', 'en', 'ja', 'ko'
var configFile = 'config/content-overrides' + (language === 'zh' ? '' : '.' + language) + '.json';
```

### 客戶定制版本

為不同客戶創建專屬配置：

```
app-files/config/
├── content-overrides.json             # 默認版本
├── content-overrides.客戶A.json
└── content-overrides.客戶B.json
```

### A/B 測試

創建不同版本的文案進行測試：

```json
{
  "version": 1,
  "scenes": {
    "0-1-7": {
      "name": "歡迎來到我們的飯店",  // 版本A：正式
      // "name": "嗨！歡迎光臨",     // 版本B：親切
      "description": "五星級服務等著您"
    }
  }
}
```

## 🔗 相關文檔

- [部署指南](./部署指南.md) - 生產環境部署說明
- [CLAUDE.md](../CLAUDE.md) - 項目整體架構
- [data.js](../app-files/data.js) - 場景和熱點的源數據定義

## 📞 技術支援

如遇到問題：

1. **查看控制台日誌**：F12 → Console
2. **檢查 Network 請求**：F12 → Network → 搜索 `content-overrides.json`
3. **使用調試工具**：執行 `__reloadConfig()` 和 `__configStatus()`
4. **驗證 JSON 語法**：使用 JSONLint
5. **清除緩存重試**：Ctrl/Cmd + Shift + R

---

**最後更新：** 2025-01-05
**版本：** 2.0.0
**狀態：** 包含自動緩存破壞和調試工具
