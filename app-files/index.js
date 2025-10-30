'use strict';

(function() {
  var Marzipano = window.Marzipano;
  var bowser = window.bowser;
  var screenfull = window.screenfull;
  var data = window.APP_DATA;
  var app = window.MarzipanoApp || {};

  if (!Marzipano || !data || !app.SceneManager || !app.UiControls) {
    return;
  }

  var panoElement = document.querySelector('#pano');
  var sceneNameElement = document.querySelector('#titleBar .sceneName');
  var sceneListElement = document.querySelector('#sceneList');
  var sceneListToggleElement = document.querySelector('#sceneListToggle');
  var autorotateToggleElement = document.querySelector('#autorotateToggle');
  var fullscreenToggleElement = document.querySelector('#fullscreenToggle');
  var sceneElements = document.querySelectorAll('#sceneList .scene');

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

  if (app.QrUi && typeof app.QrUi.setup === 'function') {
    app.QrUi.setup({
      sceneManager: sceneManager
    });
  }

  initializeScene(sceneManager, app.UrlState);
  bindHistoryListener(sceneManager, app.UrlState);

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
})();
