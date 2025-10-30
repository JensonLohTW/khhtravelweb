'use strict';

(function(window) {
  if (!window) {
    return;
  }

  function createSceneManager(config) {
    config = config || {};
    var Marzipano = config.Marzipano || window.Marzipano;
    var viewer = config.viewer;
    var data = config.data || {};
    var sceneNameElement = config.sceneNameElement;
    var sceneElements = config.sceneElements || [];
    var hotspotsModule = config.hotspotsModule;
    var urlState = config.urlState;
    var autorotateEnabled = !!config.autorotateEnabled;

    var autorotate = Marzipano.autorotate({
      yawSpeed: 0.03,
      targetPitch: 0,
      targetFov: Math.PI / 2
    });

    var currentScene = null, scenes = [];
    var sceneSwitchListeners = [];

    var hotspotFactory = hotspotsModule ? hotspotsModule.createFactory({
      switchSceneById: switchSceneById,
      findSceneDataById: findSceneDataById
    }) : null;

    scenes = (data.scenes || []).map(function(sceneData) {
      var urlPrefix = 'tiles';
      var source = Marzipano.ImageUrlSource.fromString(
        urlPrefix + '/' + sceneData.id + '/{z}/{f}/{y}/{x}.jpg',
        { cubeMapPreviewUrl: urlPrefix + '/' + sceneData.id + '/preview.jpg' }
      );
      var geometry = new Marzipano.CubeGeometry(sceneData.levels);
      var limiter = Marzipano.RectilinearView.limit.traditional(
        sceneData.faceSize,
        100 * Math.PI / 180,
        120 * Math.PI / 180
      );
      var view = new Marzipano.RectilinearView(sceneData.initialViewParameters, limiter);

      var scene = viewer.createScene({
        source: source,
        geometry: geometry,
        view: view,
        pinFirstLevel: true
      });

      if (hotspotFactory) {
        sceneData.linkHotspots.forEach(function(hotspot) {
          var linkElement = hotspotFactory.createLinkHotspotElement(hotspot);
          scene.hotspotContainer().createHotspot(linkElement, { yaw: hotspot.yaw, pitch: hotspot.pitch });
        });

        sceneData.infoHotspots.forEach(function(hotspot) {
          var infoElement = hotspotFactory.createInfoHotspotElement(hotspot);
          scene.hotspotContainer().createHotspot(infoElement, { yaw: hotspot.yaw, pitch: hotspot.pitch });
        });
      }

      return {
        data: sceneData,
        scene: scene,
        view: view
      };
    });

    function switchScene(scene, options) {
      if (!scene) {
        return;
      }
      var opts = options || {};
      var historyAction = opts.historyAction || 'push';
      if (scene === currentScene && historyAction === 'push') {
        historyAction = 'replace';
      }
      stopAutorotate();
      scene.view.setParameters(scene.data.initialViewParameters);
      scene.scene.switchTo();
      startAutorotateIfEnabled();
      updateSceneName(scene);
      updateSceneList(scene);
      currentScene = scene;
      applySceneUrl(scene, historyAction);
      notifySceneSwitch(scene);
    }

    function notifySceneSwitch(scene) {
      for (var i = 0; i < sceneSwitchListeners.length; i++) {
        try {
          sceneSwitchListeners[i](scene);
        } catch (err) {
          // 忽略監聽器內部錯誤，避免影響導覽流程
        }
      }
    }

    function addSceneSwitchListener(listener) {
      if (typeof listener !== 'function') {
        return;
      }
      sceneSwitchListeners.push(listener);
    }

    function applySceneUrl(scene, historyAction) {
      if (!urlState) {
        return;
      }
      var sceneId = scene.data.id;
      urlState.updateSceneHistory(sceneId, historyAction);
      urlState.updateSceneAnchors(sceneElements);
    }

    function startAutorotateIfEnabled() {
      if (!autorotateEnabled) {
        return;
      }
      viewer.startMovement(autorotate);
      viewer.setIdleMovement(3000, autorotate);
    }

    function stopAutorotate() {
      viewer.stopMovement();
      viewer.setIdleMovement(Infinity);
    }

    function setAutorotateEnabled(enabled) {
      autorotateEnabled = !!enabled;
      if (autorotateEnabled) {
        startAutorotateIfEnabled();
      } else {
        stopAutorotate();
      }
    }

    function updateSceneName(scene) {
      if (!sceneNameElement) {
        return;
      }
      sceneNameElement.innerHTML = sanitize(scene.data.name);
    }

    function updateSceneList(scene) {
      for (var i = 0; i < sceneElements.length; i++) {
        var element = sceneElements[i];
        if (element.getAttribute('data-id') === scene.data.id) {
          element.classList.add('current');
        } else {
          element.classList.remove('current');
        }
      }
    }

    function findSceneById(id) {
      for (var i = 0; i < scenes.length; i++) {
        if (scenes[i].data.id === id) {
          return scenes[i];
        }
      }
      return null;
    }

    function findSceneDataById(id) {
      for (var i = 0; i < (data.scenes || []).length; i++) {
        if (data.scenes[i].id === id) {
          return data.scenes[i];
        }
      }
      return null;
    }

    function switchSceneById(id, options) {
      var targetScene = findSceneById(id);
      if (targetScene) {
        switchScene(targetScene, options);
      }
    }

    function getScenes() {
      return scenes.slice();
    }

    function getCurrentScene() {
      return currentScene;
    }

    function sanitize(value) {
      var text = String(value || '');
      return text.replace('&', '&amp;')
        .replace('<', '&lt;')
        .replace('>', '&gt;');
    }

    return {
      switchScene: switchScene,
      switchSceneById: switchSceneById,
      findSceneById: findSceneById,
      findSceneDataById: findSceneDataById,
      getScenes: getScenes,
      getCurrentScene: getCurrentScene,
      addSceneSwitchListener: addSceneSwitchListener,
      setAutorotateEnabled: setAutorotateEnabled,
      isAutorotateEnabled: function() {
        return autorotateEnabled;
      },
      stopAutorotate: stopAutorotate,
      startAutorotate: startAutorotateIfEnabled
    };
  }

  window.MarzipanoApp = window.MarzipanoApp || {};
  window.MarzipanoApp.SceneManager = {
    create: createSceneManager
  };
})(window);
