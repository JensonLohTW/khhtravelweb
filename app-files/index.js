'use strict';

(function() {
  var Marzipano = window.Marzipano;
  var bowser = window.bowser;
  var screenfull = window.screenfull;
  var data = window.APP_DATA;
  var app = window.MarzipanoApp || {};
  var runtimeConfig = app.RuntimeConfig || {
    environment: 'production',
    allowSceneRename: false
  };
  var configLoader = app.ConfigLoader || {};
  var originalDataSnapshot = deepCloneData(data);

  if (!Marzipano || !data || !app.SceneManager || !app.UiControls) {
    return;
  }

  loadContentOverrides().then(function(contentOverrides) {
    start(contentOverrides || {});
  }).catch(function(error) {
    console.warn('[App] 載入內容覆寫檔案失敗，改用預設資料。', error);
    start({});
  });

  function loadContentOverrides() {
    if (typeof configLoader.loadContentOverrides === 'function') {
      return configLoader.loadContentOverrides();
    }
    return Promise.resolve({
      version: 1,
      scenes: {},
      hotspots: {}
    });
  }

  function start(contentOverrides) {
    var normalizedOverrides = normalizeContentOverrides(contentOverrides);
    var panoElement = document.querySelector('#pano');
    var sceneNameElement = document.querySelector('#titleBar .sceneName');
    var sceneListElement = document.querySelector('#sceneList');
    var sceneListToggleElement = document.querySelector('#sceneListToggle');
    var autorotateToggleElement = document.querySelector('#autorotateToggle');
    var fullscreenToggleElement = document.querySelector('#fullscreenToggle');
    var sceneElements = document.querySelectorAll('#sceneList .scene');
    var exportButton = document.querySelector('#contentOverridesExport');

    applyConfigSceneOverrides(data, normalizedOverrides.scenes);
    applyConfigHotspotOverrides(data, normalizedOverrides.hotspots);

    var baseSceneNames = buildBaseSceneNames(data);
    var sceneNameStorage = createSceneNameStorage('khhtravelweb.sceneNameOverrides');
    applySceneNameOverrides(data, sceneNameStorage.getAll());
    updateSceneListText(sceneElements, data);

    var viewControls = {
      up: document.querySelector('#viewUp'),
      down: document.querySelector('#viewDown'),
      left: document.querySelector('#viewLeft'),
      right: document.querySelector('#viewRight'),
      zoomIn: document.querySelector('#viewIn'),
      zoomOut: document.querySelector('#viewOut')
    };

    if (app.Environment) {
      app.Environment.initialize({
        bowser: bowser
      });
    }

    var viewerOpts = {
      controls: {
        mouseViewMode: data.settings.mouseViewMode
      }
    };

    var viewer = new Marzipano.Viewer(panoElement, viewerOpts);

    var sceneManager = app.SceneManager.create({
      Marzipano: Marzipano,
      viewer: viewer,
      data: data,
      sceneNameElement: sceneNameElement,
      sceneElements: sceneElements,
      hotspotsModule: app.Hotspots,
      urlState: app.UrlState,
      autorotateEnabled: data.settings.autorotateEnabled
    });

    app.UiControls.setup({
      viewer: viewer,
      sceneManager: sceneManager,
      sceneListElement: sceneListElement,
      sceneListToggleElement: sceneListToggleElement,
      sceneElements: sceneElements,
      autorotateToggleElement: autorotateToggleElement,
      fullscreenToggleElement: fullscreenToggleElement,
      screenfull: screenfull,
      viewControls: viewControls,
      fullscreenEnabled: data.settings.fullscreenButton
    });

    if (runtimeConfig.allowSceneRename) {
      document.body.classList.add('dev-mode');
    } else {
      document.body.classList.remove('dev-mode');
    }

    if (app.SceneNameEditor && typeof app.SceneNameEditor.setup === 'function') {
      app.SceneNameEditor.setup({
        sceneManager: sceneManager,
        sceneElements: sceneElements,
        allowRename: !!(runtimeConfig.allowSceneRename && sceneNameStorage.isEnabled()),
        getBaseName: function(id) {
          return baseSceneNames[id] || '';
        },
        saveOverride: function(id, name) {
          sceneNameStorage.set(id, name);
        },
        clearOverride: function(id) {
          sceneNameStorage.remove(id);
        }
      });
    }

    setupContentOverridesExportButton(exportButton, {
      enabled: !!runtimeConfig.allowSceneRename,
      getCurrentData: function() {
        return data;
      },
      getOriginalData: function() {
        return originalDataSnapshot;
      },
      version: normalizedOverrides.version
    });

    if (app.QrUi && typeof app.QrUi.setup === 'function') {
      app.QrUi.setup({
        sceneManager: sceneManager
      });
    }

    initializeScene(sceneManager, app.UrlState);
    bindHistoryListener(sceneManager, app.UrlState);
  }

  function initializeScene(manager, urlState) {
    var initialSceneId = urlState ? urlState.getSceneIdFromLocation() : null;
    var initialScene = initialSceneId ? manager.findSceneById(initialSceneId) : null;
    if (!initialScene) {
      initialScene = getFallbackScene(manager);
    }
    if (initialScene) {
      manager.switchScene(initialScene, { historyAction: 'replace' });
    }
  }

  function bindHistoryListener(manager, urlState) {
    if (!urlState) {
      return;
    }
    window.addEventListener('popstate', function(event) {
      var sceneId = event.state && event.state.sceneId ? event.state.sceneId : urlState.getSceneIdFromLocation();
      var targetScene = sceneId ? manager.findSceneById(sceneId) : null;
      if (!targetScene) {
        targetScene = getFallbackScene(manager);
      }
      if (targetScene && targetScene !== manager.getCurrentScene()) {
        manager.switchScene(targetScene, { historyAction: 'none' });
      }
    });
  }

  function getFallbackScene(manager) {
    var availableScenes = manager.getScenes();
    return availableScenes.length ? availableScenes[0] : null;
  }

  function buildBaseSceneNames(source) {
    var result = {};
    if (!source || !source.scenes) {
      return result;
    }
    for (var i = 0; i < source.scenes.length; i++) {
      var scene = source.scenes[i];
      if (scene && scene.id) {
        result[scene.id] = scene.name || '';
      }
    }
    return result;
  }

  function applySceneNameOverrides(source, overrides) {
    if (!source || !source.scenes || !overrides) {
      return;
    }
    for (var i = 0; i < source.scenes.length; i++) {
      var scene = source.scenes[i];
      if (!scene || !scene.id) {
        continue;
      }
      var overrideName = overrides[scene.id];
      if (typeof overrideName === 'string' && overrideName) {
        scene.name = overrideName;
      }
    }
  }

  function updateSceneListText(elements, source) {
    if (!elements || !source || !source.scenes) {
      return;
    }
    var sceneMap = {};
    for (var i = 0; i < source.scenes.length; i++) {
      var scene = source.scenes[i];
      if (scene && scene.id) {
        sceneMap[scene.id] = scene.name || '';
      }
    }
    for (var j = 0; j < elements.length; j++) {
      var element = elements[j];
      if (!element) {
        continue;
      }
      var sceneId = element.getAttribute('data-id');
      if (!sceneId || typeof sceneMap[sceneId] === 'undefined') {
        continue;
      }
      var textNode = element.querySelector('.text');
      if (!textNode) {
        continue;
      }
      while (textNode.firstChild) {
        textNode.removeChild(textNode.firstChild);
      }
      textNode.appendChild(document.createTextNode(sceneMap[sceneId]));
    }
  }

  function createSceneNameStorage(storageKey) {
    var storageAvailable = true;
    var overrides = {};
    var localStorageRef = null;
    try {
      localStorageRef = window.localStorage;
      var raw = localStorageRef.getItem(storageKey);
      if (raw) {
        overrides = JSON.parse(raw);
      }
    } catch (err) {
      storageAvailable = false;
      overrides = {};
    }

    function persist() {
      if (!storageAvailable || !localStorageRef) {
        return;
      }
      try {
        localStorageRef.setItem(storageKey, JSON.stringify(overrides));
      } catch (err) {
        storageAvailable = false;
      }
    }

    return {
      getAll: function() {
        return overrides;
      },
      set: function(sceneId, name) {
        if (!storageAvailable || !sceneId) {
          return;
        }
        overrides[sceneId] = name;
        persist();
      },
      remove: function(sceneId) {
        if (!storageAvailable || !sceneId) {
          return;
        }
        delete overrides[sceneId];
        persist();
      },
      isEnabled: function() {
        return storageAvailable;
      }
    };
  }

  function normalizeContentOverrides(contentOverrides) {
    if (typeof configLoader.normalizeOverrides === 'function') {
      return configLoader.normalizeOverrides(contentOverrides);
    }
    if (!contentOverrides || typeof contentOverrides !== 'object') {
      return {
        version: 1,
        scenes: {},
        hotspots: {}
      };
    }
    var normalized = {
      version: typeof contentOverrides.version === 'number' ? contentOverrides.version : 1,
      scenes: contentOverrides.scenes && typeof contentOverrides.scenes === 'object' ? contentOverrides.scenes : {},
      hotspots: contentOverrides.hotspots && typeof contentOverrides.hotspots === 'object' ? contentOverrides.hotspots : {}
    };
    return normalized;
  }

  function applyConfigSceneOverrides(source, overrides) {
    if (!source || !source.scenes || !overrides) {
      return;
    }
    for (var sceneId in overrides) {
      if (!Object.prototype.hasOwnProperty.call(overrides, sceneId)) {
        continue;
      }
      var override = overrides[sceneId];
      if (!override || typeof override !== 'object') {
        continue;
      }
      for (var i = 0; i < source.scenes.length; i++) {
        if (source.scenes[i] && source.scenes[i].id === sceneId) {
          if (typeof override.name === 'string' && override.name) {
            source.scenes[i].name = override.name;
          }
          break;
        }
      }
    }
  }

  function applyConfigHotspotOverrides(source, overrides) {
    if (!source || !source.scenes || !overrides) {
      return;
    }
    for (var sceneId in overrides) {
      if (!Object.prototype.hasOwnProperty.call(overrides, sceneId)) {
        continue;
      }
      var override = overrides[sceneId];
      if (!override || typeof override !== 'object') {
        continue;
      }
      var scene = null;
      for (var i = 0; i < source.scenes.length; i++) {
        if (source.scenes[i] && source.scenes[i].id === sceneId) {
          scene = source.scenes[i];
          break;
        }
      }
      if (!scene) {
        continue;
      }
      if (Array.isArray(override.infoHotspots) && Array.isArray(scene.infoHotspots)) {
        for (var j = 0; j < override.infoHotspots.length; j++) {
          var hotspotOverride = override.infoHotspots[j];
          if (!hotspotOverride || typeof hotspotOverride.index !== 'number') {
            continue;
          }
          var targetIndex = hotspotOverride.index;
          if (targetIndex < 0 || targetIndex >= scene.infoHotspots.length) {
            continue;
          }
          var targetHotspot = scene.infoHotspots[targetIndex];
          if (!targetHotspot) {
            continue;
          }
          if (typeof hotspotOverride.title === 'string') {
            targetHotspot.title = hotspotOverride.title;
          }
          if (typeof hotspotOverride.text === 'string') {
            targetHotspot.text = hotspotOverride.text;
          }
        }
      }
    }
  }

  function setupContentOverridesExportButton(buttonElement, options) {
    if (!buttonElement) {
      return;
    }
    options = options || {};
    if (!options.enabled) {
      buttonElement.style.display = 'none';
      return;
    }
    if (!options.getCurrentData || !options.getOriginalData) {
      buttonElement.style.display = 'none';
      return;
    }

    buttonElement.addEventListener('click', function(event) {
      event.preventDefault();
      var currentData = options.getCurrentData();
      var originalData = options.getOriginalData();
      var overrides = collectContentOverrides(currentData, originalData, options.version);
      var jsonString = JSON.stringify(overrides, null, 2);
      downloadOverridesFile('content-overrides.json', jsonString);
    });
  }

  function collectContentOverrides(currentData, originalData, version) {
    var result = {
      version: typeof version === 'number' ? version : 1,
      scenes: {},
      hotspots: {}
    };
    if (!currentData || !currentData.scenes) {
      return result;
    }
    var originalScenes = (originalData && originalData.scenes) || [];

    for (var i = 0; i < currentData.scenes.length; i++) {
      var currentScene = currentData.scenes[i];
      if (!currentScene || !currentScene.id) {
        continue;
      }
      var originalScene = findSceneById(originalScenes, currentScene.id);
      if (!originalScene) {
        continue;
      }
      if (currentScene.name !== originalScene.name) {
        result.scenes[currentScene.id] = { name: currentScene.name };
      }

      if (Array.isArray(currentScene.infoHotspots)) {
        var hotspotDiffs = [];
        for (var j = 0; j < currentScene.infoHotspots.length; j++) {
          var currentHotspot = currentScene.infoHotspots[j];
          var originalHotspot = (originalScene.infoHotspots || [])[j];
          var hotspotOverride = { index: j };
          var hasDiff = false;
          var originalTitle = originalHotspot && typeof originalHotspot.title === 'string' ? originalHotspot.title : '';
          var originalText = originalHotspot && typeof originalHotspot.text === 'string' ? originalHotspot.text : '';
          var currentTitle = currentHotspot && typeof currentHotspot.title === 'string' ? currentHotspot.title : '';
          var currentText = currentHotspot && typeof currentHotspot.text === 'string' ? currentHotspot.text : '';

          if (currentTitle !== originalTitle) {
            hotspotOverride.title = currentTitle;
            hasDiff = true;
          }
          if (currentText !== originalText) {
            hotspotOverride.text = currentText;
            hasDiff = true;
          }
          if (hasDiff) {
            hotspotDiffs.push(hotspotOverride);
          }
        }
        if (hotspotDiffs.length) {
          result.hotspots[currentScene.id] = {
            infoHotspots: hotspotDiffs
          };
        }
      }
    }

    return result;
  }

  function findSceneById(scenes, id) {
    if (!Array.isArray(scenes)) {
      return null;
    }
    for (var i = 0; i < scenes.length; i++) {
      if (scenes[i] && scenes[i].id === id) {
        return scenes[i];
      }
    }
    return null;
  }

  function downloadOverridesFile(filename, content) {
    try {
      if (typeof Blob === 'function' && window.URL && typeof window.URL.createObjectURL === 'function') {
        var blob = new Blob([content], { type: 'application/json' });
        var link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        setTimeout(function() {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(link.href);
        }, 0);
        return;
      }
    } catch (err) {
      console.warn('[Export] 使用 Blob 下載失敗，改用資料 URL。', err);
    }
    var dataUrl = 'data:application/json;charset=utf-8,' + encodeURIComponent(content);
    var fallbackWindow = window.open(dataUrl, '_blank');
    if (!fallbackWindow) {
      alert('瀏覽器阻擋了匯出視窗，請允許快顯或改用開發者工具中的 localStorage 匯出內容。');
    }
  }

  function deepCloneData(source) {
    try {
      return JSON.parse(JSON.stringify(source));
    } catch (err) {
      return { scenes: [] };
    }
  }
})();
