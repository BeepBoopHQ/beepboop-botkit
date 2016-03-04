// example
'use strict'

var Botkit = require('botkit')

var config = {
  debug: false
}
var controller = Botkit.slackbot(config)

// Beepboop handles the hosting and multitenancy (mulitple teams using your bot) for you.
// Running a botkit bot on beepboop is as simple as:
var beepboop = require('./lib/beepboop-botkit').start(controller)
// Outside of this project, you should use the npm module name vs. a rel path:
// var beepboop = require('beepboop-botkit').start(controller)

// Although not necessary, you can listen for add_resource, update_resource,
// and remove_resource bot team events coming from Beepboop like so:
beepboop.on('add_resource', function (msg) {
  console.log('received request to add bot to team')
})

// Listen for botkit events
controller.on('bot_channel_join', function (bot, message) {
  bot.reply(message, 'I\'m here!')
})

controller.hears(['hi'], ['direct_message', 'direct_mention'], function (bot, evt) {
  bot.reply(evt, 'hello from bot.js')
})

controller.hears(['config'], ['direct_message', 'direct_mention'], function (bot, evt) {
  bot.reply(evt, 'CUSTOM_CONFIG_ITEM: ' + bot.config.CUSTOM_CONFIG_ITEM)
})

controller.hears(['help'], ['direct_message', 'direct_mention'], function (bot, evt) {
  var help = 'I am an efficient little bot. All you need is a single instance of me to handle ' +
      'multiple teams. If you run me on BeepBoop, I will even auto-scale! :boom:'
  bot.reply(evt, help)
})
