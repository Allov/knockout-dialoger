// Copyright (c) CBC/Radio-Canada. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import ko from 'knockout';
import _ from 'lodash';
import koco from 'koco';
import $ from 'jquery';
import { activate, postActivate, isFunction } from 'koco-utils';

// const KEYCODE_ENTER = 13;
const KEYCODE_ESC = 27;

const DEFAULT_CONFIG = {
  allowNavigation: false
};

function registerOrUnregisterHideDialogKeyboardShortcut(self, isDialogOpen) {
  const hideCurrentDialog = (e) => {
    switch (e.keyCode) {
      case KEYCODE_ESC:
        self.hideCurrentDialog();
        break;
    }
  };

  if (isDialogOpen) {
    $(document).on('keydown', hideCurrentDialog);
  } else {
    $(document).off('keydown', hideCurrentDialog);
  }
}

function applyDialogConventions(name, dialogConfig, componentConfig) {
  const finalDialogConfig = Object.assign({}, dialogConfig);

  if (!finalDialogConfig.title) {
    finalDialogConfig.title = name;
  }

  finalDialogConfig.componentName = componentConfig.name;

  return finalDialogConfig;
}

function getDialogElement() {
  const dialogerElements = document.getElementsByTagName('dialoger');

  if (dialogerElements.length < 1) {
    throw new Error('Dialoger.show - Cannot show dialog if dialoger component is not part of the page.');
  }

  if (dialogerElements.length > 1) {
    throw new Error('Dialoger.show - Cannot show dialog if more than one dialoger component is part of the page.');
  }

  return dialogerElements[0];
}

function findByName(collection, name) {
  const result = _.find(collection, obj => obj.name === name);

  return result || null;
}

function canClose(context) {
  return new Promise((resolve) => {
    if (!context || !isFunction(context.page.viewModel.canClose)) {
      resolve(true);
    } else {
      const canClosePromise = context.page.viewModel.canClose.call(context.page.viewModel);
      Promise.all([canClosePromise])
        .then((results) => {
          resolve(results[0]);
        });
    }
  });
}

class Dialog {
  constructor(dialoger, context, resolve, allowNavigation, isPageDialog) {
    this.allowNavigation = _.isUndefined(allowNavigation) ? true : allowNavigation;
    this.dialoger = dialoger;
    this.resolve = resolve;
    this.visible = ko.observable(true);
    this.previousScrollPosition = $(document).scrollTop();
    this.isPageDialog = isPageDialog;
    this.context = ko.observable(context);
    this.template = ko.pureComputed(() => {
      const ctx = this.context();

      if (ctx && ctx.page) {
        return { nodes: ctx.page.template, data: ctx.page.viewModel };
      }

      return null;
    });
  }

  close(data) {
    const context = this.context();

    return canClose(context)
      .then((can) => {
        if (can) {
          const context = this.context();
          if (context && isFunction(context.page.viewModel.dispose)) {
            context.page.viewModel.dispose();
          }
          this.dialoger.popDialog(this);
          this.resolve(data);
        }
      });
  }
}

class Dialoger {
  constructor() {
    ko.components.register('dialoger', {
      isNpm: true,
      isHtmlOnly: true
    });

    this.dialogConfigs = [];
    this.loadedDialogs = ko.observableArray([]);
    this.isActivating = ko.observable(false);
    this.currentDialog = ko.computed(() => {
      const loadedDialogs = this.loadedDialogs();

      if (loadedDialogs.length) {
        return loadedDialogs[loadedDialogs.length - 1];
      }

      return null;
    });

    this.isDialogOpen = ko.computed(() =>
      !!this.currentDialog()
    );

    this.isDialogOpen.subscribe((isDialogOpen) => {
      registerOrUnregisterHideDialogKeyboardShortcut(this, isDialogOpen);
    });

    this.currentDialogTitle = ko.computed(() => {
      const currentDialog = this.currentDialog();

      if (currentDialog) {
        return currentDialog.title;
      }

      return '';
    });
  }

