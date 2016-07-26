// Load dependencies
var Base = require('basejs')

// Import internal VARS
var INTERNAL = require('./internal.js')

// Import ActionCable
var ActionCableClass = require('./action_cable.js')
// //
var ActionCable = new ActionCableClass().self
// //
module.exports = ActionCable
