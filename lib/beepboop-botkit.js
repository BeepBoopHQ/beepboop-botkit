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
      if (controller.handleSlackEvents && botResource.resource.SLACK_TOKEN) {
        self.add(botResource)
      } else {
        var err = new Error('Missing SLACK_TOKEN in request ' + JSON.stringify(botResource) + '. Bot not added.')
        console.log(err.toString())
      }
    })

    this.resourcer.on('update_resource', function (msg) {
      var botResource = self.botResFrom(msg)
      self.update(botResource)
    })

    this.resourcer.on('remove_resource', function (msg) {
      var botResource = self.botResFrom(msg)
      self.remove(botResource)
    })

    this.resourcer.on('open', function () {
      console.log('Successfully connected to the Beep Boop Bot Resourcer server. You can now simulate adding, updting, and removing your bot to Slack teams.')
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

        if (prop === 'SLACK_TOKEN') {
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
    this.remove(botResource)

    // provide a little restart breathing room
    setTimeout(function () {
      self.add(botResource)
    }, 2000)
  }

  this.remove = function (botResource) {
    if (this.workers[botResource.id]) {
      console.log(
        'stopping bot ' + this.workers[botResource.id].worker.identity.name +
        ' (' + this.workers[botResource.id].worker.identity.id + ')'
      )
      this.workers[botResource.id].worker.closeRTM()
      delete this.workers[botResource.id]
    }
  }

  this.botResFrom = function (msg) {
    return {id: msg.resourceID, resource: msg.resource}
  }
}
