'use strict'

// TODO: point to npm
var beepboop = require(__dirname + '/../../beepboop-js/lib/beepboop.js')

exports.start = function (controller, config) {
  var resourcer = beepboop.start(config)
  var beepBoopBotkit = new BeepBoopBotkit(controller, config, resourcer)
  beepBoopBotkit.start()

  return resourcer
}

function BeepBoopBotkit (controller, config, resourcer) {
  this.workers = {}
  this.controller = controller
  this.resourcer = resourcer
  this.config = config

  this.start = function () {
    var self = this

    this.resourcer.on('message.add_resource', function (msg) {
      var botResource = self.botResFrom(msg)

      if (controller.handleSlackEvents && botResource.resource.SLACK_TOKEN) {
        self.add(botResource)
      } else {
        var err = new Error('Error. Attempting to use botkit slackbot but no SLACK_TOKEN is available')
        console.log(JSON.stringify(err))
        this.resourcer.emit('error', err)
      }
    })

    this.resourcer.on('message.update_resource', function (msg) {
      var botResource = self.botResFrom(msg)
      self.update(botResource)
    })

    this.resourcer.on('message.remove_resource', function (msg) {
      var botResource = self.botResFrom(msg)
      self.remove(botResource)
    })
  }

  this.botResFrom = function (msg) {
    return {id: msg.resourceID, resource: msg.resource}
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

      this.controller.spawn(botConfig, function (worker) {
        self.workers[botResource.id]['worker'] = worker
        // TODO: we might want to collect workers to retry startRTM if it fails in the next step.
      })
        .startRTM(function (err, bot, payload) {
          if (err) {
            throw new Error('Could not connect to Chat Service. Error: ' + err.toString())
          }
          console.log(bot.identity.name + ' (' + bot.identity.id + ') started on team ' + bot.team_info.name + ' (' + bot.team_info.id + ')')
        })
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
    console.log('in resourcer.remove. botResource.id is: ' + botResource.id)
    if (this.workers[botResource.id]) {
      console.log(
        'stopping bot ' + this.workers[botResource.id].worker.identity.name +
        ' (' + this.workers[botResource.id].worker.identity.id + ')'
      )
      this.workers[botResource.id].worker.closeRTM()
      delete this.workers[botResource.id]
    }
  }
}
