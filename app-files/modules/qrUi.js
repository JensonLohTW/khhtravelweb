'use strict';

(function(window) {
  if (!window) {
    return;
  }

  function setup(config) {
    console.log('[QR UI] 🚀 開始初始化 QR UI 模組...');
    config = config || {};
    var app = window.MarzipanoApp = window.MarzipanoApp || {};
    var qrService = app.QrService;

    console.log('[QR UI] 檢查 QrService:', qrService ? '✅ 已載入' : '❌ 未載入');
    if (!qrService) {
      console.error('[QR UI] ❌ QrService 未找到，QR 功能無法啟用');
      return;
    }

    var button = document.querySelector('#qrToggle');
    var popover = document.querySelector('#qrPopover');
    var closeButton = document.querySelector('#qrPopoverClose');
    var qrContainer = document.querySelector('#qrImage');
    var sceneLabel = document.querySelector('#qrSceneLabel');
    var urlLink = document.querySelector('#qrSceneLink');
    var downloadLink = document.querySelector('#qrDownloadLink');
    var sceneManager = config.sceneManager;

    console.log('[QR UI] DOM 元素檢查:');
    console.log('  - qrToggle 按鈕:', button ? '✅ 找到' : '❌ 未找到');
    console.log('  - qrPopover 面板:', popover ? '✅ 找到' : '❌ 未找到');
    console.log('  - qrContainer 容器:', qrContainer ? '✅ 找到' : '❌ 未找到');
    console.log('  - sceneManager:', sceneManager ? '✅ 已傳入' : '❌ 未傳入');

    if (!button || !popover || !qrContainer || !sceneManager) {
      console.error('[QR UI] ❌ 缺少必要的 DOM 元素或配置，QR 功能無法啟用');
      return;
    }

    document.body.classList.add('qr-enabled');
    popover.setAttribute('aria-hidden', 'true');
    button.setAttribute('aria-expanded', 'false');

    var state = {
      isOpen: false,
      qrOptions: {
        width: config.width || 220,
        height: config.height || 220,
        margin: typeof config.margin === 'number' ? config.margin : 2
      },
      currentSceneId: null
    };

    function openPopover() {
      console.log('[QR UI] 📂 開始打開 QR 面板...');
      if (state.isOpen) {
        console.log('[QR UI] ⚠️ 面板已經是開啟狀態，跳過');
        return;
      }
      state.isOpen = true;
      popover.classList.add('is-open');
      document.body.classList.add('qr-open');
      popover.setAttribute('aria-hidden', 'false');
      button.setAttribute('aria-expanded', 'true');
      var currentScene = sceneManager.getCurrentScene();
      console.log('[QR UI] 當前場景:', currentScene ? currentScene.data.name : '無');
      updateSceneInfo(currentScene);
      if (typeof popover.focus === 'function') {
        popover.focus();
      }
      console.log('[QR UI] ✅ QR 面板已打開');
    }

    function closePopover() {
      console.log('[QR UI] 🔒 開始關閉 QR 面板...');
      if (!state.isOpen) {
        console.log('[QR UI] ⚠️ 面板已經是關閉狀態，跳過');
        return;
      }
      state.isOpen = false;
      popover.classList.remove('is-open');
      document.body.classList.remove('qr-open');
      popover.setAttribute('aria-hidden', 'true');
      button.setAttribute('aria-expanded', 'false');
      console.log('[QR UI] ✅ QR 面板已關閉');
    }

    function togglePopover() {
      console.log('[QR UI] 🔄 切換 QR 面板狀態...');
      if (state.isOpen) {
        closePopover();
      } else {
        openPopover();
      }
    }

    function updateSceneInfo(sceneWrapper) {
      var target = sceneWrapper || sceneManager.getCurrentScene();
      if (!target || !target.data) {
        return;
      }
      state.currentSceneId = target.data.id;
      var renderResult = qrService.renderSceneQr(target.data.id, qrContainer, state.qrOptions);
      var qrUrl = renderResult ? renderResult.url : qrService.buildSceneUrl(target.data.id, state.qrOptions);
      if (sceneLabel) {
        sceneLabel.textContent = target.data.name || target.data.id;
      }
      if (urlLink) {
        urlLink.textContent = qrUrl;
        urlLink.setAttribute('href', qrUrl);
        urlLink.setAttribute('aria-label', '場景網址 ' + qrUrl);
      }
      if (downloadLink) {
        var canvas = qrContainer.querySelector('canvas');
        if (canvas && typeof canvas.toDataURL === 'function') {
          var dataUrl = canvas.toDataURL('image/png');
          downloadLink.setAttribute('href', dataUrl);
          downloadLink.setAttribute('download', target.data.id + '-qr.png');
          downloadLink.removeAttribute('aria-disabled');
        } else {
          downloadLink.removeAttribute('href');
          downloadLink.setAttribute('aria-disabled', 'true');
        }
      }
    }

    console.log('[QR UI] 🎯 正在綁定按鈕點擊事件...');
    button.addEventListener('click', function(e) {
      console.log('[QR UI] 🖱️ QR 按鈕被點擊了！', e);
      console.log('[QR UI] 當前狀態:', state.isOpen ? '已開啟' : '已關閉');
      togglePopover();
    });
    console.log('[QR UI] ✅ QR 按鈕點擊事件已綁定');

    if (closeButton) {
      closeButton.addEventListener('click', function() {
        console.log('[QR UI] 關閉按鈕被點擊');
        closePopover();
      });
    }

    document.addEventListener('keydown', function(event) {
      if (event.key === 'Escape') {
        console.log('[QR UI] ESC 鍵被按下，關閉面板');
        closePopover();
      }
    });

    if (typeof sceneManager.addSceneSwitchListener === 'function') {
      sceneManager.addSceneSwitchListener(function(sceneWrapper) {
        console.log('[QR UI] 場景切換:', sceneWrapper ? sceneWrapper.data.name : '無');
        updateSceneInfo(sceneWrapper);
      });
    }

    updateSceneInfo(sceneManager.getCurrentScene());
    console.log('[QR UI] 🎉 QR UI 模組初始化完成！');
    console.log('[QR UI] 按鈕位置檢查:', {
      button: button,
      offsetTop: button.offsetTop,
      offsetLeft: button.offsetLeft,
      offsetWidth: button.offsetWidth,
      offsetHeight: button.offsetHeight,
      zIndex: window.getComputedStyle(button).zIndex,
      display: window.getComputedStyle(button).display,
      visibility: window.getComputedStyle(button).visibility,
      pointerEvents: window.getComputedStyle(button).pointerEvents
    });
  }

  window.MarzipanoApp = window.MarzipanoApp || {};
  window.MarzipanoApp.QrUi = {
    setup: setup
  };
})(window);
