define(['jquery', 'knockout', 'lodash'],
    function($, ko, _) {
        'use strict';

        //var KEYCODE_ENTER = 13;
        var KEYCODE_ESC = 27;
        
        function Framework() {
            var self = this;

            self.$document = $(document);

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

        Framework.prototype.init = function( /*config*/ ) {
            var self = this;

            self.$dialogElement = getDialogElement();



            self.registerComponent('dialogs', {
                basePath: 'bower_components/rc.framework.js/dist/components/'
            });
        };

        Framework.prototype.showDialog = function(name, params) {
            var deferred = new $.Deferred();
            var self = this;

            var dialogConfigToShow = findByName(self.dialogConfigs, name);

            if (!dialogConfigToShow) {
                throw new Error('Framework.showDialog - Unregistered dialog: ' + name);
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

        Framework.prototype.hideCurrentDialog = function() {
            var currentDialog = this.currentDialog();

            if (currentDialog) {
                currentDialog.settings.close();
            }
        };

        Framework.prototype.registerDialog = function(name, dialogConfig) {
            if (!dialogConfig.name) {
                throw new Error('Framework.registerDialog - Argument missing exception: name');
            }

            var componentConfig = buildComponentConfigFromDialogConfig(dialogConfig);
            this.registerComponent(componentConfig.name, componentConfig);

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
            var $dialogsElement = $('dialogs');

            if ($dialogsElement.length < 1) {
                throw new Error('Framework.showDialog - Cannot show dialog if dialogs component is not part of the page.');
            }

            if ($dialogsElement.length > 1) {
                throw new Error('Framework.showDialog - Cannot show dialog if more than one dialogs component is part of the page.');
            }

            return $dialogsElement;
        }

        function findByName(collection, name) {
            var result = _.find(collection, function(obj) {
                return obj.name === name;
            });

            return result || null;
        }


        return new Framework();
    });
