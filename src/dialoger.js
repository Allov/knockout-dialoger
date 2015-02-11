define(['jquery', 'knockout', 'lodash', 'knockout-utilities'],
    function($, ko, _, koUtilities) {
        'use strict';

        //var KEYCODE_ENTER = 13;
        var KEYCODE_ESC = 27;

        function Dialoger() {
            var self = this;

            self.$document = $(document);

            koUtilities.registerComponent('dialoger', {
                basePath: 'bower_components/knockout-dialoger/src'
            });

            self.dialogConfigs = [];
            self.loadedDialogs = ko.observableArray([]);

            self.currentDialog = ko.computed(function() {
                var loadedDialogs = self.loadedDialogs();

                if (loadedDialogs.length) {
                    return loadedDialogs[loadedDialogs.length - 1];
                }

                return null;
            });

            self.isDialogOpen = ko.computed(function() {
                return !!self.currentDialog();
            });

            self.isDialogOpen.subscribe(function(isDialogOpen) {
                registerOrUnregisterHideDialogKeyboardShortcut(self, isDialogOpen);
            });

            self.currentDialogTitle = ko.computed(function() {
                var currentDialog = self.currentDialog();

                if (currentDialog) {
                    return currentDialog.title;
                }

                return '';
            });
        }

        //TODO: Passer $dialogElement en argument au lieu
        Dialoger.prototype.init = function( /*config*/ ) {
            var self = this;

            self.$dialogElement = getDialogElement();
        };

        Dialoger.prototype.showDialog = function(name, params) {
            var deferred = new $.Deferred();
            var self = this;

            var dialogConfigToShow = findByName(self.dialogConfigs, name);

            if (!dialogConfigToShow) {
                throw new Error('Dialoger.showDialog - Unregistered dialog: ' + name);
            }

            var dialog = {
                settings: {
                    close: function(data) {
                        self.loadedDialogs.remove(dialog);

                        if (self.currentDialog()) {
                            self.currentDialog().visible(true);
                        }

                        //todo: attendre apres dialog removed from html...
                        //important de le faire apres que le dialog soit enlever car
                        //la position peut ne pas etre disponible dans le dialog
                        //ceci dit... ca pourrait causer des problemes avec le paging...
                        //il faudrit bloquer le paging tant que le scroll position n'a pas été rétabli
                        self.$document.scrollTop(dialog.previousScrollPosition);


                        deferred.resolve(data);
                    },
                    params: params,
                    title: dialogConfigToShow.title
                },
                componentName: dialogConfigToShow.componentName,
                visible: ko.observable(true),
                previousScrollPosition: self.$document.scrollTop()
            };

            if (self.currentDialog()) {
                self.currentDialog().visible(false);
            }

            self.loadedDialogs.push(dialog);

            return deferred.promise();
        };

        Dialoger.prototype.hideCurrentDialog = function() {
            var currentDialog = this.currentDialog();

            if (currentDialog) {
                currentDialog.settings.close();
            }
        };

        Dialoger.prototype.registerDialog = function(name, dialogConfig) {
            if (!name) {
                throw new Error('Dialoger.registerDialog - Argument missing exception: name');
            }

            dialogConfig = dialogConfig || {};
            dialogConfig.name = name;
            var componentConfig = buildComponentConfigFromDialogConfig(name, dialogConfig);
            koUtilities.registerComponent(componentConfig.name, componentConfig);

            var finalDialogConfig = applyDialogConventions(name, dialogConfig, componentConfig);

            this.dialogConfigs.push(finalDialogConfig);
        };

        function registerOrUnregisterHideDialogKeyboardShortcut(self, isDialogOpen) {

            var hideCurrentDialog = function(e) {
                switch (e.keyCode) {
                    case KEYCODE_ESC:
                        self.hideCurrentDialog();
                        break;
                }
            };

            if (isDialogOpen) {
                self.$document.on('keydown', hideCurrentDialog);
            } else {
                self.$document.off('keydown', hideCurrentDialog);
            }
        }

        function buildComponentConfigFromDialogConfig(name, dialogConfig) {
            return {
                name: name + '-dialog',
                htmlOnly: dialogConfig.htmlOnly,
                basePath: dialogConfig.basePath,
                isBower: dialogConfig.isBower,
                type: 'dialog'
            };
        }

        function applyDialogConventions(name, dialogConfig, componentConfig) {
            var finalDialogConfig = $.extend({}, dialogConfig);

            if (!finalDialogConfig.title) {
                finalDialogConfig.title = name;
            }

            finalDialogConfig.componentName = componentConfig.name;

            return finalDialogConfig;
        }

        function getDialogElement() {
            var $dialogerElement = $('dialoger');

            if ($dialogerElement.length < 1) {
                throw new Error('Dialoger.showDialog - Cannot show dialog if dialoger component is not part of the page.');
            }

            if ($dialogerElement.length > 1) {
                throw new Error('Dialoger.showDialog - Cannot show dialog if more than one dialoger component is part of the page.');
            }

            return $dialogerElement;
        }

        function findByName(collection, name) {
            var result = _.find(collection, function(obj) {
                return obj.name === name;
            });

            return result || null;
        }


        return new Dialoger();
    });
