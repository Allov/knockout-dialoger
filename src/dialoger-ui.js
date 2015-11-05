// Copyright (c) CBC/Radio-Canada. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

define(['dialoger'],
    function(dialoger) {
        'use strict';

        var ViewModel = function( /*componentInfo*/ ) {
            var self = this;

            self.dialoger = dialoger;
        };

        return ViewModel;
    });
