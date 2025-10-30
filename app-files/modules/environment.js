'use strict';

(function(window, document) {
  if (!window) {
    return;
  }

  var DEFAULT_QUERY = '(max-width: 500px), (max-height: 500px)';

  function initialize(options) {
    options = options || {};
    var matchQuery = options.matchQuery || DEFAULT_QUERY;
    var bowser = options.bowser || window.bowser || {};

    setupDisplayMode(matchQuery);
    setupTouchDetection();
    applyLegacyFallbacks(bowser);
  }

  function setupDisplayMode(matchQuery) {
    if (!window.matchMedia) {
      document.body.classList.add('desktop');
      return;
    }

    var mediaQueryList = window.matchMedia(matchQuery);
    var setMode = function() {
      if (mediaQueryList.matches) {
        document.body.classList.remove('desktop');
        document.body.classList.add('mobile');
      } else {
        document.body.classList.remove('mobile');
        document.body.classList.add('desktop');
      }
    };

    setMode();
    if (typeof mediaQueryList.addListener === 'function') {
      mediaQueryList.addListener(setMode);
    }
  }

  function setupTouchDetection() {
    document.body.classList.add('no-touch');
    window.addEventListener('touchstart', function handleTouchStart() {
      document.body.classList.remove('no-touch');
      document.body.classList.add('touch');
    }, { once: true });
  }

  function applyLegacyFallbacks(bowser) {
    if (bowser.msie && parseFloat(bowser.version) < 11) {
      document.body.classList.add('tooltip-fallback');
    }
  }

  window.MarzipanoApp = window.MarzipanoApp || {};
  window.MarzipanoApp.Environment = {
    initialize: initialize
  };
})(window, document);
