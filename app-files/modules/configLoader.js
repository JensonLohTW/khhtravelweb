'use strict';

(function(window) {
  console.log('[ConfigLoader] 📦 模組開始載入...');

  if (!window) {
    console.error('[ConfigLoader] ❌ window 物件不存在！');
    return;
  }

  console.log('[ConfigLoader] ✅ window 物件存在');

  var DEFAULT_URL = 'config/content-overrides.json';
  var EMPTY_OVERRIDES = {
    version: 1,
    scenes: {},
    hotspots: {}
  };

  function loadContentOverrides(options) {
    options = options || {};
    var url = options.url || DEFAULT_URL;

    // 添加版本控制：根據環境和配置決定是否添加緩存破壞參數
    var runtimeConfig = window.MarzipanoApp && window.MarzipanoApp.RuntimeConfig;
    var isDevelopment = runtimeConfig && runtimeConfig.environment === 'development';
    var cacheBusting = options.cacheBusting !== undefined ? options.cacheBusting : isDevelopment;

    if (cacheBusting) {
      var separator = url.indexOf('?') === -1 ? '?' : '&';
      url = url + separator + 'v=' + Date.now();
      console.log('[ConfigLoader] 🔄 使用緩存破壞機制載入配置:', url);
    } else {
      console.log('[ConfigLoader] 📄 載入配置文件:', url);
    }

    if (typeof window.XMLHttpRequest !== 'function') {
      console.warn('[ConfigLoader] ⚠️ XMLHttpRequest 不可用，使用空配置');
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
              var normalized = normalizeOverrides(parsed);

              // 調試日誌：顯示載入的配置內容
              console.log('[ConfigLoader] ✅ 配置載入成功');
              console.log('[ConfigLoader] 📊 配置版本:', normalized.version);
              console.log('[ConfigLoader] 🎬 場景覆寫數量:', Object.keys(normalized.scenes).length);
              console.log('[ConfigLoader] 📍 熱點覆寫數量:', Object.keys(normalized.hotspots).length);

              if (isDevelopment) {
                console.log('[ConfigLoader] 🔍 詳細配置內容:', normalized);
              }

              resolve(normalized);
            } catch (parseError) {
              console.error('[ConfigLoader] ❌ JSON 解析失敗:', parseError);
              console.warn('[ConfigLoader] 無法解析覆寫檔案，改用預設設定。', parseError);
              resolve(cloneOverrides(EMPTY_OVERRIDES));
            }
          } else {
            if (xhr.status === 404) {
              console.info('[ConfigLoader] ℹ️ 配置文件不存在 (404)，使用空配置');
            } else if (xhr.status !== 0) {
              console.warn('[ConfigLoader] ⚠️ 載入失敗 (HTTP ' + xhr.status + ')，使用空配置');
            }
            resolve(cloneOverrides(EMPTY_OVERRIDES));
          }
        };
        xhr.onerror = function() {
          console.error('[ConfigLoader] ❌ 網絡錯誤，無法載入配置文件');
          resolve(cloneOverrides(EMPTY_OVERRIDES));
        };
        xhr.send();
      } catch (err) {
        console.error('[ConfigLoader] ❌ 載入過程發生異常:', err);
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
        if (typeof sceneConfig.description === 'string') {
          entry.description = sceneConfig.description;
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
        if (Array.isArray(hotspotConfig.linkHotspots)) {
          normalizedHotspotConfig.linkHotspots = hotspotConfig.linkHotspots.filter(function(item) {
            return item && typeof item === 'object' && typeof item.target === 'string' && item.target;
          }).map(function(item) {
            var result = { target: item.target };
            if (typeof item.label === 'string') {
              result.label = item.label;
            }
            if (typeof item.body === 'string') {
              result.body = item.body;
            }
            return result;
          });
          if (!normalizedHotspotConfig.linkHotspots.length) {
            delete normalizedHotspotConfig.linkHotspots;
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

  /**
   * 配置驗證工具：在開發者控制台中使用
   * 用法：window.MarzipanoApp.ConfigLoader.debugReload()
   */
  function debugReload(options) {
    options = options || {};
    console.group('🔧 [ConfigLoader Debug] 重新載入配置');
    console.log('⏰ 時間:', new Date().toLocaleString());
    console.log('🔄 強制刷新:', options.cacheBusting !== false);

    return loadContentOverrides({
      url: options.url || DEFAULT_URL,
      cacheBusting: options.cacheBusting !== false
    }).then(function(config) {
      console.log('✅ 載入完成');
      console.table({
        '配置版本': config.version,
        '場景覆寫數': Object.keys(config.scenes).length,
        '熱點覆寫數': Object.keys(config.hotspots).length
      });

      if (Object.keys(config.scenes).length > 0) {
        console.log('📋 場景覆寫列表:', Object.keys(config.scenes));
      }
      if (Object.keys(config.hotspots).length > 0) {
        console.log('📋 熱點覆寫列表:', Object.keys(config.hotspots));
      }

      console.groupEnd();
      return config;
    }).catch(function(error) {
      console.error('❌ 載入失敗:', error);
      console.groupEnd();
      throw error;
    });
  }

  /**
   * 顯示當前配置狀態
   */
  function debugStatus() {
    console.group('🔍 [ConfigLoader Debug] 配置狀態');

    var runtimeConfig = window.MarzipanoApp && window.MarzipanoApp.RuntimeConfig;
    console.log('🌍 環境模式:', runtimeConfig ? runtimeConfig.environment : '未知');
    console.log('📁 默認路徑:', DEFAULT_URL);

    // 嘗試從 Network 中獲取最後一次請求狀態
    console.log('\n💡 提示：');
    console.log('  - 使用 debugReload() 重新載入配置');
    console.log('  - 查看 Network 標籤確認文件是否被緩存');
    console.log('  - 在 Application > Storage 中清除緩存');

    console.groupEnd();
  }

  window.MarzipanoApp = window.MarzipanoApp || {};
  window.MarzipanoApp.ConfigLoader = {
    loadContentOverrides: loadContentOverrides,
    normalizeOverrides: normalizeOverrides,
    cloneOverrides: cloneOverrides,
    debugReload: debugReload,
    debugStatus: debugStatus,
    DEFAULT_URL: DEFAULT_URL
  };

  console.log('[ConfigLoader] ✅ ConfigLoader 已註冊到 window.MarzipanoApp.ConfigLoader');
  console.log('[ConfigLoader] 🔍 檢查 RuntimeConfig:', window.MarzipanoApp.RuntimeConfig);

  // 在開發模式下，將調試工具暴露到全局以便快速訪問
  if (window.MarzipanoApp.RuntimeConfig && window.MarzipanoApp.RuntimeConfig.environment === 'development') {
    window.__reloadConfig = debugReload;
    window.__configStatus = debugStatus;
    console.log('[ConfigLoader] 💡 開發模式提示：');
    console.log('  - 使用 __reloadConfig() 重新載入配置');
    console.log('  - 使用 __configStatus() 查看配置狀態');
  } else {
    console.log('[ConfigLoader] ℹ️ 非開發模式，調試工具未暴露');
    console.log('[ConfigLoader] RuntimeConfig 狀態:', {
      exists: !!window.MarzipanoApp.RuntimeConfig,
      environment: window.MarzipanoApp.RuntimeConfig ? window.MarzipanoApp.RuntimeConfig.environment : 'undefined'
    });
  }
})(window);
