[![Build Status](https://travis-ci.org/BeepBoopHQ/beepboop-botkit.svg)](https://travis-ci.org/BeepBoopHQ/beepboop-botkit)

## beepboop-botkit - Run a multi-team botkit bot on Beep Boop.

`beepboop-botkit` allows bot developers to run a [Botkit](http://github.com/howdyai/botkit) based bot on the [Beep Boop HQ](http://beepboophq.com) bot hosting platform and support multiple teams.

Supporting multiple teams from a single bot process is made simpler as `beepboop-botkit` handles "spawning" as new teams add your bot.

## Install
`npm install --save beepboop-botkit`

## Use

```javascript
var Botkit = require('botkit')
var BeepBoop = require('beepboop-botkit')

var controller = Botkit.slackbot()
var beepboop = BeepBoop.start(controller)

// listen for botkit controller events
controller.on('bot_channel_join', function (bot, message) {
  bot.reply(message, 'I\'m here!')
})

// Optionally you may want to listen to beepboop events
beepboop.on('add_resource', function (msg) {
  console.log('received request to add bot to team')
})
```

see [examples/simple.js](https://github.com/BeepBoopHQ/beepboop-botkit/blob/master/examples/simple.js) for an example.

## Module: beepboop-botkit

Module has exported function `start`

### BeepBoop.start([options Object])

* `options.debug` Boolean - Logs debug output if true
* Returns an [EventEmitter2](https://github.com/asyncly/EventEmitter2) instance.  For more information on the events exposed, please see the underlying [`beepboop`](https://github.com/BeepBoopHQ/beepboop-js) module's documentation, as it is what is returned here.

### Accessing botkit workers

Since there can be multiple botkit workers spawned (1 for each team), these are exposed via a `workers` property on the returned beepboop instance after calling `start()`.  The `workers` property is an object hash where the key is a unique resource id identifying the worker, and the value is the [botkit worker](https://github.com/howdyai/botkit/blob/master/lib/Slackbot_worker.js) as returned from botkit's `spawn()` function. :

```javascript
var Botkit = require('botkit')
var BeepBoop = require('beepboop-botkit')

var controller = Botkit.slackbot()
var beepboop = BeepBoop.start(controller)

// after teams have been added
beepboop.on('add_resource', function (message) {
  Object.keys(beepboop.workers).forEach(function (id) {
    // this is an instance of a botkit worker
    var bot = beepboop.workers[id]
  })
})
```

### Additional Events

#### `botkit.rtm.started` - (bot, resource, meta)

+ `bot` - Botkit bot instance
+ `resource` - Beep Boop resource from an [`add_resource` message](https://github.com/BeepBoopHQ/beepboop-js#event-add_resource)
+ `meta` - additional metadata about event
 + `meta.isNew` - Boolean - `true` if this is a brand new team that was just added (only true once)

After a new Slack RTM connection has been established, useful if you want to message a user right away, or after they added the bot to their team.

```javascript
var beepboop = BeepBoop.start(controller)

// Send the user who added the bot to their team a welcome message the first time it's connected
beepboop.on('botkit.rtm.started', function (bot, resource, meta) {
  var slackUserId = resource.SlackUserID

  if (meta.isNew && slackUserId) {
    bot.api.im.open({ user: slackUserId }, function (err, response) {
      if (err) {
        return console.log(err)
      }
      var dmChannel = response.channel.id
      bot.say({channel: dmChannel, text: 'Thanks for adding me to your team!'})
      bot.say({channel: dmChannel, text: 'Just /invite me to a channel!'})
    })
  }
})
```
