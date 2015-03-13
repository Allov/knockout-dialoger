define(['knockout', 'dialoger'],
    function(ko, dialoger) {

    	// Settings properties
    	// 	settings.dialog: Name of the dialog to be shown (must have been registered).
    	//	settings.params: Parameters to be passed to the dialoger.show() function.
    	//	settings.closed: Function to be called when the dialog has been closed.
        ko.bindingHandlers.dialogerOpener = {
            update: function(element, valueAccessor) {
                var settings = ko.utils.unwrapObservable(valueAccessor());
                var dialog = settings.dialog;
                var params = settings.params;

                if (!dialog) {
                	throw 'Dialoger opener binding handler requires a dialog to be set.';
                }

                ko.utils.registerEventHandler(element, 'click', function(event) {
                	dialoger.show(dialog, params).then(function(data) {
                		if (settings.closed) {
                			settings.closed(data);
                		}

                		element.focus();
                	});
                });
            }
        };
    });
