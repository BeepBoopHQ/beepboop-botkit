# WIP - Not ready for use.

## beepboop-botkit - Run a botkit bot on Beep Boop.

beepboop-botkit allows bot developers to run a [Botkit](http://github.com/howdyai/botkit) based bot on the [Beep Boop HQ](http://beepboophq.com) bot hosting platform.

Supporting multiple teams from a single bot process is made simpler as beepboop-botkit handles "spawning" as new teams add your bot.

## Install
`npm install --save beepboop-botkit`

## Use
  var Botkit = require('botkit')

  var controller = Botkit.slackbot()
  require(__dirname + '/lib/beepboop-botkit.js').start(controller)

  // listen for botkit controller events

  controller.on('bot_channel_join', function (bot, message) {
    bot.reply(message, 'I\'m here!')
  })

You may (but don't necessarily need to) listen for and act on events coming from Beep Boop as such:

  var beepboop = require(__dirname + '/lib/beepboop-botkit.js').start(controller)

  beepboop.on('add_resource', function (msg) {
    console.log('received request to add bot to team')
  })

see `bot.js` for an example.

## Module: beepboop-botkit events

Module has exported function `start`

### beepboop.start([options])

* `options` Object
  * `debug` Boolean

### Event: 'open'

`function () { }`

Emitted when the connection is established.

### Event: 'error'

`function (error) { }`

If the client emits an error, this event is emitted (errors from the underlying `net.Socket` are forwarded here).

### Event: 'close'

`function (code, message) { }`

Is emitted when the connection is closed. `code` is defined in the WebSocket specification.

The `close` event is also emitted when then underlying `net.Socket` closes the connection (`end` or `close`).

### Event: 'add_resource'

`function (message) { }`

Is emitted when an add_resource message has been received and a bot has been spawned for the given team.

### Event: 'update_resource'

`function (message) { }`

Is emitted when an update_resource message is received and the bot instance has been updated.


### Event: 'remove_resource'

`function (message) { }`

Is emitted when an remove_resource message is received (team owner stopped a bot) and the bot instance has been de-spawned.
