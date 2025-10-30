// QR 按鈕診斷腳本
// 在瀏覽器 Console 中執行此腳本

(function() {
  console.log('===== QR 按鈕診斷開始 =====');
  
  // 1. 檢查按鈕元素
  var btn = document.getElementById('qrToggle');
  console.log('1. 按鈕元素是否存在:', btn !== null);
  
  if (!btn) {
    console.error('❌ 按鈕元素不存在！檢查 HTML 是否正確載入。');
    return;
  }
  
  // 2. 檢查計算樣式
  var styles = window.getComputedStyle(btn);
  console.log('2. 按鈕樣式：');
  console.log('   - display:', styles.display);
  console.log('   - visibility:', styles.visibility);
  console.log('   - position:', styles.position);
  console.log('   - top:', styles.top);
  console.log('   - right:', styles.right);
  console.log('   - width:', styles.width);
  console.log('   - height:', styles.height);
  console.log('   - z-index:', styles.zIndex);
  console.log('   - opacity:', styles.opacity);
  
  // 3. 檢查是否被遮擋
  var rect = btn.getBoundingClientRect();
  console.log('3. 按鈕位置：');
  console.log('   - top:', rect.top, 'px');
  console.log('   - right:', window.innerWidth - rect.right, 'px (from right edge)');
  console.log('   - width:', rect.width, 'px');
  console.log('   - height:', rect.height, 'px');
  console.log('   - 是否在視窗內:', rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth);
  
  // 4. 檢查遮擋元素
  var elementAtPosition = document.elementFromPoint(rect.left + rect.width/2, rect.top + rect.height/2);
  console.log('4. 按鈕中心點的頂層元素:', elementAtPosition);
  console.log('   - 是否就是按鈕本身:', elementAtPosition === btn);
  if (elementAtPosition !== btn) {
    console.warn('⚠️  按鈕被其他元素遮擋:', elementAtPosition);
  }
  
  // 5. 檢查 QrUi 模組
  console.log('5. JavaScript 模組：');
  console.log('   - MarzipanoApp:', typeof window.MarzipanoApp);
  console.log('   - QrService:', typeof window.MarzipanoApp?.QrService);
  console.log('   - QrUi:', typeof window.MarzipanoApp?.QrUi);
  console.log('   - qr-enabled class:', document.body.classList.contains('qr-enabled'));
  
  // 6. 檢查事件監聽器
  var listeners = getEventListeners(btn);
  console.log('6. 按鈕事件監聽器:', listeners);
  
  // 7. 嘗試顯示按鈕（如果隱藏）
  if (styles.display === 'none' || styles.visibility === 'hidden' || styles.opacity === '0') {
    console.log('7. 嘗試強制顯示按鈕...');
    btn.style.display = 'block';
    btn.style.visibility = 'visible';
    btn.style.opacity = '1';
    console.log('   ✓ 已強制顯示按鈕，請檢查頁面');
  } else {
    console.log('7. 按鈕樣式正常，應該是可見的');
  }
  
  console.log('===== 診斷完成 =====');
  console.log('\n如果按鈕仍然不可見，請截圖 Console 輸出並提供給開發者。');
})();
