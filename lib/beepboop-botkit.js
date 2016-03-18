'use strict'

var deap = require('deap')

// Spawns new rtm clients on botkit controller as new teams are added
// Also closes connections and manages state as teams are removed
var BeepBoopBotkit = module.exports = function (controller, config, resourcer) {
  this.config = deap.update({
    debug: false
  }, config || {})

  this.workers = {}
  this.log = resourcer.log
  this.resourcer = resourcer
  this.controller = controller
}

BeepBoopBotkit.prototype = {

  start: function () {
    var self = this

    // Register new bot resource
    this.resourcer
      .on('add_resource', function (msg) {
        var botResource = BotResource(msg)

        if (!self.controller.handleSlackEvents || !botResource.resource.SlackBotAccessToken) {
          var err = new Error('SlackBotAccessToken not present in message: ' + JSON.stringify(botResource) + '. Bot not added.')
          self.log.error(err.toString())
        }

        self.addResource(botResource)
      })
      .on('update_resource', function (msg) {
        self.update(BotResource(msg))
      })
      .on('remove_resource', function (msg) {
        var botResource = BotResource(msg)
        self.removeResource(botResource.id)
      })
      .on('open', function () {
        // on open, remove any existing resources because since we disconnected,
        // the resourcer should have rescheduled them
        Object.keys(self.workers).forEach(function (botResourceId) {
          self.removeResource(botResourceId)
        })
      })
      .on('close', function () {
        console.log('Disconnected to Beep Boop Bot Resourcer server.')
      })
      .on('error', function (err) {
        if (err.code === 'ECONNREFUSED' && err.address === '127.0.0.1') {
          console.log('Error connecting to Beep Boop Resource server . Please review' +
            'the BeepBoop Botkit development instrutions here: https://github.com/BeepBoopHQ/beepboop-botkit')
        }
      })

    return this
  },

  addResource: function (botResource) {
    var self = this

    // check if resource (team instance) already exists. If not, add it.
    if (!this.workers.hasOwnProperty(botResource.id)) {
      var botConfig = deap.clone(botResource.resource)

      // Alias the slack token as just `token`
      if (botConfig['SlackBotAccessToken']) {
        botConfig['token'] = botConfig['SlackBotAccessToken']
      }

      botResource.worker = this.controller.spawn(botConfig)
      this.workers[botResource.id] = botResource

      botResource.worker.startRTM(function (err, bot, payload) {
        if (err) {
          return self.log.error('Could not connect to Chat Service. Error: ' + err.toString())
        }

        self.log.debug(bot.identity.name + ' (' + bot.identity.id + ') started on team ' + bot.team_info.name + ' (' + bot.team_info.id + ')')
      })
    }
  },

  // Remove the resource, then schedule the new one to be added
  updateResource: function (botResource) {
    var self = this

    this.removeResource(botResource.id)

    setTimeout(function () {
      self.addResource(botResource)
    }, 500)
  },

  removeResource: function (botResourceId) {
    if (this.workers[botResourceId]) {
      var botResource = this.workers[botResourceId]
      var worker = botResource.worker

      this.log.debug('stopping bot %s (%s)', worker.identity.name, worker.identity.id)

      // TODO: This cleanup should probably happen in botkit
      worker.rtm.removeAllListeners()
      worker.closeRTM()
      delete botResource.worker
      delete this.workers[botResourceId]
    }
  }
}

function BotResource (message) {
  return {
    id: message.resourceID,
    resource: message.resource,
    worker: null
  }
}
