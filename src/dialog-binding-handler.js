// Copyright (c) CBC/Radio-Canada. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

define(['knockout', 'dialoger'],
    function(ko, dialoger) {

        // Simple use: dialog: 'dialog-name'
        // Advanced use: dialog: { name: 'dialog-name', params: { ..params to pass to the dialog }, closed: func, failed: func }

        // Options properties
        //  options.name: Name of the dialog to be shown (must have been registered).
        //  options.params: Parameters to be passed to the dialoger.show() function.
        //  options.closed: Function to be called when the dialog has been closed.
        //  options.failed: Function to be called when the dialog failed to open.
        ko.bindingHandlers.dialog = {
            update: function(element, valueAccessor) {
                var options = getOptions(valueAccessor);

                if (!options.name) {
                    throw 'Dialog binding handler requires a name to be set.';
                }

                ko.applyBindingsToNode(element, {
                    click: function(event) {
                        dialoger.show(options.name, options.params)
                            .then(options.closed, options.failed)
                            .always(function() {
                                element.focus();
                            });
                    }
                });
            }
        };

        function getOptions(valueAccessor) {
            var value = ko.unwrap(valueAccessor());
            var options = {};

            if (typeof value === 'string') {
                options.name = value;
            } else {
                options = {
                    name: ko.unwrap(value.name),
                    params: ko.unwrap(value.params),
                    closed: ko.unwrap(value.closed),
                    failed: ko.unwrap(value.failed)
                };
            }

            return options;
        }
    });
