/**
 * 媒體庫模組 (Media Gallery Module)
 *
 * 功能：
 * - 圖片和影片的瀏覽與切換
 * - 支援鍵盤導航（方向鍵、ESC）
 * - 圖片縮放功能
 * - 影片播放控制
 * - 響應式設計支援
 *
 * 依賴：APP_DATA.mediaGallery
 */

(function() {
  'use strict';

  let appData = null;

  // DOM 元素引用
  let modal = null;
  let backdrop = null;
  let container = null;
  let closeBtn = null;
  let titleElement = null;
  let counter = null;
  let contentArea = null;
  let itemContainer = null;
  let prevBtn = null;
  let nextBtn = null;
  let zoomInBtn = null;
  let zoomOutBtn = null;
  let zoomResetBtn = null;
  let openBtn = null;

  function hideOpenButton() {
    if (!openBtn) {
      openBtn = document.getElementById('mediaGalleryBtn');
    }
    if (openBtn) {
      openBtn.style.display = 'none';
    }
  }

  // 狀態管理
  let currentIndex = 0;
  let mediaItems = [];
  let currentZoom = 1;
  let isOpen = false;

  // 縮放設定
  const ZOOM_STEP = 0.2;
  const ZOOM_MIN = 0.5;
  const ZOOM_MAX = 3;

  /**
   * 初始化媒體庫模組
   */
  function init() {
    // 詳細的除錯訊息
    console.log('[MediaGallery] 開始初始化...');
    console.log('[MediaGallery] APP_DATA 是否存在:', typeof window.APP_DATA !== 'undefined');

    // 檢查 APP_DATA 是否已載入
    if (typeof window.APP_DATA === 'undefined') {
      console.error('[MediaGallery] APP_DATA 未定義，請確認 data.js 已正確載入');
      hideOpenButton();
      return false;
    }

    appData = window.APP_DATA;
    console.log('[MediaGallery] APP_DATA.mediaGallery:', appData.mediaGallery);

    // 檢查是否啟用媒體庫功能
    if (!appData.mediaGallery) {
      hideOpenButton();
      console.warn('[MediaGallery] APP_DATA.mediaGallery 不存在，媒體庫功能已停用');
      return false;
    }

    if (!appData.mediaGallery.enabled) {
      hideOpenButton();
      console.warn('[MediaGallery] 功能未啟用 (enabled: false)');
      return false;
    }

    // 載入媒體項目
    mediaItems = appData.mediaGallery.items || [];

    if (mediaItems.length === 0) {
      hideOpenButton();
      console.warn('[MediaGallery] 媒體庫中沒有項目');
      return false;
    }

    // 獲取 DOM 元素
    if (!initDOMElements()) {
      console.warn('[MediaGallery] DOM 元素初始化失敗，無法啟用媒體庫');
      hideOpenButton();
      return false;
    }

    // 綁定事件
    bindEvents();

    console.log(`[MediaGallery] 初始化成功！共 ${mediaItems.length} 個媒體項目`);
    return true;
  }

  /**
   * 初始化 DOM 元素引用
   */
  function initDOMElements() {
    modal = document.getElementById('mediaGalleryModal');
    if (!modal) {
      console.warn('[MediaGallery] 找不到媒體庫模態框');
      return false;
    }
    backdrop = modal.querySelector('.media-gallery-backdrop');
    container = modal.querySelector('.media-gallery-container');
    closeBtn = modal.querySelector('.media-gallery-close');
    titleElement = modal.querySelector('.media-gallery-title');
    counter = modal.querySelector('.media-gallery-counter');
    contentArea = modal.querySelector('.media-gallery-content');
    itemContainer = modal.querySelector('.media-gallery-item');
    prevBtn = modal.querySelector('.media-gallery-prev');
    nextBtn = modal.querySelector('.media-gallery-next');
    zoomInBtn = modal.querySelector('.zoom-in');
    zoomOutBtn = modal.querySelector('.zoom-out');
    zoomResetBtn = modal.querySelector('.zoom-reset');
    openBtn = document.getElementById('mediaGalleryBtn');
    if (!openBtn) {
      console.warn('[MediaGallery] 找不到媒體庫開啟按鈕');
    }
    return true;
  }

  /**
   * 綁定所有事件監聽器
   */
  function bindEvents() {
    // 開啟按鈕
    if (openBtn) {
      openBtn.addEventListener('click', function(e) {
        e.preventDefault();
        openGallery(0);
      });
    }

    // 關閉按鈕
    if (closeBtn) {
      closeBtn.addEventListener('click', closeGallery);
    }

    // 點擊背景遮罩關閉
    if (backdrop) {
      backdrop.addEventListener('click', closeGallery);
    }

    // 導航按鈕
    if (prevBtn) {
      prevBtn.addEventListener('click', showPrevious);
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', showNext);
    }

    // 縮放按鈕
    if (zoomInBtn) {
      zoomInBtn.addEventListener('click', zoomIn);
    }
    if (zoomOutBtn) {
      zoomOutBtn.addEventListener('click', zoomOut);
    }
    if (zoomResetBtn) {
      zoomResetBtn.addEventListener('click', resetZoom);
    }

    // 鍵盤事件
    document.addEventListener('keydown', handleKeyboard);
  }

  /**
   * 開啟媒體庫
   * @param {number} startIndex - 起始索引
   */
  function openGallery(startIndex) {
    if (isOpen) return;

    currentIndex = startIndex || 0;
    isOpen = true;

    // 更新 ARIA 屬性
    modal.setAttribute('aria-hidden', 'false');
    if (openBtn) {
      openBtn.setAttribute('aria-expanded', 'true');
    }

    // 顯示媒體
    showMedia(currentIndex);

    // 聚焦到模態框
    modal.focus();

    console.log('媒體庫已開啟');
  }

  /**
   * 關閉媒體庫
   */
  function closeGallery() {
    if (!isOpen) return;

    isOpen = false;

    // 更新 ARIA 屬性
    modal.setAttribute('aria-hidden', 'true');
    if (openBtn) {
      openBtn.setAttribute('aria-expanded', 'false');
    }

    // 清空內容
    itemContainer.innerHTML = '';

    // 重置縮放
    resetZoom();

    // 停止所有影片播放
    stopAllVideos();

    // 返回焦點到開啟按鈕
    if (openBtn) {
      openBtn.focus();
    }

    console.log('媒體庫已關閉');
  }

  /**
   * 顯示指定索引的媒體
   * @param {number} index - 媒體索引
   */
  function showMedia(index) {
    if (index < 0 || index >= mediaItems.length) {
      console.error('無效的媒體索引:', index);
      return;
    }

    currentIndex = index;
    const item = mediaItems[index];

    // 停止所有影片
    stopAllVideos();

    // 清空容器
    itemContainer.innerHTML = '';

    // 重置縮放
    resetZoom();

    // 根據類型渲染媒體
    if (item.type === 'image') {
      renderImage(item);
    } else if (item.type === 'video') {
      renderVideo(item);
    }

    // 更新標題
    if (titleElement) {
      titleElement.textContent = item.title || `媒體 ${index + 1}`;
    }

    // 更新計數器
    updateCounter();

    // 更新導航按鈕狀態
    updateNavigationButtons();

    console.log(`顯示媒體 ${index + 1}/${mediaItems.length}: ${item.title || item.src}`);
  }

  /**
   * 渲染圖片
   * @param {Object} item - 媒體項目
   */
  function renderImage(item) {
    const img = document.createElement('img');
    img.src = item.src;
    img.alt = item.title || '圖片';
    img.draggable = false;

    // 載入錯誤處理
    img.onerror = function() {
      console.error('圖片載入失敗:', item.src);
      const errorMsg = document.createElement('div');
      errorMsg.style.cssText = 'color: var(--color-error); font-size: var(--font-size-lg); text-align: center;';
      errorMsg.textContent = '圖片載入失敗';
      itemContainer.innerHTML = '';
      itemContainer.appendChild(errorMsg);
    };

    // 載入成功
    img.onload = function() {
      console.log('圖片已載入:', item.src);
    };

    itemContainer.appendChild(img);

    // 圖片支援縮放
    enableZoomControls();
  }

  /**
   * 渲染影片
   * @param {Object} item - 媒體項目
   */
  function renderVideo(item) {
    const video = document.createElement('video');
    video.src = item.src;
    video.controls = true;
    video.autoplay = true;
    video.loop = false;

    // 如果有封面圖
    if (item.poster) {
      video.poster = item.poster;
    }

    // 載入錯誤處理
    video.onerror = function() {
      console.error('影片載入失敗:', item.src);
      const errorMsg = document.createElement('div');
      errorMsg.style.cssText = 'color: var(--color-error); font-size: var(--font-size-lg); text-align: center;';
      errorMsg.textContent = '影片載入失敗';
      itemContainer.innerHTML = '';
      itemContainer.appendChild(errorMsg);
    };

    itemContainer.appendChild(video);

    // 影片不支援縮放
    disableZoomControls();
  }

  /**
   * 顯示上一個媒體
   */
  function showPrevious() {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : mediaItems.length - 1;
    showMedia(newIndex);
  }

  /**
   * 顯示下一個媒體
   */
  function showNext() {
    const newIndex = currentIndex < mediaItems.length - 1 ? currentIndex + 1 : 0;
    showMedia(newIndex);
  }

  /**
   * 放大
   */
  function zoomIn() {
    if (currentZoom < ZOOM_MAX) {
      currentZoom = Math.min(currentZoom + ZOOM_STEP, ZOOM_MAX);
      applyZoom();
    }
  }

  /**
   * 縮小
   */
  function zoomOut() {
    if (currentZoom > ZOOM_MIN) {
      currentZoom = Math.max(currentZoom - ZOOM_STEP, ZOOM_MIN);
      applyZoom();
    }
  }

  /**
   * 重置縮放
   */
  function resetZoom() {
    currentZoom = 1;
    applyZoom();
  }

  /**
   * 套用縮放效果
   */
  function applyZoom() {
    if (itemContainer) {
      itemContainer.style.transform = `scale(${currentZoom})`;
    }
  }

  /**
   * 啟用縮放控制
   */
  function enableZoomControls() {
    if (zoomInBtn) zoomInBtn.disabled = false;
    if (zoomOutBtn) zoomOutBtn.disabled = false;
    if (zoomResetBtn) zoomResetBtn.disabled = false;
  }

  /**
   * 停用縮放控制（影片不支援縮放）
   */
  function disableZoomControls() {
    if (zoomInBtn) zoomInBtn.disabled = true;
    if (zoomOutBtn) zoomOutBtn.disabled = true;
    if (zoomResetBtn) zoomResetBtn.disabled = true;
  }

  /**
   * 更新計數器顯示
   */
  function updateCounter() {
    if (counter) {
      counter.textContent = `${currentIndex + 1} / ${mediaItems.length}`;
    }
  }

  /**
   * 更新導航按鈕狀態
   */
  function updateNavigationButtons() {
    // 循環模式下，所有按鈕始終啟用
    if (prevBtn) prevBtn.disabled = false;
    if (nextBtn) nextBtn.disabled = false;
  }

  /**
   * 停止所有影片播放
   */
  function stopAllVideos() {
    if (!modal) {
      return;
    }
    const videos = modal.querySelectorAll('video');
    videos.forEach(function(video) {
      video.pause();
      video.currentTime = 0;
    });
  }

  /**
   * 處理鍵盤事件
   * @param {KeyboardEvent} e - 鍵盤事件
   */
  function handleKeyboard(e) {
    if (!isOpen) return;

    switch(e.key) {
      case 'Escape':
        e.preventDefault();
        closeGallery();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        showPrevious();
        break;
      case 'ArrowRight':
        e.preventDefault();
        showNext();
        break;
      case '+':
      case '=':
        e.preventDefault();
        zoomIn();
        break;
      case '-':
      case '_':
        e.preventDefault();
        zoomOut();
        break;
      case '0':
        e.preventDefault();
        resetZoom();
        break;
    }
  }

  // 延遲初始化，確保在所有資源載入完成後執行
  function delayedInit() {
    let retryCount = 0;
    const maxRetries = 5;
    const retryDelay = 200; // 200ms

    function tryInit() {
      console.log(`[MediaGallery] 嘗試初始化 (第 ${retryCount + 1} 次)...`);

      const success = init();

      if (!success && retryCount < maxRetries) {
        retryCount++;
        console.warn(`[MediaGallery] 初始化失敗，將在 ${retryDelay}ms 後重試...`);
        setTimeout(tryInit, retryDelay);
      } else if (!success) {
        console.error('[MediaGallery] 初始化失敗，已達到最大重試次數');
      }
    }

    // 使用 setTimeout 確保在主應用程式初始化之後
    setTimeout(tryInit, 100);
  }

  // 當整個頁面載入完成後初始化（包括所有資源）
  if (document.readyState === 'complete') {
    delayedInit();
  } else {
    window.addEventListener('load', delayedInit);
  }

  // 暴露公開 API（可選）
  window.MediaGallery = {
    init: init, // 允許手動初始化
    open: openGallery,
    close: closeGallery,
    next: showNext,
    previous: showPrevious,
    zoomIn: zoomIn,
    zoomOut: zoomOut,
    resetZoom: resetZoom
  };

})();
