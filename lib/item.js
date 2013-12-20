"use strict";

function HubabubaItem(data) {
  this.id = data.id;
  this.mode = data["hub.mode"];
  this.topic = data["hub.topic"];
  this.leaseSeconds = Number(data["hub.lease_seconds"]);
}

/**
* @module HubabubaItem
*/
module.exports = HubabubaItem;