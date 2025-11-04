'use strict';

(function(window) {
  if (!window) {
    return;
  }

  function resolveEnvironment() {
    var env = null;
    if (typeof window.MARZIPANO_APP_ENV === 'string' && window.MARZIPANO_APP_ENV) {
      env = window.MARZIPANO_APP_ENV.toLowerCase();
    }
    if (!env) {
      var hostname = '';
      if (window.location && typeof window.location.hostname === 'string') {
        hostname = window.location.hostname.toLowerCase();
      }
      if (!hostname || hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
        env = 'development';
      }
    }
    return env || 'production';
  }

  var environment = resolveEnvironment();
  var allowSceneRename = environment === 'development';

  window.MarzipanoApp = window.MarzipanoApp || {};
  window.MarzipanoApp.RuntimeConfig = {
    environment: environment,
    allowSceneRename: allowSceneRename
  };
})(window);
