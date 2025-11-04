'use strict';

(function(window) {
  if (!window) {
    return;
  }

  function setup(config) {
    config = config || {};
    var app = window.MarzipanoApp = window.MarzipanoApp || {};
    var qrService = app.QrService;
    if (!qrService) {
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

    if (!button || !popover || !qrContainer || !sceneManager) {
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
      if (state.isOpen) {
        return;
      }
      state.isOpen = true;
      popover.classList.add('is-open');
      document.body.classList.add('qr-open');
      popover.setAttribute('aria-hidden', 'false');
      button.setAttribute('aria-expanded', 'true');
      var currentScene = sceneManager.getCurrentScene();
      updateSceneInfo(currentScene);
      if (typeof popover.focus === 'function') {
        popover.focus();
      }
    }

    function closePopover() {
      if (!state.isOpen) {
        return;
      }
      state.isOpen = false;
      popover.classList.remove('is-open');
      document.body.classList.remove('qr-open');
      popover.setAttribute('aria-hidden', 'true');
      button.setAttribute('aria-expanded', 'false');
    }

    function togglePopover() {
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

    button.addEventListener('click', function() {
      togglePopover();
    });

    if (closeButton) {
      closeButton.addEventListener('click', function() {
        closePopover();
      });
    }

    document.addEventListener('keydown', function(event) {
      if (event.key === 'Escape') {
        closePopover();
      }
    });

    if (typeof sceneManager.addSceneSwitchListener === 'function') {
      sceneManager.addSceneSwitchListener(function(sceneWrapper) {
        updateSceneInfo(sceneWrapper);
      });
    }

    updateSceneInfo(sceneManager.getCurrentScene());
  }

  window.MarzipanoApp = window.MarzipanoApp || {};
  window.MarzipanoApp.QrUi = {
    setup: setup
  };
})(window);
