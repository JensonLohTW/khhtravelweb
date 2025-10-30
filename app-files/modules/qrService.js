'use strict';

(function(window) {
  if (!window) {
    return;
  }

  var QRCode = window.QRCode;
  var APP_DATA = window.APP_DATA || {};
  var scenes = Array.isArray(APP_DATA.scenes) ? APP_DATA.scenes.slice() : [];
  var MarzipanoApp = window.MarzipanoApp = window.MarzipanoApp || {};
  var UrlState = MarzipanoApp.UrlState;

  function getScenes() {
    return scenes.slice();
  }

  function getSceneById(sceneId) {
    for (var i = 0; i < scenes.length; i++) {
      if (scenes[i].id === sceneId) {
        return scenes[i];
      }
    }
    return null;
  }

  function buildSceneUrl(sceneId, options) {
    var targetId = sceneId;
    var opts = options || {};
    if (!targetId) {
      return buildAbsoluteUrl(window.location.pathname + window.location.search + window.location.hash, opts.baseUrl);
    }
    var relativeUrl = UrlState && typeof UrlState.buildSceneUrl === 'function'
      ? UrlState.buildSceneUrl(targetId)
      : buildLegacySceneUrl(targetId);
    return buildAbsoluteUrl(relativeUrl, opts.baseUrl);
  }

  function buildLegacySceneUrl(sceneId) {
    var paramName = UrlState && UrlState.SCENE_PARAM_NAME ? UrlState.SCENE_PARAM_NAME : 'scene';
    var basePath = window.location.pathname;
    var separator = basePath.indexOf('?') === -1 ? '?' : '&';
    return basePath + separator + paramName + '=' + encodeURIComponent(sceneId);
  }

  function buildAbsoluteUrl(relativePath, baseUrl) {
    var reference = baseUrl || window.location.origin;
    try {
      return new URL(relativePath, reference).toString();
    } catch (err) {
      return reference + relativePath;
    }
  }

  function buildQrConfig(url, options) {
    var opts = options || {};
    return {
      text: url,
      width: typeof opts.width === 'number' ? opts.width : 200,
      height: typeof opts.height === 'number' ? opts.height : 200,
      colorDark: opts.colorDark || '#000000',
      colorLight: opts.colorLight || '#ffffff',
      correctLevel: QRCode && QRCode.CorrectLevel ? (opts.correctLevel || QRCode.CorrectLevel.M) : undefined,
      margin: typeof opts.margin === 'number' ? opts.margin : 2
    };
  }

  function clearElement(element) {
    while (element && element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }

  function renderSceneQr(sceneId, container, options) {
    if (!container) {
      return null;
    }
    var qrLibrary = QRCode;
    clearElement(container);
    var targetScene = getSceneById(sceneId);
    var url = buildSceneUrl(sceneId, options);
    if (!qrLibrary || !targetScene) {
      container.textContent = '二維碼產生失敗';
      return { url: url, scene: targetScene || null, instance: null };
    }
    var config = buildQrConfig(url, options);
    var instance = new qrLibrary(container, config);
    return { url: url, scene: targetScene, instance: instance };
  }

  function generateSceneQrDataUrl(sceneId, options) {
    var qrLibrary = QRCode;
    if (!qrLibrary) {
      return null;
    }
    var tempContainer = document.createElement('div');
    var result = renderSceneQr(sceneId, tempContainer, options);
    if (!result || !tempContainer.firstChild) {
      clearElement(tempContainer);
      return null;
    }
    var canvas = tempContainer.querySelector('canvas');
    var dataUrl = canvas ? canvas.toDataURL('image/png') : null;
    clearElement(tempContainer);
    return dataUrl;
  }

  function generateAllSceneQrData(options) {
    var list = [];
    for (var i = 0; i < scenes.length; i++) {
      var scene = scenes[i];
      var url = buildSceneUrl(scene.id, options);
      var dataUrl = generateSceneQrDataUrl(scene.id, options);
      list.push({
        id: scene.id,
        name: scene.name,
        url: url,
        qrDataUrl: dataUrl
      });
    }
    return list;
  }

  MarzipanoApp.QrService = {
    buildSceneUrl: buildSceneUrl,
    getScenes: getScenes,
    getSceneById: getSceneById,
    renderSceneQr: renderSceneQr,
    generateSceneQrDataUrl: generateSceneQrDataUrl,
    generateAllSceneQrData: generateAllSceneQrData
  };
})(window);
