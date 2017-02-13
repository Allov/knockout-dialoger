(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['exports', 'knockout', 'lodash', 'koco', 'jquery'], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports, require('knockout'), require('lodash'), require('koco'), require('jquery'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.knockout, global.lodash, global.koco, global.jquery);
    global.dialoger = mod.exports;
  }
})(this, function (exports, _knockout, _lodash, _koco, _jquery) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _knockout2 = _interopRequireDefault(_knockout);

  var _lodash2 = _interopRequireDefault(_lodash);

  var _koco2 = _interopRequireDefault(_koco);

  var _jquery2 = _interopRequireDefault(_jquery);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  function _possibleConstructorReturn(self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return call && (typeof call === "object" || typeof call === "function") ? call : self;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
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

  function buildComponentConfigFromDialogConfig(name, dialogConfig) {
    return {
      name: name + '-dialog',
      isHtmlOnly: dialogConfig.isHtmlOnly,
      basePath: dialogConfig.basePath,
      isNpm: dialogConfig.isNpm,
      type: 'dialog'
    };
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
    function Dialog(dialoger, resolve) {
      _classCallCheck(this, Dialog);

      this.dialoger = dialoger;
      this.resolve = resolve;
      this.visible = _knockout2.default.observable(true);
      this.previousScrollPosition = (0, _jquery2.default)(document).scrollTop();
      this.isPageDialog = false;

      this.settings = {
        close: this.close.bind(this)
      };
    }

    _createClass(Dialog, [{
      key: 'close',
      value: function close(data) {
        this.dialoger.popDialog(this);
        this.resolve(data);
      }
    }]);

    return Dialog;
  }();

  var RegularDialog = function (_Dialog) {
    _inherits(RegularDialog, _Dialog);

    function RegularDialog(dialogConfigToShow, params, dialoger, resolve) {
      _classCallCheck(this, RegularDialog);

      var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(RegularDialog).call(this, dialoger, resolve));

      _this.settings.params = params;
      _this.settings.title = dialogConfigToShow.title;
      _this.componentName = dialogConfigToShow.componentName;
      return _this;
    }

    return RegularDialog;
  }(Dialog);

  var PageDialog = function (_Dialog2) {
    _inherits(PageDialog, _Dialog2);

    function PageDialog(dialoger, resolve, context) {
      _classCallCheck(this, PageDialog);

      var _this2 = _possibleConstructorReturn(this, Object.getPrototypeOf(PageDialog).call(this, dialoger, resolve));

      // hmmm... we do this so pages can know if there are displayed inside a dialog
      // hacky.. could overwrite something
      context.page.viewModel.isDialog = true;

      _this2.context = _knockout2.default.observable(context);

      _this2.context.subscribe(function (ctx) {
        // hmmm... we do this so pages can know if there are displayed inside a dialog
        // hacky.. could overwrite something
        ctx.page.viewModel.isDialog = true;
      });

      _this2.template = _knockout2.default.pureComputed(function () {
        var ctx = _this2.context();

        if (ctx) {
          return { nodes: ctx.page.template, data: ctx.page.viewModel };
        }

        return null;
      });
      _this2.isPageDialog = true;
      return _this2;
    }

    return PageDialog;
  }(Dialog);

  var Dialoger = function () {
    function Dialoger() {
      var _this3 = this;

      _classCallCheck(this, Dialoger);

      _knockout2.default.components.register('dialoger', {
        isNpm: true,
        isHtmlOnly: true
      });

      this.dialogConfigs = [];
      this.loadedDialogs = _knockout2.default.observableArray([]);

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
        getDialogElement();

        _koco2.default.router.navigating.subscribe(this.canNavigate, this);
      }
    }, {
      key: 'canNavigate',
      value: function canNavigate(options) {
        // We assume that no links are possible in a dialog and the only navigation possible
        // would be by the back button.
        // So, in that case, we cancel navigation and simply close the dialog.

        var currentDialog = this.currentDialog();

        if (currentDialog) {
          if (!currentDialog.template && (_lodash2.default.isUndefined(options.replace) || options.replace === false) && !_lodash2.default.isUndefined(this.config.allowNavigation) && this.config.allowNavigation === true) {
            this.closeAllDialogs();
            return true;
          }

          currentDialog.settings.close(null);
          return false;
        }

        return true;
      }
    }, {
      key: 'closeAllDialogs',
      value: function closeAllDialogs() {
        while (this.isDialogOpen()) {
          this.currentDialog().settings.close(null);
        }
      }
    }, {
      key: 'show',
      value: function show(name, params) {
        var _this4 = this;

        return new Promise(function (resolve, reject) {
          var dialogConfigToShow = findByName(_this4.dialogConfigs, name);

          if (!dialogConfigToShow) {
            reject('Unregistered dialog: ' + name);
          } else {
            var dialog = new RegularDialog(dialogConfigToShow, params, _this4, resolve);

            _this4.pushDialog(dialog);
          }
        });
      }
    }, {
      key: 'showPage',
      value: function showPage(url /* , params */) {
        var _this5 = this;

        return new Promise(function (resolve, reject) {
          if (_this5.getLoadedDialogByUrl(url)) {
            reject('Dialog for url "' + url + '" is already opened.');
          } else {
            _koco2.default.router.buildNewContext(url, { force: true }).then(function (context) {
              var dialog = new PageDialog(_this5, resolve, context);

              _this5.pushDialog(dialog);

              // must be called after the dialog is displayed!
              _koco2.default.router.postActivate(context);
            }).catch(reject); // todo: handle 404 vs exception
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
      key: 'close',
      value: function close(data, dialog, resolve) {

        resolve(data);
      }
    }, {
      key: 'hideCurrentDialog',
      value: function hideCurrentDialog() {
        var currentDialog = this.currentDialog();

        if (currentDialog) {
          currentDialog.settings.close();
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
        var componentConfig = buildComponentConfigFromDialogConfig(name, dialogConfig);
        _knockout2.default.components.register(componentConfig.name, componentConfig);

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