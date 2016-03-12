// example
'use strict'

var Botkit = require('botkit')

var config = {
  debug: true
}
var controller = Botkit.slackbot(config)

// Beepboop manages the hosting infrastructure for your bot. As part of its job,
// it publishes events when a team adds, updates, or removes the bot, thereby
// enabling multitenancy (multiple team instances of bot in one bot process).
// The beepboop-botkit package listens for those events and starts/stops the
// a given team bot automatically so you don't have to worry about it. Any state your
// bot stores outside of the config set in your project's bot.yml file, will need
// to account for multitency (if you allow multiple teams to run your bot)
var beepboop = require('../lib/beepboop-botkit.js')
beepboop.start(controller)

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
