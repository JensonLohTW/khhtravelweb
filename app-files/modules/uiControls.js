'use strict';

(function(window, document) {
  if (!window) {
    return;
  }

  function setup(config) {
    config = config || {};
    var viewer = config.viewer;
    var sceneManager = config.sceneManager;
    var sceneListElement = config.sceneListElement;
    var sceneListToggleElement = config.sceneListToggleElement;
    var sceneElements = config.sceneElements || [];
    var autorotateToggleElement = config.autorotateToggleElement;
    var fullscreenToggleElement = config.fullscreenToggleElement;
    var screenfull = config.screenfull;
    var viewControls = config.viewControls || {};
    var Marzipano = window.Marzipano;
    var fullscreenEnabled = !!config.fullscreenEnabled;

    registerViewControls(viewer, viewControls, Marzipano);
    setupSceneListToggle(sceneListElement, sceneListToggleElement);
    setupSceneSelection(sceneElements, sceneManager, sceneListElement, sceneListToggleElement);
    setupAutorotateToggle(sceneManager, autorotateToggleElement);
    setupFullscreenToggle(fullscreenToggleElement, screenfull, fullscreenEnabled);

    if (!document.body.classList.contains('mobile')) {
      showSceneList(sceneListElement, sceneListToggleElement);
    }
  }

  function registerViewControls(viewer, viewControls, Marzipano) {
    if (!viewer || !viewer.controls || !Marzipano) {
      return;
    }

    var controls = viewer.controls();
    var velocity = 0.7;
    var friction = 3;

    registerPressControl(controls, 'upElement', viewControls.up, function(element) {
      return new Marzipano.ElementPressControlMethod(element, 'y', -velocity, friction);
    });
    registerPressControl(controls, 'downElement', viewControls.down, function(element) {
      return new Marzipano.ElementPressControlMethod(element, 'y', velocity, friction);
    });
    registerPressControl(controls, 'leftElement', viewControls.left, function(element) {
      return new Marzipano.ElementPressControlMethod(element, 'x', -velocity, friction);
    });
    registerPressControl(controls, 'rightElement', viewControls.right, function(element) {
      return new Marzipano.ElementPressControlMethod(element, 'x', velocity, friction);
    });
    registerPressControl(controls, 'inElement', viewControls.zoomIn, function(element) {
      return new Marzipano.ElementPressControlMethod(element, 'zoom', -velocity, friction);
    });
    registerPressControl(controls, 'outElement', viewControls.zoomOut, function(element) {
      return new Marzipano.ElementPressControlMethod(element, 'zoom', velocity, friction);
    });
  }

  function registerPressControl(controls, name, element, factory) {
    if (!element || typeof factory !== 'function') {
      return;
    }
    controls.registerMethod(name, factory(element), true);
  }

  function setupSceneListToggle(sceneListElement, sceneListToggleElement) {
    if (!sceneListElement || !sceneListToggleElement) {
      return;
    }
    sceneListToggleElement.addEventListener('click', function() {
      sceneListElement.classList.toggle('enabled');
      sceneListToggleElement.classList.toggle('enabled');
    });
  }

  function setupSceneSelection(sceneElements, sceneManager, sceneListElement, sceneListToggleElement) {
    if (!sceneElements || !sceneManager) {
      return;
    }
    for (var i = 0; i < sceneElements.length; i++) {
      (function(element) {
        element.addEventListener('click', function(event) {
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
            return;
          }
          if (typeof event.button === 'number' && event.button !== 0) {
            return;
          }
          event.preventDefault();
          var targetId = element.getAttribute('data-id');
          if (targetId) {
            sceneManager.switchSceneById(targetId);
          }
          if (document.body.classList.contains('mobile')) {
            hideSceneList(sceneListElement, sceneListToggleElement);
          }
        });
      })(sceneElements[i]);
    }
  }

  function setupAutorotateToggle(sceneManager, autorotateToggleElement) {
    if (!sceneManager || !autorotateToggleElement) {
      return;
    }
    if (sceneManager.isAutorotateEnabled()) {
      autorotateToggleElement.classList.add('enabled');
    }
    autorotateToggleElement.addEventListener('click', function() {
      var enabled = autorotateToggleElement.classList.toggle('enabled');
      sceneManager.setAutorotateEnabled(enabled);
    });
  }

  function setupFullscreenToggle(fullscreenToggleElement, screenfull, fullscreenEnabled) {
    if (!fullscreenToggleElement || !fullscreenEnabled || !screenfull) {
      document.body.classList.add('fullscreen-disabled');
      return;
    }
    if (screenfull.enabled) {
      document.body.classList.add('fullscreen-enabled');
      fullscreenToggleElement.addEventListener('click', function() {
        screenfull.toggle();
      });
      screenfull.on('change', function() {
        if (screenfull.isFullscreen) {
          fullscreenToggleElement.classList.add('enabled');
        } else {
          fullscreenToggleElement.classList.remove('enabled');
        }
      });
    } else {
      document.body.classList.add('fullscreen-disabled');
    }
  }

  function showSceneList(sceneListElement, sceneListToggleElement) {
    if (sceneListElement) {
      sceneListElement.classList.add('enabled');
    }
    if (sceneListToggleElement) {
      sceneListToggleElement.classList.add('enabled');
    }
  }

  function hideSceneList(sceneListElement, sceneListToggleElement) {
    if (sceneListElement) {
      sceneListElement.classList.remove('enabled');
    }
    if (sceneListToggleElement) {
      sceneListToggleElement.classList.remove('enabled');
    }
  }

  window.MarzipanoApp = window.MarzipanoApp || {};
  window.MarzipanoApp.UiControls = {
    setup: setup,
    showSceneList: showSceneList,
    hideSceneList: hideSceneList
  };
})(window, document);
