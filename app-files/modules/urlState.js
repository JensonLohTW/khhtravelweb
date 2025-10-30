'use strict';

(function(window) {
  if (!window) {
    return;
  }

  var SCENE_PARAM_NAME = 'scene';

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

  function updateSceneHistory(sceneId, historyAction) {
    if (historyAction === 'none') {
      return;
    }

    var method = historyAction === 'replace' ? 'replaceState' : 'pushState';
    if (!window.history || typeof window.history[method] !== 'function') {
      window.location.hash = SCENE_PARAM_NAME + '=' + encodeURIComponent(sceneId);
      return;
    }

    var url = buildSceneUrl(sceneId);
    var state = { sceneId: sceneId };
    window.history[method](state, '', url);
  }

  function updateSceneAnchors(sceneElements) {
    if (!sceneElements) {
      return;
    }
    for (var i = 0; i < sceneElements.length; i++) {
      var element = sceneElements[i];
      var targetId = element.getAttribute('data-id');
      if (!targetId) {
        continue;
      }
      element.setAttribute('href', buildSceneUrl(targetId));
    }
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
        // fall through to legacy builder
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

  window.MarzipanoApp = window.MarzipanoApp || {};
  window.MarzipanoApp.UrlState = {
    SCENE_PARAM_NAME: SCENE_PARAM_NAME,
    getSceneIdFromLocation: getSceneIdFromLocation,
    updateSceneHistory: updateSceneHistory,
    updateSceneAnchors: updateSceneAnchors,
    buildSceneUrl: buildSceneUrl
  };
})(window);