  init(config) {
    this.config = Object.assign({}, DEFAULT_CONFIG, config);

    // TODO: Passer $dialogElement en argument au lieu?
    /* this.dialogElement = */
    this.element = getDialogElement();

    koco.router.navigating.subscribe(this.canNavigate, this);
  }

  canNavigate(options) {
    const currentDialog = this.currentDialog();

    if (currentDialog) {
      if (currentDialog.allowNavigation === true) {
        if ((_.isUndefined(options.replace) || options.replace === false) &&
          !_.isUndefined(this.config.allowNavigation) && this.config.allowNavigation === true) {
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

  closeAllDialogs() {
    if (this.isDialogOpen()) {
      this.currentDialog().close(null).then(() => this.closeAllDialogs());
    }
  }

  show(name, params, allowNavigation) {
    return new Promise((resolve, reject) => {
      const dialogConfigToShow = findByName(this.dialogConfigs, name);

      if (!dialogConfigToShow) {
        reject(`Unregistered dialog: ${name}`);
      } else {
        const dialog = new Dialog(this, null, resolve, allowNavigation, false);
        activate(dialogConfigToShow, this.element, {
            params: params,
            title: dialogConfigToShow.title,
            close: dialog.close.bind(dialog)
          } /* on laisse le dialog afficher son propre loader dans le cas des dialog qui ne sont pas des pages, this.isActivating */ )
          .then((ativationResult) => {
            dialog.context({ page: ativationResult });

            this.pushDialog(dialog);

            postActivate(dialogConfigToShow, ativationResult.viewModel);
          });
      }
    });
  }

  showPage(url, allowNavigation) {
    return new Promise((resolve, reject) => {
      if (this.getLoadedDialogByUrl(url)) {
        reject(`Dialog for url "${url}" is already opened.`);
      } else {
        koco.router.getMatchedRoute(url, { force: true })
          .then((route) => {
            if (route) {
              return activate(route.page, this.element, { route: route, isDialog: true }, this.isActivating)
                .then(page => ({
                  route: route,
                  page: page
                }));
            }
            return Promise.reject(`404 for dialog with url: ${url}`);
          })
          .then((context) => {
            const dialog = new Dialog(this, context, resolve, allowNavigation, true);

            this.pushDialog(dialog);

            // must be called after the dialog is displayed!
            postActivate(context.route.page, context.page.viewModel);
          })
          .catch(reject);
      }
    });
  }

  pushDialog(dialog) {
    if (this.currentDialog()) {
      this.currentDialog().visible(false);
    }

    this.loadedDialogs.push(dialog);
  }

  popDialog(dialog) {
    this.loadedDialogs.remove(dialog);

    const previousDialog = this.currentDialog();

    if (previousDialog) {
      previousDialog.visible(true);
    }

    $(document).scrollTop(dialog.previousScrollPosition);
  }

  hideCurrentDialog() {
    const currentDialog = this.currentDialog();

    if (currentDialog) {
      currentDialog.close();
    }
  }

  registerDialog(name, dialogConfig) {
    if (!name) {
      throw new Error('Dialoger.registerDialog - Argument missing exception: name');
    }

    dialogConfig = dialogConfig || {};
    dialogConfig.name = name;
    const componentConfig = {
      name: `${name}-dialog`,
      isHtmlOnly: dialogConfig.isHtmlOnly,
      basePath: dialogConfig.basePath,
      isNpm: dialogConfig.isNpm,
      type: 'dialog'
    };

    const finalDialogConfig = applyDialogConventions(name, dialogConfig, componentConfig);

    this.dialogConfigs.push(finalDialogConfig);
  }

  getLoadedDialogByUrl(url) {
    return this.loadedDialogs().find(d =>
      d.context && d.context.route && d.context.route.url.toLowerCase() === url.toLowerCase()
    );
  }
}

export default new Dialoger();
