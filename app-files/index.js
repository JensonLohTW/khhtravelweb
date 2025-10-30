/*
 * Copyright 2016 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

(function() {
  var Marzipano = window.Marzipano;
  var bowser = window.bowser;
  var screenfull = window.screenfull;
  var data = window.APP_DATA;

  // Grab elements from DOM.
  var panoElement = document.querySelector('#pano');
  var sceneNameElement = document.querySelector('#titleBar .sceneName');
  var sceneListElement = document.querySelector('#sceneList');
  var sceneElements = document.querySelectorAll('#sceneList .scene');
  var sceneListToggleElement = document.querySelector('#sceneListToggle');
  var autorotateToggleElement = document.querySelector('#autorotateToggle');
  var fullscreenToggleElement = document.querySelector('#fullscreenToggle');

  // Detect desktop or mobile mode.
  if (window.matchMedia) {
    var setMode = function() {
      if (mql.matches) {
        document.body.classList.remove('desktop');
        document.body.classList.add('mobile');
      } else {
        document.body.classList.remove('mobile');
        document.body.classList.add('desktop');
      }
    };
    var mql = matchMedia("(max-width: 500px), (max-height: 500px)");
    setMode();
    mql.addListener(setMode);
  } else {
    document.body.classList.add('desktop');
  }

  // Detect whether we are on a touch device.
  document.body.classList.add('no-touch');
  window.addEventListener('touchstart', function() {
    document.body.classList.remove('no-touch');
    document.body.classList.add('touch');
  });

  // Use tooltip fallback mode on IE < 11.
  if (bowser.msie && parseFloat(bowser.version) < 11) {
    document.body.classList.add('tooltip-fallback');
  }

  // Viewer options.
  var viewerOpts = {
    controls: {
      mouseViewMode: data.settings.mouseViewMode
    }
  };

  // Initialize viewer.
  var viewer = new Marzipano.Viewer(panoElement, viewerOpts);

  // Create scenes.
  var scenes = data.scenes.map(function(data) {
    var urlPrefix = "tiles";
    var source = Marzipano.ImageUrlSource.fromString(
      urlPrefix + "/" + data.id + "/{z}/{f}/{y}/{x}.jpg",
      { cubeMapPreviewUrl: urlPrefix + "/" + data.id + "/preview.jpg" });
    var geometry = new Marzipano.CubeGeometry(data.levels);

    var limiter = Marzipano.RectilinearView.limit.traditional(data.faceSize, 100*Math.PI/180, 120*Math.PI/180);
    var view = new Marzipano.RectilinearView(data.initialViewParameters, limiter);

    var scene = viewer.createScene({
      source: source,
      geometry: geometry,
      view: view,
      pinFirstLevel: true
    });

    // Create link hotspots.
    data.linkHotspots.forEach(function(hotspot) {
      var element = createLinkHotspotElement(hotspot);
      scene.hotspotContainer().createHotspot(element, { yaw: hotspot.yaw, pitch: hotspot.pitch });
    });

    // Create info hotspots.
    data.infoHotspots.forEach(function(hotspot) {
      var element = createInfoHotspotElement(hotspot);
      scene.hotspotContainer().createHotspot(element, { yaw: hotspot.yaw, pitch: hotspot.pitch });
    });

    return {
      data: data,
      scene: scene,
      view: view
    };
  });

  var currentScene = null;
  const SCENE_PARAM_NAME = 'scene';

  // Set up autorotate, if enabled.
  var autorotate = Marzipano.autorotate({
    yawSpeed: 0.03,
    targetPitch: 0,
    targetFov: Math.PI/2
  });
  if (data.settings.autorotateEnabled) {
    autorotateToggleElement.classList.add('enabled');
  }

  // Set handler for autorotate toggle.
  autorotateToggleElement.addEventListener('click', toggleAutorotate);

  // Set up fullscreen mode, if supported.
  if (screenfull.enabled && data.settings.fullscreenButton) {
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

  // Set handler for scene list toggle.
  sceneListToggleElement.addEventListener('click', toggleSceneList);

  // Start with the scene list open on desktop.
  if (!document.body.classList.contains('mobile')) {
    showSceneList();
  }

  // Set handler for scene switch.
  scenes.forEach(function(scene) {
    var el = document.querySelector('#sceneList .scene[data-id="' + scene.data.id + '"]');
    if (!el) {
      return;
    }
    el.addEventListener('click', function(event) {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      if (typeof event.button === 'number' && event.button !== 0) {
        return;
      }
      event.preventDefault();
      switchScene(scene);
      // On mobile, hide scene list after selecting a scene.
      if (document.body.classList.contains('mobile')) {
        hideSceneList();
      }
    });
  });

  // DOM elements for view controls.
  var viewUpElement = document.querySelector('#viewUp');
  var viewDownElement = document.querySelector('#viewDown');
  var viewLeftElement = document.querySelector('#viewLeft');
  var viewRightElement = document.querySelector('#viewRight');
  var viewInElement = document.querySelector('#viewIn');
  var viewOutElement = document.querySelector('#viewOut');

  // Dynamic parameters for controls.
  var velocity = 0.7;
  var friction = 3;

  // Associate view controls with elements.
  var controls = viewer.controls();
  controls.registerMethod('upElement',    new Marzipano.ElementPressControlMethod(viewUpElement,     'y', -velocity, friction), true);
  controls.registerMethod('downElement',  new Marzipano.ElementPressControlMethod(viewDownElement,   'y',  velocity, friction), true);
  controls.registerMethod('leftElement',  new Marzipano.ElementPressControlMethod(viewLeftElement,   'x', -velocity, friction), true);
  controls.registerMethod('rightElement', new Marzipano.ElementPressControlMethod(viewRightElement,  'x',  velocity, friction), true);
  controls.registerMethod('inElement',    new Marzipano.ElementPressControlMethod(viewInElement,  'zoom', -velocity, friction), true);
  controls.registerMethod('outElement',   new Marzipano.ElementPressControlMethod(viewOutElement, 'zoom',  velocity, friction), true);

  function sanitize(s) {
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;');
  }

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
    startAutorotate();
    updateSceneName(scene);
    updateSceneList(scene);
    currentScene = scene;
    updateSceneUrl(scene, historyAction);
  }

  function updateSceneName(scene) {
    sceneNameElement.innerHTML = sanitize(scene.data.name);
  }

  function updateSceneList(scene) {
    for (var i = 0; i < sceneElements.length; i++) {
      var el = sceneElements[i];
      if (el.getAttribute('data-id') === scene.data.id) {
        el.classList.add('current');
      } else {
        el.classList.remove('current');
      }
    }
  }

  function showSceneList() {
    sceneListElement.classList.add('enabled');
    sceneListToggleElement.classList.add('enabled');
  }

  function hideSceneList() {
    sceneListElement.classList.remove('enabled');
    sceneListToggleElement.classList.remove('enabled');
  }

  function toggleSceneList() {
    sceneListElement.classList.toggle('enabled');
    sceneListToggleElement.classList.toggle('enabled');
  }

  function startAutorotate() {
    if (!autorotateToggleElement.classList.contains('enabled')) {
      return;
    }
    viewer.startMovement(autorotate);
    viewer.setIdleMovement(3000, autorotate);
  }

  function stopAutorotate() {
    viewer.stopMovement();
    viewer.setIdleMovement(Infinity);
  }

  function toggleAutorotate() {
    if (autorotateToggleElement.classList.contains('enabled')) {
      autorotateToggleElement.classList.remove('enabled');
      stopAutorotate();
    } else {
      autorotateToggleElement.classList.add('enabled');
      startAutorotate();
    }
  }

  function createLinkHotspotElement(hotspot) {

    // Create wrapper element to hold icon and tooltip.
    var wrapper = document.createElement('div');
    wrapper.classList.add('hotspot');
    wrapper.classList.add('link-hotspot');

    // Create image element.
    var icon = document.createElement('img');
    icon.src = 'img/link.png';
    icon.classList.add('link-hotspot-icon');

    // Set rotation transform.
    var transformProperties = [ '-ms-transform', '-webkit-transform', 'transform' ];
    for (var i = 0; i < transformProperties.length; i++) {
      var property = transformProperties[i];
      icon.style[property] = 'rotate(' + hotspot.rotation + 'rad)';
    }

    // Add click event handler.
    wrapper.addEventListener('click', function() {
      switchScene(findSceneById(hotspot.target));
    });

    // Prevent touch and scroll events from reaching the parent element.
    // This prevents the view control logic from interfering with the hotspot.
    stopTouchAndScrollEventPropagation(wrapper);

    // Create tooltip element.
    var tooltip = document.createElement('div');
    tooltip.classList.add('hotspot-tooltip');
    tooltip.classList.add('link-hotspot-tooltip');
    tooltip.innerHTML = findSceneDataById(hotspot.target).name;

    wrapper.appendChild(icon);
    wrapper.appendChild(tooltip);

    return wrapper;
  }

  function createInfoHotspotElement(hotspot) {

    // Create wrapper element to hold icon and tooltip.
    var wrapper = document.createElement('div');
    wrapper.classList.add('hotspot');
    wrapper.classList.add('info-hotspot');

    // Create hotspot/tooltip header.
    var header = document.createElement('div');
    header.classList.add('info-hotspot-header');

    // Create image element.
    var iconWrapper = document.createElement('div');
    iconWrapper.classList.add('info-hotspot-icon-wrapper');
    var icon = document.createElement('img');
    icon.src = 'img/info.png';
    icon.classList.add('info-hotspot-icon');
    iconWrapper.appendChild(icon);

    // Create title element.
    var titleWrapper = document.createElement('div');
    titleWrapper.classList.add('info-hotspot-title-wrapper');
    var title = document.createElement('div');
    title.classList.add('info-hotspot-title');
    title.innerHTML = hotspot.title;
    titleWrapper.appendChild(title);

    // Create close element.
    var closeWrapper = document.createElement('div');
    closeWrapper.classList.add('info-hotspot-close-wrapper');
    var closeIcon = document.createElement('img');
    closeIcon.src = 'img/close.png';
    closeIcon.classList.add('info-hotspot-close-icon');
    closeWrapper.appendChild(closeIcon);

    // Construct header element.
    header.appendChild(iconWrapper);
    header.appendChild(titleWrapper);
    header.appendChild(closeWrapper);

    // Create text element.
    var text = document.createElement('div');
    text.classList.add('info-hotspot-text');
    text.innerHTML = hotspot.text;

    // Place header and text into wrapper element.
    wrapper.appendChild(header);
    wrapper.appendChild(text);

    // Create a modal for the hotspot content to appear on mobile mode.
    var modal = document.createElement('div');
    modal.innerHTML = wrapper.innerHTML;
    modal.classList.add('info-hotspot-modal');
    document.body.appendChild(modal);

    var toggle = function() {
      wrapper.classList.toggle('visible');
      modal.classList.toggle('visible');
    };

    // Show content when hotspot is clicked.
    wrapper.querySelector('.info-hotspot-header').addEventListener('click', toggle);

    // Hide content when close icon is clicked.
    modal.querySelector('.info-hotspot-close-wrapper').addEventListener('click', toggle);

    // Prevent touch and scroll events from reaching the parent element.
    // This prevents the view control logic from interfering with the hotspot.
    stopTouchAndScrollEventPropagation(wrapper);

    return wrapper;
  }

  // Prevent touch and scroll events from reaching the parent element.
  function stopTouchAndScrollEventPropagation(element, eventList) {
    var eventList = [ 'touchstart', 'touchmove', 'touchend', 'touchcancel',
                      'wheel', 'mousewheel' ];
    for (var i = 0; i < eventList.length; i++) {
      element.addEventListener(eventList[i], function(event) {
        event.stopPropagation();
      });
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
    for (var i = 0; i < data.scenes.length; i++) {
      if (data.scenes[i].id === id) {
        return data.scenes[i];
      }
    }
    return null;
  }

  function getSceneIdFromLocation() {
    var sceneId = null;
    if (typeof URL === 'function' && typeof URLSearchParams === 'function') {
      try {
        var url = new URL(window.location.href);
        sceneId = url.searchParams.get(SCENE_PARAM_NAME);
        if (sceneId) {
          return sceneId;
        }
        if (url.hash && url.hash.length > 1) {
          var hashParams = new URLSearchParams(url.hash.slice(1));
          sceneId = hashParams.get(SCENE_PARAM_NAME);
          if (sceneId) {
            return sceneId;
          }
        }
      } catch (err) {
        sceneId = null;
      }
    }
    sceneId = extractParamFromUrl(window.location.search, SCENE_PARAM_NAME);
    if (sceneId) {
      return sceneId;
    }
    return extractParamFromUrl(window.location.hash, SCENE_PARAM_NAME);
  }

  function extractParamFromUrl(source, key) {
    if (!source) {
      return null;
    }
    var query = source.charAt(0) === '?' || source.charAt(0) === '#' ? source.slice(1) : source;
    if (!query) {
      return null;
    }
    var pairs = query.split('&');
    for (var i = 0; i < pairs.length; i++) {
      if (!pairs[i]) {
        continue;
      }
      var separatorIndex = pairs[i].indexOf('=');
      var paramName;
      var paramValue;
      if (separatorIndex === -1) {
        paramName = pairs[i];
        paramValue = '';
      } else {
        paramName = pairs[i].slice(0, separatorIndex);
        paramValue = pairs[i].slice(separatorIndex + 1);
      }
      if (paramName === key) {
        try {
          return decodeURIComponent(paramValue);
        } catch (err) {
          return paramValue;
        }
      }
    }
    return null;
  }

  function buildSceneUrl(sceneId) {
    if (typeof URL === 'function' && typeof URLSearchParams === 'function') {
      try {
        var url = new URL(window.location.href);
        url.searchParams.set(SCENE_PARAM_NAME, sceneId);
        if (url.hash && url.hash.length > 1) {
          var hashParams = new URLSearchParams(url.hash.slice(1));
          if (hashParams.has(SCENE_PARAM_NAME)) {
            hashParams.delete(SCENE_PARAM_NAME);
            var hashString = hashParams.toString();
            url.hash = hashString ? '#' + hashString : '';
          }
        }
        return url.pathname + url.search + url.hash;
      } catch (err) {
        // 若瀏覽器不支援 URL API，改用傳統字串處理
      }
    }
    return buildSceneUrlLegacy(sceneId);
  }

  function buildSceneUrlLegacy(sceneId) {
    var basePath = window.location.pathname;
    var hash = cleanHash(window.location.hash);
    var search = window.location.search ? window.location.search.slice(1).split('&') : [];
    var preservedParams = [];
    for (var i = 0; i < search.length; i++) {
      if (!search[i]) {
        continue;
      }
      var separatorIndex = search[i].indexOf('=');
      var name = separatorIndex === -1 ? search[i] : search[i].slice(0, separatorIndex);
      if (name === SCENE_PARAM_NAME) {
        continue;
      }
      preservedParams.push(search[i]);
    }
    preservedParams.push(SCENE_PARAM_NAME + '=' + encodeURIComponent(sceneId));
    var query = preservedParams.length ? '?' + preservedParams.join('&') : '';
    return basePath + query + hash;
  }

  function cleanHash(hash) {
    if (!hash || hash.length <= 1) {
      return '';
    }
    var fragments = hash.slice(1).split('&');
    var preserved = [];
    for (var i = 0; i < fragments.length; i++) {
      if (!fragments[i]) {
        continue;
      }
      var separatorIndex = fragments[i].indexOf('=');
      var name = separatorIndex === -1 ? fragments[i] : fragments[i].slice(0, separatorIndex);
      if (name === SCENE_PARAM_NAME) {
        continue;
      }
      preserved.push(fragments[i]);
    }
    return preserved.length ? '#' + preserved.join('&') : '';
  }

  function updateSceneUrl(scene, historyAction) {
    if (historyAction === 'none') {
      updateSceneAnchors();
      return;
    }
    var method = historyAction === 'replace' ? 'replaceState' : 'pushState';
    var sceneId = scene.data.id;
    if (!window.history || typeof window.history[method] !== 'function') {
      window.location.hash = SCENE_PARAM_NAME + '=' + encodeURIComponent(sceneId);
      updateSceneAnchors();
      return;
    }
    var url = buildSceneUrl(sceneId);
    var state = { sceneId: sceneId };
    window.history[method](state, '', url);
    updateSceneAnchors();
  }

  // 為場景列表中的連結更新帶場景參數的 URL，方便右鍵複製與共用
  function updateSceneAnchors() {
    for (var i = 0; i < sceneElements.length; i++) {
      var element = sceneElements[i];
      var targetId = element.getAttribute('data-id');
      if (!targetId) {
        continue;
      }
      element.setAttribute('href', buildSceneUrl(targetId));
    }
  }

  // Display the initial scene.
  var initialSceneId = getSceneIdFromLocation();
  var initialScene = findSceneById(initialSceneId) || scenes[0];
  switchScene(initialScene, { historyAction: 'replace' });

  // 監聽瀏覽器返回鍵以載入對應場景
  window.addEventListener('popstate', function(event) {
    var sceneId = event.state && event.state.sceneId ? event.state.sceneId : getSceneIdFromLocation();
    var targetScene = findSceneById(sceneId) || scenes[0];
    if (targetScene === currentScene) {
      return;
    }
    switchScene(targetScene, { historyAction: 'none' });
  });

})();
