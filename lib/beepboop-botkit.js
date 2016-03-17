'use strict'

var beepboop = require('beepboop')
var deap = require('deap')

exports.start = function (controller, config) {
  config = parseConfig(config)
  var resourcer = beepboop.start(config)
  var beepBoopBotkit = new BeepBoopBotkit(controller, config, resourcer)
  beepBoopBotkit.start()

  return resourcer
}

function parseConfig (options) {
  return deap.update({
    debug: false
  }, options || {})
}

function BeepBoopBotkit (controller, config, resourcer) {
  this.workers = {}
  this.controller = controller
  this.resourcer = resourcer
  this.config = config

  this.start = function () {
    var self = this

    this.resourcer.on('add_resource', function (msg) {
      var botResource = self.botResFrom(msg)
      if (controller.handleSlackEvents && botResource.resource.SlackBotAccessToken) {
        self.add(botResource)
      } else {
        var err = new Error('SlackBotAccessToken not present in message: ' + JSON.stringify(botResource) + '. Bot not added.')
        console.log(err.toString())
      }
    })

    this.resourcer.on('update_resource', function (msg) {
      var botResource = self.botResFrom(msg)
      self.update(botResource)
    })

    this.resourcer.on('remove_resource', function (msg) {
      var botResource = self.botResFrom(msg)
      self.remove(botResource.id)
    })

    this.resourcer.on('open', function () {
      console.log('Connected to Beep Boop Bot Resourcer server.')

      // on open, remove any existing resources because since we disconnected,
      // the resourcer should have rescheduled them
      Object.keys(self.workers).forEach(function (botResourceId) {
        self.remove(botResourceId)
      })
    })

    this.resourcer.on('close', function () {
      console.log('Disconnected to Beep Boop Bot Resourcer server.')
    })

    this.resourcer.on('error', function (err) {
      if (err.code === 'ECONNREFUSED' && err.address === '127.0.0.1') {
        console.log('Error connecting to Beep Boop Resource server . Please review' +
          'the BeepBoop Botkit development instrutions here: https://github.com/BeepBoopHQ/beepboop-botkit')
      }
    })
  }

  this.add = function (botResource) {
    var self = this

    // prepare to enrich with config coming from resource server
    var botConfig = this.config

    // check if resource (team instance) already exists. If not, add it.
    if (!this.workers.hasOwnProperty(botResource.id)) {
      this.workers[botResource.id] = botResource

      for (var prop in botResource.resource) {
        botConfig[prop] = botResource.resource[prop]

        if (prop === 'SlackBotAccessToken') {
          botConfig['token'] = botResource.resource[prop]
        }
      }

      var worker = this.controller.spawn(botConfig)
      worker.startRTM(function (err, bot, payload) {
        if (err) {
          // TODO need to think about what to do here.
          throw new Error('Could not connect to Chat Service. Error: ' + err.toString())
        } else {
          console.log(bot.identity.name + ' (' + bot.identity.id + ') started on team ' + bot.team_info.name + ' (' + bot.team_info.id + ')')
        }
      })
      self.workers[botResource.id]['worker'] = worker
    }
  }

  this.update = function (botResource) {
    var self = this
    this.remove(botResource.id)

    // provide a little restart breathing room
    setTimeout(function () {
      self.add(botResource)
    }, 500)
  }

  this.remove = function (botResourceId) {
    if (this.workers[botResourceId]) {
      console.log(
        'stopping bot ' + this.workers[botResourceId].worker.identity.name +
        ' (' + this.workers[botResourceId].worker.identity.id + ')'
      )
      this.workers[botResourceId].worker.closeRTM()
      delete this.workers[botResourceId]
    }
  }

  this.botResFrom = function (msg) {
    return {id: msg.resourceID, resource: msg.resource}
  }
}
