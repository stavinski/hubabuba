"use strict";

/**
* @class HubabubaItem
* @property {number} id - the id of the subscription item
* @property {string} mode - either "subscribe" or "unsubscribe"
* @property {string} topic - the topic that the item is associated with
* @property {number} leaseSeconds - the number of seconds the item is active for with the hub
*/
function HubabubaItem(data) {
  this.id = data.id;
  this.mode = data["hub.mode"];
  this.topic = data["hub.topic"];
  this.leaseSeconds = Number(data["hub.lease_seconds"]);
}

module.exports = HubabubaItem;