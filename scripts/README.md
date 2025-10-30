# 腳本使用說明

這個目錄包含用於管理 360 度虛擬導覽應用程式的實用腳本。

## 可用腳本

### start.sh - 啟動腳本

一鍵啟動本地開發伺服器。

**使用方法**：

```bash
./scripts/start.sh
```

**功能**：

- 自動檢測並使用 Python 或 Node.js 啟動 HTTP 伺服器
- 檢查埠號 8000 是否可用
- 如果埠號被占用，提示用戶選擇終止現有進程
- 在背景運行伺服器
- 將進程 ID 儲存到 `.server.pid` 文件
- 將伺服器日誌輸出到 `logs/server.log`
- 顯示訪問 URL 和有用的命令提示

**輸出範例**：

```
[資訊] ======================================
[資訊]   360 度虛擬導覽 - 啟動腳本
[資訊] ======================================

[資訊] 使用 Python HTTP 伺服器啟動...
[資訊] 命令: python3 -m http.server 8000
[成功] 伺服器已成功啟動！
[資訊] PID: 12345
[資訊] 埠號: 8000
[資訊] 日誌文件: logs/server.log

[成功] 訪問應用程式：
  http://localhost:8000/app-files/index.html

[資訊] 使用以下命令查看日誌：
  tail -f logs/server.log

[資訊] 使用以下命令停止伺服器：
  ./scripts/stop.sh
```

**依賴**：

- Python 3（優先）或 Node.js
- macOS 或 Linux 系統

---

### stop.sh - 關閉腳本

停止運行中的開發伺服器。

**使用方法**：

```bash
./scripts/stop.sh
```

**功能**：

- 從 `.server.pid` 文件讀取進程 ID
- 優雅地終止伺服器進程
- 如果優雅終止失敗，強制終止進程
- 清理 PID 文件
- 可選擇性地清理日誌文件
- 顯示埠號狀態
- 如果找不到 PID 文件，嘗試查找使用埠號 8000 的進程

**輸出範例**：

```
[資訊] ======================================
[資訊]   360 度虛擬導覽 - 關閉腳本
[資訊] ======================================

[資訊] 找到 PID 文件，進程 ID: 12345
[資訊] 正在停止伺服器（PID: 12345）...
[成功] 伺服器已成功停止

是否要清理日誌文件？(y/N) n

[資訊] 檢查埠號 8000 的狀態...
[成功] 埠號 8000 目前未被使用

[成功] 操作完成
```

---

## 常見問題

### 埠號 8000 已被使用

如果啟動腳本報告埠號已被使用：

1. 檢查是否有其他應用程式使用該埠號：
   ```bash
   lsof -Pi :8000 -sTCP:LISTEN
   ```

2. 終止使用該埠號的進程：
   ```bash
   lsof -Pi :8000 -sTCP:LISTEN -t | xargs kill
   ```

3. 或者修改 `start.sh` 中的 `PORT` 變數使用不同的埠號

### 找不到 Python 或 Node.js

啟動腳本需要 Python 3 或 Node.js。

**安裝 Python**：

```bash
# macOS (使用 Homebrew)
brew install python3

# 或從官方網站下載
# https://www.python.org/downloads/
```

**安裝 Node.js**：

```bash
# macOS (使用 Homebrew)
brew install node

# 或從官方網站下載
# https://nodejs.org/
```

### 權限錯誤

如果遇到權限錯誤，確保腳本有執行權限：

```bash
chmod +x scripts/start.sh scripts/stop.sh
```

### 伺服器無法停止

如果 `stop.sh` 無法停止伺服器，可以手動終止：

```bash
# 查找進程 ID
ps aux | grep "http.server\|http-server"

# 終止進程（替換 PID 為實際的進程 ID）
kill PID

# 或強制終止
kill -9 PID
```

---

## 查看日誌

伺服器日誌儲存在 `logs/server.log`。

**即時查看日誌**：

```bash
tail -f logs/server.log
```

**查看最後 50 行**：

```bash
tail -n 50 logs/server.log
```

**清空日誌**：

```bash
> logs/server.log
```

---

## 配置

可以在腳本頂部修改以下配置：

### start.sh

```bash
PORT=8000           # 伺服器埠號
APP_DIR="app-files" # 應用程式目錄
PID_FILE=".server.pid"  # PID 文件位置
LOG_FILE="logs/server.log"  # 日誌文件位置
```

### stop.sh

```bash
PORT=8000           # 伺服器埠號（應與 start.sh 一致）
PID_FILE=".server.pid"  # PID 文件位置
LOG_FILE="logs/server.log"  # 日誌文件位置
```

---

## 注意事項

1. **在專案根目錄執行**：所有腳本都應該從專案根目錄執行
2. **背景運行**：伺服器會在背景運行，關閉終端不會停止伺服器
3. **PID 文件**：`.server.pid` 文件用於追蹤伺服器進程，不要手動刪除
4. **埠號衝突**：確保埠號 8000 未被其他應用程式使用
5. **日誌輪替**：長時間運行可能產生大量日誌，建議定期清理

---

## 進階使用

### 同時運行多個實例

如果需要在不同埠號運行多個實例：

1. 複製腳本並重命名
2. 修改 `PORT` 變數為不同的值
3. 修改 `PID_FILE` 為不同的名稱

### 整合到開發工作流程

可以將這些腳本整合到 IDE 或編輯器中：

**VS Code tasks.json**：

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "啟動伺服器",
      "type": "shell",
      "command": "./scripts/start.sh",
      "problemMatcher": []
    },
    {
      "label": "停止伺服器",
      "type": "shell",
      "command": "./scripts/stop.sh",
      "problemMatcher": []
    }
  ]
}
```

---

## 疑難排解

如果遇到問題：

1. **檢查腳本權限**：`ls -la scripts/`
2. **檢查 Python/Node.js 是否安裝**：`python3 --version` 或 `node --version`
3. **檢查埠號狀態**：`lsof -Pi :8000`
4. **查看日誌**：`cat logs/server.log`
5. **檢查進程**：`ps aux | grep "http.server\|http-server"`

---

## 支援

如有問題或建議，請參考專案的 AGENTS.md 或 CLAUDE.md 文件。
