// Copyright (c) CBC/Radio-Canada. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

define(['dialoger', 'text!./dialoger.html'],
    function(dialoger, template) {

        var ViewModel = function (params, componentInfo) {
            var self = this;

            self.dialoger = dialoger;
        };

        return {
            viewModel: {
                createViewModel: function(params, componentInfo) {
                    return new ViewModel(params, componentInfo);
                }
            },
            template: template
        };
    });