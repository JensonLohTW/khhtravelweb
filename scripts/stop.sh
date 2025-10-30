#!/bin/bash

# 360 度虛擬導覽應用程式 - 關閉腳本
# 此腳本會停止運行中的 HTTP 伺服器

set -e

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # 無顏色

# 配置
PORT=8000
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

# 停止伺服器
stop_server() {
    local success=0

    # 嘗試從 PID 文件讀取
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        print_info "找到 PID 文件，進程 ID: $pid"

        # 檢查進程是否存在
        if ps -p $pid > /dev/null 2>&1; then
            print_info "正在停止伺服器（PID: $pid）..."
            kill $pid 2>/dev/null || true
            sleep 1

            # 檢查進程是否已停止
            if ps -p $pid > /dev/null 2>&1; then
                print_warning "進程未停止，嘗試強制終止..."
                kill -9 $pid 2>/dev/null || true
                sleep 1
            fi

            # 再次檢查
            if ! ps -p $pid > /dev/null 2>&1; then
                print_success "伺服器已成功停止"
                success=1
            else
                print_error "無法停止伺服器進程"
            fi
        else
            print_warning "PID 文件中的進程不存在（可能已停止）"
            success=1
        fi

        # 刪除 PID 文件
        rm -f "$PID_FILE"
    fi

    # 如果沒有 PID 文件，嘗試查找運行在指定埠號的進程
    if [ $success -eq 0 ]; then
        print_info "查找運行在埠號 $PORT 的進程..."
        local port_pid=$(lsof -Pi :$PORT -sTCP:LISTEN -t 2>/dev/null)

        if [ -n "$port_pid" ]; then
            print_info "找到進程 PID: $port_pid"
            print_info "正在停止伺服器..."
            kill $port_pid 2>/dev/null || true
            sleep 1

            # 檢查進程是否已停止
            if ps -p $port_pid > /dev/null 2>&1; then
                print_warning "進程未停止，嘗試強制終止..."
                kill -9 $port_pid 2>/dev/null || true
                sleep 1
            fi

            # 再次檢查
            if ! ps -p $port_pid > /dev/null 2>&1; then
                print_success "伺服器已成功停止"
                success=1
            else
                print_error "無法停止伺服器進程"
            fi
        fi
    fi

    # 如果找不到運行中的伺服器
    if [ $success -eq 0 ]; then
        print_warning "找不到運行中的伺服器"
        print_info "可能的原因："
        echo "  1. 伺服器未啟動"
        echo "  2. 伺服器使用不同的埠號運行"
        echo "  3. 伺服器已經停止"
        return 1
    fi

    return 0
}

# 清理日誌文件（可選）
cleanup_logs() {
    if [ -f "$LOG_FILE" ]; then
        read -p "是否要清理日誌文件？(y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_info "清理日誌文件..."
            > "$LOG_FILE"
            print_success "日誌文件已清理"
        fi
    fi
}

# 顯示狀態
show_status() {
    echo ""
    print_info "檢查埠號 $PORT 的狀態..."

    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        local pid=$(lsof -Pi :$PORT -sTCP:LISTEN -t)
        print_warning "警告：埠號 $PORT 仍然被使用"
        print_info "進程 PID: $pid"

        # 顯示進程信息
        print_info "進程信息："
        ps -p $pid -o pid,command 2>/dev/null | tail -n +2 | sed 's/^/  /'
    else
        print_success "埠號 $PORT 目前未被使用"
    fi
}

# 主函數
main() {
    echo ""
    print_info "======================================"
    print_info "  360 度虛擬導覽 - 關閉腳本"
    print_info "======================================"
    echo ""

    # 停止伺服器
    if stop_server; then
        echo ""

        # 清理日誌（可選）
        cleanup_logs

        # 顯示最終狀態
        show_status

        echo ""
        print_success "操作完成"
    else
        echo ""
        print_info "提示：如果需要手動終止進程，可以使用："
        echo "  lsof -Pi :$PORT -sTCP:LISTEN -t | xargs kill"
        echo ""
        exit 1
    fi
}

# 執行主函數
main
