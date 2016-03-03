// example
'use strict'

var Botkit = require('botkit')

var config = {debug: true}
var controller = Botkit.slackbot()

// Beepboop handles the hosting and multitenancy (mulitple teams using your bot) for you.
// Running a botkit bot on beepboop is as simple as:
var beepboop = require('beepboop').start(controller, config)

beepboop.on('add_resource', function (msg) {
  console.log('received request to add bot to team')
})

beepboop.on('update_resource', function (msg) {
  console.log('received request to update team bot')
})

beepboop.on('remove_resource', function (msg) {
  console.log('received request to remove team bot')
})

controller.on('bot_channel_join', function (bot, message) {
  bot.reply(message, 'I\'m here!')
})

controller.hears(['config'], ['direct_message', 'direct_mention'], function (bot, evt) {
  bot.reply(evt, 'CUSTOM_CONFIG_ITEM: ' + bot.config.CUSTOM_CONFIG_ITEM)
})

controller.hears(['help'], ['direct_message', 'direct_mention'], function (bot, evt) {
  var help = 'I am an efficient little bot. All you need is a single instance of me to handle ' +
      'multiple teams. If you run me on BeepBoop, I will even auto-scale! :boom:'
  bot.reply(evt, help)
})
