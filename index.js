'use strict'

var BeepBoop = require('beepboop')
var BeepBoopBotkit = require('./lib/beepboop-botkit')

exports.start = function (controller, config) {
  var beepboop = BeepBoop.start(config)
  var beepBoopBotkit = new BeepBoopBotkit(controller, config, beepboop)
  beepBoopBotkit.start()

  // expose botkit workers
  beepboop.workers = beepBoopBotkit.workers

  // return normal beepboop emitter
  return beepboop
}
