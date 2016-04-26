'use strict'

var BeepBoop = require('beepboop')
var BeepBoopBotkit = require('./lib/beepboop-botkit')

exports.start = function (controller, config) {
  var beepboop = BeepBoop.start(config)
  var beepBoopBotkit = new BeepBoopBotkit(controller, config, beepboop)
  beepBoopBotkit.start()

  // expose botkit workers
  beepboop.workers = beepBoopBotkit.workers

  // Returns a botkit bot by Slack team id
  beepboop.botByTeamId = function (teamId) {
    // Get a handle on the team's botkit worker/bot
    var resourceId = Object.keys(beepboop.workers).filter(function (key) {
      var entry = beepboop.workers[key] || {}
      return entry.resource && entry.resource.SlackTeamID === teamId
    })[0]

    if (!resourceId) {
      return null
    }

    return beepboop.workers[resourceId].worker
  }

  // return normal beepboop emitter
  return beepboop
}
