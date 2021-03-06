var _                 = require('lodash');
var fs                = require('fs');
var Hapi              = require('hapi');
var path              = require('path');
var requireDirectory  = require('require-directory');
var yml               = require('js-yaml');
var nodeJSX           = require('node-jsx');
var Hoek              = require('hoek');
var events            = require('events');
var util              = require('util');

nodeJSX.install({ extension: '.jsx' });

function Nuts() { }

util.inherits(Nuts, events.EventEmitter);

Nuts.prototype.require = function(modulePath) {
  return require(path.join(this.root, modulePath));
}

Nuts.prototype.reportError = function(err, raise) {
  this.log('error', err.message);

  if(this.isDevelopment) {
    this.log(err.stack);
  }

  if(this.settings.bugsnag) {
    require('bugsnag').notify(err);
  }

  if(raise) throw err;
}

Nuts.prototype.deez = function(opts) {

  var defaultOptions = {
    blacklistedConfigs: [
      'database',
      'kue',
      'mandrill',
      'redis',
      'session',
      'port'
    ]
  };

  this.options = Hoek.applyToDefaults(defaultOptions, opts || {});

  // Initialize settings
  this.environment = (process.env.NODE_ENV || 'development'),
  this.root = path.normalize(path.join(__dirname, '../../'));
  this.isDevelopment = (this.environment == 'development');

  // Load the settings file
  var configFilePath = path.join(this.root, 'config/settings.yml');

  // Parse the file as lodash template to get environment variables
  renderedSettingsTemplate = _.template(fs.readFileSync(configFilePath), {});

  // Parse the settings as a yml file
  settingsYml = yml.safeLoad(renderedSettingsTemplate);

  // Only get the settings for the current environment
  this.settings = settingsYml[this.environment];
  this.safeSettings = _.omit(this.settings, this.options.blacklistedConfigs);

  // Initialize Hapi server
  this.server = new Hapi.Server();

  if(this.environment !== 'test') {
    this.server.connection({port: this.settings.port});
  }

  // Setup logging
  this.log = this.environment === 'test' ? function() {} : this.server.log.bind(this.server);

  // Initialize DB
  this.mongoose = require('./db').connect();

  // Initialize Models
  this.models = requireDirectory(module, path.join(this.root, 'app/models'));
  this.log('info', 'Loaded models');

  // Load Environments
  this.require('./config/environments').apply(this);
  this.log('info', 'Loaded environment');

  // Load Initializers
  require('./initializers').apply(this);
  this.log('info', 'Loaded initializers');

  // Load Actions
  this.actions = requireDirectory(module, path.join(this.root, 'app/actions'));
  this.log('info', 'Loaded actions');

  // Load Routes
  this.server.route(this.require('./config/routes'));
  this.log('info', 'Loaded routes');

  return this;
};

Nuts.prototype.console = function() {
  var repl  = require('repl');
  var util  = require('util');
  var eyes  = require('eyes');

  // open the repl session
  var replServer = repl.start({
    prompt: util.format("%s (%s) > ", this.settings.app_name, this.environment)
  });
}

Nuts.prototype.run = function() {
  var self = this;
  this.server.start(function () {
    self.log('info', 'Server running at: ' + self.server.info.uri);
  });
}

module.exports = GLOBAL.Nuts = new Nuts();
