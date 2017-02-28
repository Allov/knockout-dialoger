// Copyright (c) CBC/Radio-Canada. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.


// todo: reconciliate with router-event (share)

function checkSubscriber(subscribers, index) {
  return new Promise((resolve /* , reject*/ ) => {
    if (index < 0) {
      resolve(true);
    }

    const subscriber = subscribers[index];
    const handlerResult = subscriber.handler.call(subscriber.context);

    if (!handlerResult) {
      resolve(false);
    }

    Promise.all([handlerResult]).then((results) => {
      if (!results[0]) {
        resolve(false);
      } else {
        checkSubscriber(subscribers, index - 1)
          .then((r) => {
            resolve(r);
          });
      }
    });
  });
}

export default class RouterEvent {
  constructor() {
    this.subscribers = [];
  }

  subscribe(handler, context) {
    this.subscribers.push({
      handler,
      context
    });
  }

  canRoute() {
    return checkSubscriber(this.subscribers, this.subscribers.length - 1);
  }

  unsubscribe(handler, context) {
    const unsubArgs = arguments;

    this.subscribers = this.subscribers.filter((subscriber) => {
      if (unsubArgs.length === 2) {
        return subscriber.context !== context && subscriber.handler !== handler;
      }
      return subscriber.handler !== handler;
    });
  }
}
