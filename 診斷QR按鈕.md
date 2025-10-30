# QR 按鈕顯示問題診斷指南

## 快速檢查步驟

### 第 1 步：強制刷新頁面（最重要！）

1. 打開頁面：http://localhost:8000/app-files/index.html
2. **務必使用硬性重新整理**清除緩存：
   - **Mac**: 按住 `Cmd + Shift + R`
   - **Windows/Linux**: 按住 `Ctrl + Shift + R`
   - **或**：打開開發者工具 (F12)，右鍵點擊刷新按鈕，選擇「清空快取並強制重新整理」

### 第 2 步：檢查開發者工具

1. 按 `F12` 打開開發者工具
2. 切換到 **Console** 標籤
3. 查看是否有紅色錯誤訊息

### 第 3 步：手動檢查按鈕

在 Console 中執行以下命令：

```javascript
// 檢查按鈕是否存在
document.getElementById('qrToggle')
```

如果返回 `null`，說明按鈕元素不存在。
如果返回 `<button id="qrToggle">...</button>`，說明按鈕存在。

### 第 4 步：檢查按鈕樣式

在 Console 中執行：

```javascript
// 獲取按鈕的計算樣式
var btn = document.getElementById('qrToggle');
if (btn) {
  var styles = window.getComputedStyle(btn);
  console.table({
    'Display': styles.display,
    'Visibility': styles.visibility,
    'Position': styles.position,
    'Top': styles.top,
    'Right': styles.right,
    'Width': styles.width,
    'Height': styles.height,
    'Z-index': styles.zIndex,
    'Opacity': styles.opacity,
    'Background': styles.backgroundColor
  });
} else {
  console.error('按鈕不存在！');
}
```

### 第 5 步：強制顯示按鈕

如果按鈕存在但不可見，在 Console 執行：

```javascript
// 強制顯示按鈕
var btn = document.getElementById('qrToggle');
if (btn) {
  btn.style.cssText = `
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
    position: absolute !important;
    top: 0 !important;
    right: 80px !important;
    width: 40px !important;
    height: 40px !important;
    background-color: rgba(103,115,131,0.85) !important;
    color: #ffffff !important;
    border: none !important;
    z-index: 9999 !important;
    font-size: 14px !important;
    font-weight: bold !important;
    cursor: pointer !important;
  `;
  console.log('✅ 已強制顯示按鈕，請檢查頁面右上角');
} else {
  console.error('❌ 按鈕元素不存在');
}
```

## 可能的問題和解決方案

### 問題 1：瀏覽器緩存
**症狀**：CSS 修改沒有生效
**解決**：使用 Cmd+Shift+R (Mac) 或 Ctrl+Shift+R (Windows) 強制刷新

### 問題 2：CSS 文件未載入
**症狀**：Console 中有 404 錯誤
**解決**：檢查 Network 標籤，確認 style.css 載入成功（狀態碼 200）

### 問題 3：JavaScript 錯誤
**症狀**：Console 中有紅色錯誤訊息
**解決**：查看錯誤詳情並報告

### 問題 4：按鈕被遮擋
**症狀**：按鈕存在但看不到
**解決**：使用第 5 步的腳本強制提高 z-index

## 檢查 CSS 文件版本

在 Console 執行：

```javascript
// 檢查 style.css 的載入時間
fetch('/app-files/style.css', {cache: 'reload'})
  .then(r => r.text())
  .then(css => {
    if (css.includes('right: 80px')) {
      console.log('✅ CSS 已更新（包含 right: 80px）');
    } else {
      console.log('❌ CSS 未更新或使用了舊版本');
    }
    if (css.includes('#qrToggle')) {
      console.log('✅ CSS 包含 #qrToggle 規則');
    } else {
      console.log('❌ CSS 不包含 #qrToggle 規則');
    }
  });
```

## 終極測試

如果以上都無效，執行完整診斷：

```javascript
(function() {
  console.log('===== QR 按鈕完整診斷 =====\n');
  
  // 1. 檢查 HTML
  var btn = document.getElementById('qrToggle');
  console.log('1. HTML 元素:', btn ? '✅ 存在' : '❌ 不存在');
  if (!btn) return;
  
  // 2. 檢查樣式
  var styles = window.getComputedStyle(btn);
  console.log('2. 關鍵樣式:');
  console.log('   - display:', styles.display);
  console.log('   - visibility:', styles.visibility);
  console.log('   - opacity:', styles.opacity);
  console.log('   - position:', styles.position);
  console.log('   - right:', styles.right);
  
  // 3. 檢查位置
  var rect = btn.getBoundingClientRect();
  console.log('3. 位置信息:');
  console.log('   - 距離右側:', window.innerWidth - rect.right, 'px');
  console.log('   - 距離頂部:', rect.top, 'px');
  console.log('   - 是否在視窗內:', rect.right > 0 && rect.left < window.innerWidth);
  
  // 4. 檢查遮擋
  var topElement = document.elementFromPoint(rect.left + rect.width/2, rect.top + rect.height/2);
  console.log('4. 頂層元素:', topElement === btn ? '✅ 是按鈕本身' : '⚠️  被遮擋: ' + (topElement?.id || topElement?.tagName));
  
  // 5. 檢查 CSS 載入
  var styleSheets = Array.from(document.styleSheets);
  var hasQrStyle = false;
  try {
    styleSheets.forEach(sheet => {
      try {
        var rules = Array.from(sheet.cssRules || []);
        rules.forEach(rule => {
          if (rule.selectorText && rule.selectorText.includes('qrToggle')) {
            hasQrStyle = true;
            console.log('5. 找到 CSS 規則:', rule.cssText.substring(0, 100));
          }
        });
      } catch(e) {}
    });
  } catch(e) {}
  console.log('5. CSS 規則:', hasQrStyle ? '✅ 已載入' : '❌ 未找到');
  
  console.log('\n===== 診斷完成 =====');
})();
```

## 需要幫助？

請提供以下信息：
1. 強制刷新後按鈕是否出現？
2. Console 中是否有錯誤？
3. 執行診斷腳本的完整輸出（截圖或複製文字）
4. 使用的瀏覽器和版本

---

**最後更新**: 2025-10-30
