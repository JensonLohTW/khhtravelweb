'use strict';

(function(window, document) {
  if (!window || !document) {
    return;
  }

  var EDIT_INPUT_CLASS = 'sceneNameEditorInput';
  var EDITING_ATTRIBUTE = 'data-editing';

  function setup(options) {
    options = options || {};
    if (!options.allowRename) {
      return;
    }

    var sceneManager = options.sceneManager;
    var sceneElements = toArray(options.sceneElements);
    if (!sceneManager || typeof sceneManager.renameSceneById !== 'function') {
      console.warn('[SceneNameEditor] 場景管理器未提供 renameSceneById，無法啟用名稱編輯。');
      return;
    }
    if (!sceneElements.length) {
      return;
    }

    var context = {
      sceneManager: sceneManager,
      getBaseName: typeof options.getBaseName === 'function' ? options.getBaseName : function() { return ''; },
      saveOverride: typeof options.saveOverride === 'function' ? options.saveOverride : null,
      clearOverride: typeof options.clearOverride === 'function' ? options.clearOverride : null
    };

    for (var i = 0; i < sceneElements.length; i++) {
      bindEditor(sceneElements[i], context);
    }
  }

  function bindEditor(sceneElement, context) {
    if (!sceneElement) {
      return;
    }
    var textElement = sceneElement.querySelector('.text');
    if (!textElement) {
      return;
    }
    var sceneId = sceneElement.getAttribute('data-id');
    if (!sceneId) {
      return;
    }

    var startEditHandler = function(event) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      beginEditing(sceneElement, textElement, sceneId, context);
    };

    textElement.addEventListener('dblclick', startEditHandler);
    sceneElement.addEventListener('dblclick', startEditHandler);
  }

  function beginEditing(sceneElement, textElement, sceneId, context) {
    if (textElement.getAttribute(EDITING_ATTRIBUTE) === 'true') {
      return;
    }
    textElement.setAttribute(EDITING_ATTRIBUTE, 'true');

    var currentName = textElement.textContent || '';
    var baseName = context.getBaseName(sceneId) || currentName;

    var input = document.createElement('input');
    input.type = 'text';
    input.className = EDIT_INPUT_CLASS;
    input.value = currentName;
    input.setAttribute('aria-label', '編輯場景名稱');
    input._originalName = currentName;
    input.addEventListener('keydown', function(event) {
      if (event.key === 'Enter' || event.keyCode === 13) {
        event.preventDefault();
        finalizeEdit(sceneElement, textElement, sceneId, context, input, baseName, currentName, true);
      } else if (event.key === 'Escape' || event.keyCode === 27) {
        event.preventDefault();
        finalizeEdit(sceneElement, textElement, sceneId, context, input, baseName, currentName, false);
      }
    });
    input.addEventListener('blur', function() {
      finalizeEdit(sceneElement, textElement, sceneId, context, input, baseName, currentName, true);
    });

    while (textElement.firstChild) {
      textElement.removeChild(textElement.firstChild);
    }
    textElement.appendChild(input);

    var clickBlocker = function(event) {
      event.preventDefault();
      event.stopPropagation();
    };
    sceneElement.addEventListener('click', clickBlocker, true);

    input.focus();
    input.select();

    input._teardown = function() {
      sceneElement.removeEventListener('click', clickBlocker, true);
    };
  }

  function finalizeEdit(sceneElement, textElement, sceneId, context, input, baseName, originalName, shouldSave) {
    if (textElement.getAttribute(EDITING_ATTRIBUTE) !== 'true') {
      return;
    }
    textElement.removeAttribute(EDITING_ATTRIBUTE);
    if (input && typeof input._teardown === 'function') {
      input._teardown();
      input._teardown = null;
    }

    var finalName = originalName || '';
    var currentData = getCurrentSceneName(context.sceneManager, sceneId) || '';

    if (shouldSave) {
      var trimmed = '';
      if (input && typeof input.value === 'string') {
        trimmed = input.value.replace(/\s+/g, ' ').trim();
      }
      if (!trimmed || trimmed === baseName) {
        finalName = baseName;
        if (context.clearOverride) {
          context.clearOverride(sceneId);
        }
      } else {
        finalName = trimmed;
        if (context.saveOverride) {
          context.saveOverride(sceneId, finalName);
        }
      }

      if (context.sceneManager && typeof context.sceneManager.renameSceneById === 'function') {
        if (finalName !== currentData) {
          context.sceneManager.renameSceneById(sceneId, finalName);
        }
      }
    } else {
      finalName = currentData || originalName || '';
    }

    renderText(textElement, finalName);
  }

  function renderText(textElement, value) {
    while (textElement.firstChild) {
      textElement.removeChild(textElement.firstChild);
    }
    textElement.appendChild(document.createTextNode(value || ''));
  }

  function getCurrentSceneName(sceneManager, sceneId) {
    if (!sceneManager || typeof sceneManager.findSceneDataById !== 'function') {
      return '';
    }
    var data = sceneManager.findSceneDataById(sceneId);
    return data && data.name ? data.name : '';
  }

  function toArray(list) {
    if (!list) {
      return [];
    }
    if (Array.isArray(list)) {
      return list;
    }
    if (typeof Array.from === 'function') {
      return Array.from(list);
    }
    var result = [];
    for (var i = 0; i < list.length; i++) {
      result.push(list[i]);
    }
    return result;
  }

  window.MarzipanoApp = window.MarzipanoApp || {};
  window.MarzipanoApp.SceneNameEditor = {
    setup: setup
  };
})(window, document);
