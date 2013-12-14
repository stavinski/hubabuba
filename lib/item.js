"use strict";

function HubabubaItem(data) {
  this.id = data.id;
  this.mode = data["hub.mode"];
  this.topic = data["hub.topic"];
  this.leaseSeconds = parseInt(data["hub.lease_seconds"]);
}

module.exports = HubabubaItem;