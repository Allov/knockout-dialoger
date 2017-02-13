// Copyright (c) CBC/Radio-Canada. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import ko from 'knockout';
import _ from 'lodash';
import koco from 'koco';
import $ from 'jquery';

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

function buildComponentConfigFromDialogConfig(name, dialogConfig) {
  return {
    name: `${name}-dialog`,
    isHtmlOnly: dialogConfig.isHtmlOnly,
    basePath: dialogConfig.basePath,
    isNpm: dialogConfig.isNpm,
    type: 'dialog'
  };
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

class Dialog {
  constructor(dialoger, resolve) {
    this.dialoger = dialoger;
    this.resolve = resolve;
    this.visible = ko.observable(true);
    this.previousScrollPosition = $(document).scrollTop();
    this.isPageDialog = false;

    this.settings = {
      close: this.close.bind(this)
    };
  }

  close(data) {
    this.dialoger.popDialog(this);
    this.resolve(data);
  }
}

class RegularDialog extends Dialog {
  constructor(dialogConfigToShow, params, dialoger, resolve) {
    super(dialoger, resolve);

    this.settings.params = params;
    this.settings.title = dialogConfigToShow.title;
    this.componentName = dialogConfigToShow.componentName;
  }
}

class PageDialog extends Dialog {
  constructor(dialoger, resolve, context) {
    super(dialoger, resolve);

    // hmmm... we do this so pages can know if there are displayed inside a dialog
    // hacky.. could overwrite something
    context.page.viewModel.isDialog = true;

    this.context = ko.observable(context);

    this.context.subscribe((ctx) => {
      // hmmm... we do this so pages can know if there are displayed inside a dialog
      // hacky.. could overwrite something
      ctx.page.viewModel.isDialog = true;
    });

    this.template = ko.pureComputed(() => {
      const ctx = this.context();

      if (ctx) {
        return { nodes: ctx.page.template, data: ctx.page.viewModel };
      }

      return null;
    });
    this.isPageDialog = true;
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
    getDialogElement();

    koco.router.navigating.subscribe(this.canNavigate, this);
  }

  canNavigate(options) {
    // We assume that no links are possible in a dialog and the only navigation possible
    // would be by the back button.
    // So, in that case, we cancel navigation and simply close the dialog.

    const currentDialog = this.currentDialog();

    if (currentDialog) {
      if (!currentDialog.template && (_.isUndefined(options.replace) || options.replace === false) &&
        !_.isUndefined(this.config.allowNavigation) && this.config.allowNavigation === true) {
        this.closeAllDialogs();
        return true;
      }

      currentDialog.settings.close(null);
      return false;
    }

    return true;
  }

  closeAllDialogs() {
    while (this.isDialogOpen()) {
      this.currentDialog().settings.close(null);
    }
  }

  show(name, params) {
    return new Promise((resolve, reject) => {
      const dialogConfigToShow = findByName(this.dialogConfigs, name);

      if (!dialogConfigToShow) {
        reject(`Unregistered dialog: ${name}`);
      } else {
        const dialog = new RegularDialog(dialogConfigToShow, params, this, resolve);

        this.pushDialog(dialog);
      }
    });
  }

  showPage(url /* , params */ ) {
    return new Promise((resolve, reject) => {
      if (this.getLoadedDialogByUrl(url)) {
        reject(`Dialog for url "${url}" is already opened.`);
      } else {
        koco.router.buildNewContext(url, { force: true })
          .then((context) => {
            const dialog = new PageDialog(this, resolve, context);

            this.pushDialog(dialog);

            // must be called after the dialog is displayed!
            koco.router.postActivate(context);
          })
          .catch(reject); // todo: handle 404 vs exception
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

  close(data, dialog, resolve) {


    resolve(data);
  }

  hideCurrentDialog() {
    const currentDialog = this.currentDialog();

    if (currentDialog) {
      currentDialog.settings.close();
    }
  }

  registerDialog(name, dialogConfig) {
    if (!name) {
      throw new Error('Dialoger.registerDialog - Argument missing exception: name');
    }

    dialogConfig = dialogConfig || {};
    dialogConfig.name = name;
    const componentConfig = buildComponentConfigFromDialogConfig(name, dialogConfig);
    ko.components.register(componentConfig.name, componentConfig);

    const finalDialogConfig = applyDialogConventions(name, dialogConfig, componentConfig);

    this.dialogConfigs.push(finalDialogConfig);
  }

  getLoadedDialogByUrl(url) {
    return this.loadedDialogs().find(d =>
      d.settings.route && d.settings.route.url.toLowerCase() === url.toLowerCase()
    );
  }
}

export default new Dialoger();
