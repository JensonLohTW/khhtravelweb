'use strict';

(function(window, document) {
  if (!window) {
    return;
  }

  var EVENT_LIST = ['touchstart', 'touchmove', 'touchend', 'touchcancel', 'wheel', 'mousewheel'];

  function createFactory(config) {
    config = config || {};
    var switchSceneById = config.switchSceneById || function() {};
    var findSceneDataById = config.findSceneDataById || function() { return null; };

    function createLinkHotspotElement(hotspot) {
      var wrapper = document.createElement('div');
      wrapper.classList.add('hotspot', 'link-hotspot');

      var icon = document.createElement('img');
      icon.src = 'img/link.png';
      icon.classList.add('link-hotspot-icon');

      var transformProperties = ['-ms-transform', '-webkit-transform', 'transform'];
      for (var i = 0; i < transformProperties.length; i++) {
        icon.style[transformProperties[i]] = 'rotate(' + hotspot.rotation + 'rad)';
      }

      wrapper.addEventListener('click', function() {
        switchSceneById(hotspot.target);
      });

      stopTouchAndScrollEventPropagation(wrapper);

      var tooltip = document.createElement('div');
      tooltip.classList.add('hotspot-tooltip', 'link-hotspot-tooltip');
      var sceneData = findSceneDataById(hotspot.target);
      tooltip.textContent = sceneData ? sceneData.name : '';

      wrapper.appendChild(icon);
      wrapper.appendChild(tooltip);

      wrapper.setAttribute('data-target-scene', hotspot.target || '');

      wrapper._getLinkTooltip = function() {
        return tooltip;
      };

      return wrapper;
    }

    function createInfoHotspotElement(hotspot) {
      var wrapper = document.createElement('div');
      wrapper.classList.add('hotspot', 'info-hotspot');

      var header = document.createElement('div');
      header.classList.add('info-hotspot-header');

      var iconWrapper = document.createElement('div');
      iconWrapper.classList.add('info-hotspot-icon-wrapper');
      var icon = document.createElement('img');
      icon.src = 'img/info.png';
      icon.classList.add('info-hotspot-icon');
      iconWrapper.appendChild(icon);

      var titleWrapper = document.createElement('div');
      titleWrapper.classList.add('info-hotspot-title-wrapper');
      var title = document.createElement('div');
      title.classList.add('info-hotspot-title');
      title.innerHTML = hotspot.title;
      titleWrapper.appendChild(title);

      var closeWrapper = document.createElement('div');
      closeWrapper.classList.add('info-hotspot-close-wrapper');
      var closeIcon = document.createElement('img');
      closeIcon.src = 'img/close.png';
      closeIcon.classList.add('info-hotspot-close-icon');
      closeWrapper.appendChild(closeIcon);

      header.appendChild(iconWrapper);
      header.appendChild(titleWrapper);
      header.appendChild(closeWrapper);

      var text = document.createElement('div');
      text.classList.add('info-hotspot-text');
      text.innerHTML = hotspot.text;

      wrapper.appendChild(header);
      wrapper.appendChild(text);

      var modal = document.createElement('div');
      modal.innerHTML = wrapper.innerHTML;
      modal.classList.add('info-hotspot-modal');
      document.body.appendChild(modal);

      var toggle = function() {
        wrapper.classList.toggle('visible');
        modal.classList.toggle('visible');
      };

      wrapper.querySelector('.info-hotspot-header').addEventListener('click', toggle);
      modal.querySelector('.info-hotspot-close-wrapper').addEventListener('click', toggle);

      stopTouchAndScrollEventPropagation(wrapper);

      return wrapper;
    }

    return {
      createLinkHotspotElement: createLinkHotspotElement,
      createInfoHotspotElement: createInfoHotspotElement
    };
  }

  function stopTouchAndScrollEventPropagation(element) {
    for (var i = 0; i < EVENT_LIST.length; i++) {
      element.addEventListener(EVENT_LIST[i], function(event) {
        event.stopPropagation();
      });
    }
  }

  window.MarzipanoApp = window.MarzipanoApp || {};
  window.MarzipanoApp.Hotspots = {
    createFactory: createFactory
  };
})(window, document);
