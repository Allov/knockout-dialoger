(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['exports', 'knockout', 'lodash', 'koco', 'jquery', 'koco-utils', './dialoger-event'], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports, require('knockout'), require('lodash'), require('koco'), require('jquery'), require('koco-utils'), require('./dialoger-event'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.knockout, global.lodash, global.koco, global.jquery, global.kocoUtils, global.dialogerEvent);
    global.dialoger = mod.exports;
  }
})(this, function (exports, _knockout, _lodash, _koco, _jquery, _kocoUtils, _dialogerEvent) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _knockout2 = _interopRequireDefault(_knockout);

  var _lodash2 = _interopRequireDefault(_lodash);

  var _koco2 = _interopRequireDefault(_koco);

  var _jquery2 = _interopRequireDefault(_jquery);

  var _dialogerEvent2 = _interopRequireDefault(_dialogerEvent);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  }();

  // const KEYCODE_ENTER = 13;
  var KEYCODE_ESC = 27;

  var DEFAULT_CONFIG = {
    allowNavigation: false
  };

  function registerOrUnregisterHideDialogKeyboardShortcut(self, isDialogOpen) {
    var hideCurrentDialog = function hideCurrentDialog(e) {
      switch (e.keyCode) {
        case KEYCODE_ESC:
          self.hideCurrentDialog();
          break;
      }
    };

    if (isDialogOpen) {
      (0, _jquery2.default)(document).on('keydown', hideCurrentDialog);
    } else {
      (0, _jquery2.default)(document).off('keydown', hideCurrentDialog);
    }
  }

  function applyDialogConventions(name, dialogConfig, componentConfig) {
    var finalDialogConfig = Object.assign({}, dialogConfig);

    if (!finalDialogConfig.title) {
      finalDialogConfig.title = name;
    }

    finalDialogConfig.componentName = componentConfig.name;

    return finalDialogConfig;
  }

  function getDialogElement() {
    var dialogerElements = document.getElementsByTagName('dialoger');

    if (dialogerElements.length < 1) {
      throw new Error('Dialoger.show - Cannot show dialog if dialoger component is not part of the page.');
    }

    if (dialogerElements.length > 1) {
      throw new Error('Dialoger.show - Cannot show dialog if more than one dialoger component is part of the page.');
    }

    return dialogerElements[0];
  }

  function findByName(collection, name) {
    var result = _lodash2.default.find(collection, function (obj) {
      return obj.name === name;
    });

    return result || null;
  }

  var Dialog = function () {
    function Dialog(dialoger, context, resolve, allowNavigation) {
      var _this = this;

      _classCallCheck(this, Dialog);

      this.allowNavigation = _lodash2.default.isUndefined(allowNavigation) ? true : allowNavigation;
      this.dialoger = dialoger;
      this.resolve = resolve;
      this.visible = _knockout2.default.observable(true);
      this.previousScrollPosition = (0, _jquery2.default)(document).scrollTop();
      this.isPageDialog = false;
      this.context = _knockout2.default.observable(context);
      this.template = _knockout2.default.pureComputed(function () {
        var ctx = _this.context();

        if (ctx && ctx.page) {
          return { nodes: ctx.page.template, data: ctx.page.viewModel };
        }

        return null;
      });
    }

    _createClass(Dialog, [{
      key: 'close',
      value: function close(data) {
        var _this2 = this;

        this.dialoger.navigating.canRoute().then(function (can) {
          if (can) {
            var context = _this2.context();
            if (context && (0, _kocoUtils.isFunction)(context.page.viewModel.dispose)) {
              context.page.viewModel.dispose();
            }
            _this2.dialoger.popDialog(_this2);
            _this2.resolve(data);
          }
        });
      }
    }]);

    return Dialog;
  }();

  var Dialoger = function () {
    function Dialoger() {
      var _this3 = this;

      _classCallCheck(this, Dialoger);

      this.navigating = new _dialogerEvent2.default();

      _knockout2.default.components.register('dialoger', {
        isNpm: true,
        isHtmlOnly: true
      });

      this.dialogConfigs = [];
      this.loadedDialogs = _knockout2.default.observableArray([]);
      this.isActivating = _knockout2.default.observable(false);
      this.currentDialog = _knockout2.default.computed(function () {
        var loadedDialogs = _this3.loadedDialogs();

        if (loadedDialogs.length) {
          return loadedDialogs[loadedDialogs.length - 1];
        }

        return null;
      });

      this.isDialogOpen = _knockout2.default.computed(function () {
        return !!_this3.currentDialog();
      });

      this.isDialogOpen.subscribe(function (isDialogOpen) {
        registerOrUnregisterHideDialogKeyboardShortcut(_this3, isDialogOpen);
      });

      this.currentDialogTitle = _knockout2.default.computed(function () {
        var currentDialog = _this3.currentDialog();

        if (currentDialog) {
          return currentDialog.title;
        }

        return '';
      });
    }

    _createClass(Dialoger, [{
      key: 'init',
      value: function init(config) {
        this.config = Object.assign({}, DEFAULT_CONFIG, config);

        // TODO: Passer $dialogElement en argument au lieu?
        /* this.dialogElement = */
        this.element = getDialogElement();

        _koco2.default.router.navigating.subscribe(this.canNavigate, this);
      }
    }, {
      key: 'canNavigate',
      value: function canNavigate(options) {
        var currentDialog = this.currentDialog();

        if (currentDialog) {
          if (currentDialog.allowNavigation === true) {
            if ((_lodash2.default.isUndefined(options.replace) || options.replace === false) && !_lodash2.default.isUndefined(this.config.allowNavigation) && this.config.allowNavigation === true) {
              this.closeAllDialogs();
              return true;
            }

            currentDialog.close(null);
            return false;
          }

          currentDialog.close(null);
          return false;
        }

        return true;
      }
    }, {
      key: 'closeAllDialogs',
      value: function closeAllDialogs() {
        while (this.isDialogOpen()) {
          this.currentDialog().close(null);
        }
      }
    }, {
      key: 'show',
      value: function show(name, params, allowNavigation) {
        var _this4 = this;

        return new Promise(function (resolve, reject) {
          var dialogConfigToShow = findByName(_this4.dialogConfigs, name);

          if (!dialogConfigToShow) {
            reject('Unregistered dialog: ' + name);
          } else {
            (function () {
              var dialog = new Dialog(_this4, null, resolve, allowNavigation);
              (0, _kocoUtils.activate)(dialogConfigToShow, _this4.element, {
                params: params,
                title: dialogConfigToShow.title,
                close: dialog.close.bind(dialog)
              } /* on laisse le dialog afficher son propre loader dans le cas des dialog qui ne sont pas des pages, this.isActivating */).then(function (ativationResult) {
                dialog.context({ page: ativationResult });

                _this4.pushDialog(dialog);

                (0, _kocoUtils.postActivate)(dialogConfigToShow, ativationResult.viewModel);
              });
            })();
          }
        });
      }
    }, {
      key: 'showPage',
      value: function showPage(url, allowNavigation) {
        var _this5 = this;

        return new Promise(function (resolve, reject) {
          if (_this5.getLoadedDialogByUrl(url)) {
            reject('Dialog for url "' + url + '" is already opened.');
          } else {
            _koco2.default.router.getMatchedRoute(url, { force: true }).then(function (route) {
              if (route) {
                return (0, _kocoUtils.activate)(route.page, _this5.element, { route: route, isDialog: true }, _this5.isActivating).then(function (page) {
                  return {
                    route: route,
                    page: page
                  };
                });
              }
              return Promise.reject('404 for dialog with url: ' + url);
            }).then(function (context) {
              var dialog = new Dialog(_this5, context, resolve, allowNavigation);

              _this5.pushDialog(dialog);

              // must be called after the dialog is displayed!
              (0, _kocoUtils.postActivate)(context.route.page, context.page.viewModel);
            }).catch(reject);
          }
        });
      }
    }, {
      key: 'pushDialog',
      value: function pushDialog(dialog) {
        if (this.currentDialog()) {
          this.currentDialog().visible(false);
        }

        this.loadedDialogs.push(dialog);
      }
    }, {
      key: 'popDialog',
      value: function popDialog(dialog) {
        this.loadedDialogs.remove(dialog);

        var previousDialog = this.currentDialog();

        if (previousDialog) {
          previousDialog.visible(true);
        }

        (0, _jquery2.default)(document).scrollTop(dialog.previousScrollPosition);
      }
    }, {
      key: 'hideCurrentDialog',
      value: function hideCurrentDialog() {
        var currentDialog = this.currentDialog();

        if (currentDialog) {
          currentDialog.close();
        }
      }
    }, {
      key: 'registerDialog',
      value: function registerDialog(name, dialogConfig) {
        if (!name) {
          throw new Error('Dialoger.registerDialog - Argument missing exception: name');
        }

        dialogConfig = dialogConfig || {};
        dialogConfig.name = name;
        var componentConfig = {
          name: name + '-dialog',
          isHtmlOnly: dialogConfig.isHtmlOnly,
          basePath: dialogConfig.basePath,
          isNpm: dialogConfig.isNpm,
          type: 'dialog'
        };

        var finalDialogConfig = applyDialogConventions(name, dialogConfig, componentConfig);

        this.dialogConfigs.push(finalDialogConfig);
      }
    }, {
      key: 'getLoadedDialogByUrl',
      value: function getLoadedDialogByUrl(url) {
        return this.loadedDialogs().find(function (d) {
          return d.settings.route && d.settings.route.url.toLowerCase() === url.toLowerCase();
        });
      }
    }]);

    return Dialoger;
  }();

  exports.default = new Dialoger();
});