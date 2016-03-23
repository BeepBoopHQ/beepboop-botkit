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
        self.updateResource(BotResource(msg))
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
        self.log.error('Disconnected to Beep Boop Bot Resourcer server.')
      })
      .on('error', function (err) {
        if (err.code === 'ECONNREFUSED' && err.address === '127.0.0.1') {
          self.log.error('Error connecting to Beep Boop Resource server . Please review' +
            'the BeepBoop Botkit development instrutions here: https://github.com/BeepBoopHQ/beepboop-botkit')
        }
      })

    this.controller
      .on('rtm_close', function (worker) {
        self.log.error('rtm_close!!!')
      })

    return this
  },

  addResource: function (botResource) {
    var self = this

    // check if resource (team instance) already exists. If not, add it.
    if (!this.workers.hasOwnProperty(botResource.id)) {
      var botConfig = deap.clone(botResource.resource)

      // Alias the slack token as just `token` for botkit connection
      if (botConfig['SlackBotAccessToken']) {
        botConfig['token'] = botConfig['SlackBotAccessToken']
      }
      // expose resourceID so consumers can lookup by this unique key
      botConfig.resourceID = botResource.id

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

      // destory is part of the PR https://github.com/howdyai/botkit/pull/157
      if (worker.destroy) {
        worker.destroy()
      } else {
        // TODO remove after PR is merged (optimistically)
        worker.rtm.removeAllListeners()
        worker.closeRTM()
      }

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
