'use strict';

(function(window) {
  if (!window) {
    return;
  }

  var DEFAULT_URL = 'config/content-overrides.json';
  var EMPTY_OVERRIDES = {
    version: 1,
    scenes: {},
    hotspots: {}
  };

  function loadContentOverrides(options) {
    options = options || {};
    var url = options.url || DEFAULT_URL;

    if (typeof window.XMLHttpRequest !== 'function') {
      return Promise.resolve(cloneOverrides(EMPTY_OVERRIDES));
    }

    return new Promise(function(resolve) {
      try {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.onreadystatechange = function() {
          if (xhr.readyState !== 4) {
            return;
          }
          if (xhr.status >= 200 && xhr.status < 300 && xhr.responseText) {
            try {
              var parsed = JSON.parse(xhr.responseText);
              resolve(normalizeOverrides(parsed));
            } catch (parseError) {
              console.warn('[ConfigLoader] 無法解析覆寫檔案，改用預設設定。', parseError);
              resolve(cloneOverrides(EMPTY_OVERRIDES));
            }
          } else {
            resolve(cloneOverrides(EMPTY_OVERRIDES));
          }
        };
        xhr.onerror = function() {
          resolve(cloneOverrides(EMPTY_OVERRIDES));
        };
        xhr.send();
      } catch (err) {
        resolve(cloneOverrides(EMPTY_OVERRIDES));
      }
    });
  }

  function normalizeOverrides(source) {
    if (!source || typeof source !== 'object') {
      return cloneOverrides(EMPTY_OVERRIDES);
    }
    var normalized = {
      version: typeof source.version === 'number' ? source.version : EMPTY_OVERRIDES.version,
      scenes: {},
      hotspots: {}
    };

    if (source.scenes && typeof source.scenes === 'object') {
      for (var sceneId in source.scenes) {
        if (!Object.prototype.hasOwnProperty.call(source.scenes, sceneId)) {
          continue;
        }
        var sceneConfig = source.scenes[sceneId];
        if (!sceneConfig || typeof sceneConfig !== 'object') {
          continue;
        }
        var entry = {};
        if (typeof sceneConfig.name === 'string') {
          entry.name = sceneConfig.name;
        }
        if (Object.keys(entry).length) {
          normalized.scenes[sceneId] = entry;
        }
      }
    }

    if (source.hotspots && typeof source.hotspots === 'object') {
      for (var hotspotSceneId in source.hotspots) {
        if (!Object.prototype.hasOwnProperty.call(source.hotspots, hotspotSceneId)) {
          continue;
        }
        var hotspotConfig = source.hotspots[hotspotSceneId];
        if (!hotspotConfig || typeof hotspotConfig !== 'object') {
          continue;
        }
        var normalizedHotspotConfig = {};
        if (Array.isArray(hotspotConfig.infoHotspots)) {
          normalizedHotspotConfig.infoHotspots = hotspotConfig.infoHotspots.filter(function(item) {
            return item && typeof item === 'object' && typeof item.index === 'number';
          }).map(function(item) {
            var result = { index: item.index };
            if (typeof item.title === 'string') {
              result.title = item.title;
            }
            if (typeof item.text === 'string') {
              result.text = item.text;
            }
            return result;
          });
          if (!normalizedHotspotConfig.infoHotspots.length) {
            delete normalizedHotspotConfig.infoHotspots;
          }
        }
        if (Object.keys(normalizedHotspotConfig).length) {
          normalized.hotspots[hotspotSceneId] = normalizedHotspotConfig;
        }
      }
    }

    return normalized;
  }

  function cloneOverrides(source) {
    try {
      return JSON.parse(JSON.stringify(source));
    } catch (err) {
      return {
        version: 1,
        scenes: {},
        hotspots: {}
      };
    }
  }

  window.MarzipanoApp = window.MarzipanoApp || {};
  window.MarzipanoApp.ConfigLoader = {
    loadContentOverrides: loadContentOverrides,
    normalizeOverrides: normalizeOverrides,
    cloneOverrides: cloneOverrides,
    DEFAULT_URL: DEFAULT_URL
  };
})(window);
