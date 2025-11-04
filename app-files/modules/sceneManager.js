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
    var linkHotspotRegistry = [];
    var linkHotspotFocusListeners = [];
    var sceneSwitchListeners = [];

    var hotspotFactory = hotspotsModule ? hotspotsModule.createFactory({
      switchSceneById: switchSceneById,
      findSceneDataById: findSceneDataById,
      onLinkHotspotFocus: handleLinkHotspotFocus
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
          var linkElement = hotspotFactory.createLinkHotspotElement(sceneData.id, hotspot);
          scene.hotspotContainer().createHotspot(linkElement, { yaw: hotspot.yaw, pitch: hotspot.pitch });
          registerLinkHotspot(sceneData.id, hotspot, linkElement);
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

    function updateSceneList(activeScene) {
      for (var i = 0; i < sceneElements.length; i++) {
        var element = sceneElements[i];
        if (!element) {
          continue;
        }
        var sceneId = element.getAttribute('data-id');
        if (activeScene && sceneId === activeScene.data.id) {
          element.classList.add('current');
        } else {
          element.classList.remove('current');
        }
        refreshSceneListText(element, sceneId);
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

    function renameSceneById(id, newName) {
      if (!id || typeof newName !== 'string') {
        return;
      }
      var sceneData = findSceneDataById(id);
      if (sceneData) {
        sceneData.name = newName;
      }
      var sceneRef = findSceneById(id);
      if (sceneRef) {
        sceneRef.data.name = newName;
      }
      if (currentScene && currentScene.data && currentScene.data.id === id) {
        updateSceneName(currentScene);
      }
      updateSceneList(currentScene);
      updateLinkHotspotTooltips(id);
      notifyLinkHotspotFocus({ type: 'refresh', hotspot: null, sourceSceneId: null, targetScene: sceneData });
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

    function refreshSceneListText(element, sceneId) {
      if (!element || !sceneId) {
        return;
      }
      var textElement = element.querySelector('.text');
      if (!textElement) {
        return;
      }
      var sceneData = findSceneDataById(sceneId);
      if (!sceneData) {
        return;
      }
      textElement.textContent = sceneData.name;
    }

    function registerLinkHotspot(sourceSceneId, hotspotData, element) {
      if (!sourceSceneId || !hotspotData || !element) {
        return;
      }
      linkHotspotRegistry.push({
        sourceSceneId: sourceSceneId,
        hotspot: hotspotData,
        element: element
      });
      updateSingleLinkHotspotTooltip({ hotspot: hotspotData, element: element });
    }

    function updateLinkHotspotTooltips(targetId) {
      if (!targetId) {
        return;
      }
      for (var i = 0; i < linkHotspotRegistry.length; i++) {
        var item = linkHotspotRegistry[i];
        if (!item || !item.hotspot || item.hotspot.target !== targetId) {
          continue;
        }
        updateSingleLinkHotspotTooltip(item);
      }
    }

    function updateSingleLinkHotspotTooltip(item) {
      if (!item || !item.hotspot || !item.element) {
        return;
      }
      var tooltip = typeof item.element._getLinkTooltip === 'function' ? item.element._getLinkTooltip() : item.element.querySelector('.link-hotspot-tooltip');
      if (!tooltip) {
        return;
      }
      var targetScene = findSceneDataById(item.hotspot.target);

      // 獲取標題：優先使用自訂標籤，否則使用場景名稱
      var labelText = item.hotspot && typeof item.hotspot.label === 'string' && item.hotspot.label ? item.hotspot.label : (targetScene && targetScene.name ? targetScene.name : '');

      // 獲取簡介：優先使用 hotspot.body，否則使用場景的 description
      var descriptionText = '';
      if (item.hotspot && typeof item.hotspot.body === 'string' && item.hotspot.body) {
        descriptionText = item.hotspot.body;
      } else if (targetScene && typeof targetScene.description === 'string' && targetScene.description) {
        descriptionText = targetScene.description;
      }

      // 組合顯示文字：標題 + 簡介（如果有的話）
      var displayText = labelText;
      if (descriptionText) {
        displayText = labelText + '\n' + descriptionText;
      }

      tooltip.textContent = displayText;
      item.element.setAttribute('aria-label', labelText || '');
    }

    function handleLinkHotspotFocus(event) {
      if (!event) {
        return;
      }
      var targetId = event.hotspot && event.hotspot.target ? event.hotspot.target : null;
      notifyLinkHotspotFocus({
        type: event.type,
        sourceSceneId: event.sourceSceneId,
        hotspot: event.hotspot,
        targetScene: findSceneDataById(targetId)
      });
    }

    function notifyLinkHotspotFocus(event) {
      for (var i = 0; i < linkHotspotFocusListeners.length; i++) {
        try {
          linkHotspotFocusListeners[i](event);
        } catch (err) {
          // 忽略監聽器錯誤，避免影響主要流程
        }
      }
    }

    function addLinkHotspotFocusListener(listener) {
      if (typeof listener !== 'function') {
        return;
      }
      linkHotspotFocusListeners.push(listener);
    }

    return {
      switchScene: switchScene,
      switchSceneById: switchSceneById,
      findSceneById: findSceneById,
      findSceneDataById: findSceneDataById,
      renameSceneById: renameSceneById,
      getScenes: getScenes,
      getCurrentScene: getCurrentScene,
      addSceneSwitchListener: addSceneSwitchListener,
      addLinkHotspotFocusListener: addLinkHotspotFocusListener,
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
