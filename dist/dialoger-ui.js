(function (global, factory) {
    if (typeof define === "function" && define.amd) {
        define(['exports', 'koco-dialoger'], factory);
    } else if (typeof exports !== "undefined") {
        factory(exports, require('koco-dialoger'));
    } else {
        var mod = {
            exports: {}
        };
        factory(mod.exports, global.kocoDialoger);
        global.dialogerUi = mod.exports;
    }
})(this, function (exports, _kocoDialoger) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _kocoDialoger2 = _interopRequireDefault(_kocoDialoger);

    function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : {
            default: obj
        };
    }

    var ViewModel = function ViewModel() /*componentInfo*/{
        var self = this;

        self.dialoger = _kocoDialoger2.default;
    }; // Copyright (c) CBC/Radio-Canada. All rights reserved.
    // Licensed under the MIT license. See LICENSE file in the project root for full license information.

    exports.default = ViewModel;
});