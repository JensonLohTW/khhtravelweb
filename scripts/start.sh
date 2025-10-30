#!/bin/bash

# 360 度虛擬導覽應用程式 - 啟動腳本
# 此腳本會啟動本地 HTTP 伺服器以運行應用程式

set -e

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # 無顏色

# 配置
PORT=8000
APP_DIR="app-files"
PID_FILE=".server.pid"
LOG_FILE="logs/server.log"

# 印出訊息函數
print_info() {
    echo -e "${BLUE}[資訊]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[成功]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[警告]${NC} $1"
}

print_error() {
    echo -e "${RED}[錯誤]${NC} $1"
}

# 檢查是否在專案根目錄
if [ ! -d "$APP_DIR" ]; then
    print_error "找不到 $APP_DIR 目錄"
    print_error "請確保在專案根目錄執行此腳本"
    exit 1
fi

# 建立 logs 目錄
mkdir -p logs

# 檢查埠號是否已被使用
check_port() {
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        print_warning "埠號 $PORT 已被使用"
        local pid=$(lsof -Pi :$PORT -sTCP:LISTEN -t)
        print_info "正在使用埠號 $PORT 的進程 PID: $pid"

        # 檢查是否是我們的伺服器
        if [ -f "$PID_FILE" ]; then
            local saved_pid=$(cat "$PID_FILE")
            if [ "$pid" == "$saved_pid" ]; then
                print_warning "應用程式已經在運行中"
                print_info "訪問 URL: http://localhost:$PORT/$APP_DIR/index.html"
                exit 0
            fi
        fi

        read -p "是否要終止該進程並繼續？(y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_info "正在終止進程 $pid..."
            kill $pid 2>/dev/null || true
            sleep 2
        else
            print_error "啟動已取消"
            exit 1
        fi
    fi
}

# 檢查 Python 是否可用
check_python() {
    if command -v python3 &> /dev/null; then
        PYTHON_CMD="python3"
        return 0
    elif command -v python &> /dev/null; then
        PYTHON_CMD="python"
        return 0
    else
        return 1
    fi
}

# 檢查 Node.js 是否可用
check_node() {
    if command -v npx &> /dev/null; then
        return 0
    else
        return 1
    fi
}

# 使用 Python 啟動伺服器
start_with_python() {
    print_info "使用 Python HTTP 伺服器啟動..."
    print_info "命令: $PYTHON_CMD -m http.server $PORT"

    # 啟動伺服器並將輸出重定向到日誌
    nohup $PYTHON_CMD -m http.server $PORT > "$LOG_FILE" 2>&1 &
    local pid=$!

    # 儲存 PID
    echo $pid > "$PID_FILE"

    # 等待伺服器啟動
    sleep 2

    # 檢查進程是否仍在運行
    if ps -p $pid > /dev/null 2>&1; then
        print_success "伺服器已成功啟動！"
        print_info "PID: $pid"
        print_info "埠號: $PORT"
        print_info "日誌文件: $LOG_FILE"
        echo ""
        print_success "訪問應用程式："
        echo -e "${GREEN}  http://localhost:$PORT/$APP_DIR/index.html${NC}"
        echo ""
        print_info "使用以下命令查看日誌："
        echo "  tail -f $LOG_FILE"
        echo ""
        print_info "使用以下命令停止伺服器："
        echo "  ./scripts/stop.sh"
        return 0
    else
        print_error "伺服器啟動失敗"
        rm -f "$PID_FILE"
        return 1
    fi
}

# 使用 Node.js 啟動伺服器
start_with_node() {
    print_info "使用 Node.js http-server 啟動..."
    print_info "命令: npx http-server -p $PORT"

    # 啟動伺服器並將輸出重定向到日誌
    nohup npx http-server -p $PORT > "$LOG_FILE" 2>&1 &
    local pid=$!

    # 儲存 PID
    echo $pid > "$PID_FILE"

    # 等待伺服器啟動
    sleep 3

    # 檢查進程是否仍在運行
    if ps -p $pid > /dev/null 2>&1; then
        print_success "伺服器已成功啟動！"
        print_info "PID: $pid"
        print_info "埠號: $PORT"
        print_info "日誌文件: $LOG_FILE"
        echo ""
        print_success "訪問應用程式："
        echo -e "${GREEN}  http://localhost:$PORT/$APP_DIR/index.html${NC}"
        echo ""
        print_info "使用以下命令查看日誌："
        echo "  tail -f $LOG_FILE"
        echo ""
        print_info "使用以下命令停止伺服器："
        echo "  ./scripts/stop.sh"
        return 0
    else
        print_error "伺服器啟動失敗"
        rm -f "$PID_FILE"
        return 1
    fi
}

# 主函數
main() {
    echo ""
    print_info "======================================"
    print_info "  360 度虛擬導覽 - 啟動腳本"
    print_info "======================================"
    echo ""

    # 檢查埠號
    check_port

    # 嘗試啟動伺服器
    if check_python; then
        start_with_python
    elif check_node; then
        start_with_node
    else
        print_error "找不到 Python 或 Node.js"
        print_error "請安裝以下其中一種："
        echo "  - Python 3: https://www.python.org/downloads/"
        echo "  - Node.js: https://nodejs.org/"
        exit 1
    fi
}

# 執行主函數
main
