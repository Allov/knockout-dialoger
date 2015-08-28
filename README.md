# koco dialoger

koco dialoger is a knockout component used to display full screen dialogs. It is an opinionated component based on the [Koco generator](https://github.com/cbcrc/generator-koco).

## Table of contents

- [Installation](#installation)
- [Usage](#usage)
- [Registering a dialog](#registering-a-dialog)
- [Creating a dialog component](#creating-a-dialog-component)
    - [JavaScript UI handler](#javascript-ui-handler)
    - [HTML presentation](#html-presentation)
- [Using a dialog](#using-a-dialog)
    - [Displaying a dialog](#displaying-a-dialog)
    - [Closing and returning data from a dialog](#closing-and-returning-data-from-a-dialog)
    - [Dialog inception](#dialog-inception)

## Installation

```bash
bower install koco-dialoger
```

## Usage

In your startup file, we need to do a number of things in order to fully initialize the dialoger:

### startup.js

```javascript
define(['knockout', 'dialoger'],
    function(ko, dialoger) {
        'use strict';

        // First: registering a dialog.
        dialoger.registerDialog('dialog_name', {
                title: 'dialog_title'
        });

        // Second: bind the Knockout ViewModel with the dialoger object.
        ko.applyBindings({
                dialoger: dialoger
                // other objects come here
        });

        // Third: initialize the dialoger.
        dialoger.init();

        // There's one (optional) config property that can be passed to
        // init, 'allowNavigation'. If passed as true, then if navigation
        // is initiated all open dialogs will be closed and navigation
        // will proceed. That would look like:
        // dialoger.init({ allowNavigation: true });
    });
```

### index.html

```html
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Test</title>
    </head>
    <body>
        <dialoger data-bind="visible: dialoger.isDialogOpen" params="{ title: dialoger.currentDialogTitle }"></dialoger>
    </body>
</html>
```

## Registering a dialog

To register a dialog, you have to use the `registerDialog` function:

```javascript
dialoger.registerDialog(name, options)
```

### `name` parameter

The name of the knockout component being added. `-dialog` will be appended automatically at the end.

### `options` parameter

The options to be used when creating the dialog.

```javascript
{
    title: string       // defines the title of the dialog when displaying.
    isBower: boolean    // defines if the component comes from bower, a default bower path will be used.
    basePath: string    // the base path to be use to find the component. It has to be the root of the default files (see below).
    htmlOnly: boolean   // when creating a dialog, it is possible that there would be no JavaScript linked to this dialog, it will assume so and load the html file using the naming convention (see below).
}
```

## Creating a dialog component

The creation of a dialog is based on the knockout component system.

### JavaScript UI handler

By convention, the name of the file has to be `[name]-dialog-ui.js`, `[name]` being the name of your new dialog. This file has to return a Knockout component structure.

```javascript
define(["text!./test-dialog.html", "knockout"], // beware of the first parameter where you have to define the html file to be used.
    function(template, ko) {
        'use strict';

        var ViewModel = function(params, componentInfo) {
            var self = this;

            self.title = params.title;

            self.close = function() {
                params.close();
            };

            return self;
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
```

### HTML presentation

When using a JavaScript UI handler, the name of this file has to be defined by you. However, if using the htmlOnly option, the component will be loading [name]-dialog.html by convention.

```html
<div class="navbar navbar-default navbar-fixed-top navbar-inverse">
    <div class="container">
        <a class="navbar-brand" data-bind="html: title"></a>
    </div>
</div>

<div class="container">
    <h1 class="page-header" data-bind="text: title"></h1>
    <p>This is a test dialog.</p>
</div>

<nav class="navbar navbar-default navbar-fixed-bottom navbar-inverse">
    <div class="container">
        <button class="btn btn-default post-button pull-left" data-bind="click: close, clickBubble: false">
            <i class="fa fa-arrow-left"></i>
            <span>Close</span>
        </button>
    </div>
</nav>
```

## Using a dialog

Now that you created a dialog, you may want to display it and get data from it.

### Displaying a dialog

To show a dialog, you have to use the `show()` function.

```javascript
dialoger.show(name)
```

This function returns a `jQuery promise` and will resolve itself when the dialog is closed.

### Closing and returning data from a dialog

Upon displaying a dialog, it will present itself in fullscreen and blocking interface. The close button and any data to be transfered to the caller have to be handled by the callee.

#### Returing data

The [JavaScript UI handler](#javascript-ui-handler) will receive a `close` function in its `params` parameter.

```javascript
close(data);
```

The `data` parameter is an object and will be passed as-is to the caller.

Since `show` returns a promise, you have to use the `then` function to claim the returned data.

```javascript
dialoger.show('name').then(function(data) {
        console.log(data);
    });
```

#### Closing

To close a dialog, simply call `close()` without any parameter.

### Using the dialog binding handler

A `binding handler` comes with `dialoger` to help you display dialogs efficiently.

```html
<button type="button" data-bind="dialog: 'name'"></button>
```

The `binding handler` will handle clicks and set the focus back on the button once it is closed. There are several parameters that can be used:

```javascript
{
    name: 'name',           // name of the dialog to be shown
    params: {},             // parameters to be passed to the dialog.
    closed: function(data), // callback when the dialog is closed
    failed: function(err),  // callback when the dialog has failed. Note that this is called when there is an actual error, not when the user click cancel.
}
```

```html
<button type="button" data-bind="dialog: { name: 'name', closed: callbackClosed }"></button>
```

### Dialog inception

Dialoger is able to stack multiple instances of the same dialog or different ones. The `close` function will fall back to the most recently opened dialog.