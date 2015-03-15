'use strict';

var testamd; /* exported testamd */
var define; /* exported define */
var require; /* exported require */

/**
 * AMD implementation.
 */
(function(exports) {
  exports.testamd = {};

  var config = {
    baseUrl: '', // base url for script loading
    requireErrorHandler: function(error) { throw error; } // what to do when can't require a module
  };
  exports.testamd.config = config;
  exports.testamd.defaultRequireErrorHandler = config.requireErrorHandler;

  /**
   * Module's definitions described by 'define' function.
   * @type {Object.<string, Definition>}
   */
  var definitions = {};
  exports.testamd.definitions = definitions;

  /**
   * Loaded module.
   * @typedef {Object} Module
   */

  /**
   * Loaded modules.
   * @type {Object.<string, Module>}
   */
  var modules = {};
  exports.testamd.modules = modules;

  /**
   * Module definition.
   * @param {string} name - name of module
   * @param {string[]} dependencies - names of dependencies.
   * @param {function} callback - should return a module.
   * @constructor
   */
  function Definition(name, dependencies, callback) {
    this.name = name;
    this.dependencies = dependencies;
    this.callback = callback;
  }
  exports.testamd.Definition = Definition;

  /**
   * Define a module.
   * @param {string} name - name of a defined module.
   * @param {string[]} dependencies - names of dependencies.
   * @param {function(...Module)} callback - should return a module.
   */
  function define(name, dependencies, callback) {
    if (typeof name !== 'string') {
      throw new TestAmdError('DefineArgError', 'Name ' + name + ' should be string!');
    }
    if (!dependencies || dependencies.constructor !== Array) {
      throw new TestAmdError(
        'DefineArgError', 'Dependencies ' + dependencies + ' should be array!'
      );
    }
    if (typeof callback !== 'function') {
      throw new TestAmdError('DefineArgError', 'Callback ' + callback + ' should be function!');
    }

    if (definitions.hasOwnProperty(name)) {
      throw new TestAmdError('ModuleAlreadyDefined', 'Module ' + name +
        ' is already defined!');
    }

    definitions[name] = new Definition(name, dependencies, callback);
  }
  exports.define = define;

  /**
   * Require dependencies and pass them to callback.
   * @param {string[]} dependencies - names of dependencies.
   * @param {function(...Module)} callback
   * @throws TestAmdError - throws asynchronously. Can be changed in config.requireErrorHandler.
   */
  function require(dependencies, callback) {
    if (!dependencies || dependencies.constructor !== Array) {
      throw new TestAmdError(
        'RequireArgError', 'Dependencies ' + dependencies + ' should be array!'
      );
    }
    if (typeof callback !== 'function') {
      throw new TestAmdError('RequireArgError', 'Callback ' + callback + ' should be function!');
    }

    loadModules([], dependencies, function(error, injection) {
      if (error) { config.requireErrorHandler(error); }

      callback.apply(null, injection);
    });
  }
  exports.require = require;

  /**
   * Error from TestAmd.
   * @param {string} name
   * @param {string} message
   * @constructor
   * @extends Error
   */
  function TestAmdError(name, message) {
    this.name = name;
    this.message = message;
  }
  TestAmdError.prototype = Object.create(Error.prototype);
  TestAmdError.prototype.constructor = TestAmdError;
  exports.testamd.TestAmdError = TestAmdError;

  /**
   * Load each module and pass that modules to callback.
   * @param {string[]} loadModuleChain - for detect cyclic dependencies.
   *   Grows only in loadModule function.
   * @param {string[]} names - module's names to load.
   * @param {function(Error, Module[])} callback
   */
  function loadModules(loadModuleChain, names, callback) {
    asyncMap(loadModule.bind(null, loadModuleChain), names, callback);
  }

  /**
   * Load module and pass it to callback.
   * @param {string[]} loadModuleChain - for detect cyclic dependencies.
   *   Grows only in loadModule function.
   * @param {string} name - module name.
   * @param {function(Error, Module)} callback
   */
  function loadModule(loadModuleChain, name, callback) {
    if (modules.hasOwnProperty(name)) {
      callback(null, modules[name]);
      return;
    }

    // load module definition and then load module dependencies (recursively)
    loadDefinition(name, function(error, definition) {
      if (error) {
        callback(error);
        return;
      }

      var newLoadModuleChain = loadModuleChain.concat(name);
      if (loadModuleChain.indexOf(name) !== -1) { // name already in loadModuleChain
        var message = newLoadModuleChain.map(function(dep) {
          return dep === name ? dep + '!' : dep;
        }).join('->');
        callback(new TestAmdError('CyclicDependencyDetected', message));
      }

      loadModules(newLoadModuleChain, definition.dependencies, function(error, injection) {
        if (error) {
          callback(error);
          return;
        }

        modules[name] = definition.callback.apply(null, injection);

        callback(null, modules[name]);
      });
    });
  }

  /**
   * Load module definition and run callback.
   * @param {string} name - module name.
   * @param {function(Error, Definition)} callback
   */
  function loadDefinition(name, callback) {
    if (definitions.hasOwnProperty(name)) {
      callback(null, definitions[name]);
      return;
    }

    var urlToScript = url(name);
    loadScript(urlToScript, function(error) {
      if (error) {
        callback(error);
        return;
      }

      if (!definitions.hasOwnProperty(name)) {
        callback(new TestAmdError('ModuleIsntDefinedAfterLoadScript',
          'Module ' + name + ' is not defined after load ' +
            urlToScript + ' script!'
        ));
        return;
      }

      callback(null, definitions[name]);
    });
  }
  exports.testamd.loadDefinition = loadDefinition;

  /**
   * Run async function for each array element and then call the callback.
   * If errors happen then the callback will be called for each error.
   * If no errors then the callback will be called one time for all results
   * (order preserved).
   * @param {function(element, function(Error, result))} asyncFunc -
   *   should call function(Error, result) only once.
   * @param {element[]} array
   * @param {function(error, result[])} callback
   */
  function asyncMap(asyncFunc, array, callback) {
    if (array.length === 0) {
      callback(null, []);
      return;
    }

    var results = new Array(array.length);
    var unprocessed = array.length;

    array.forEach(function(element, index) {
      asyncFunc(element, function(error, result) {
        if (error) {
          callback(error);
          return;
        }

        results[index] = result;
        unprocessed--;

        if (unprocessed === 0) {
          callback(null, results);
        }
      });
    });
  }
  exports.testamd.asyncMap = asyncMap;

  /**
   * Script tags which are attached to the document but not loaded/failed.
   * @type {Object.<src, scriptTag>}
   */
  var loadingScriptTags = {};

  /**
   * Load script and run callback.
   * @param {string} src
   * @param {function(Error)} callback
   */
  function loadScript(src, callback) {
    function loading(src, scriptTag) { loadingScriptTags[src] = scriptTag; }
    function loaded(src) { delete loadingScriptTags[src]; }

    function onLoad() {
      loaded(src);
      callback(null);
    }
    function onError() {
      loaded(src);
      callback(new TestAmdError('LoadScriptError', 'Load ' + src + ' script error!'));
    }

    var script;
    if (loadingScriptTags.hasOwnProperty(src)) {
      script = loadingScriptTags[src];
      script.addEventListener('load', onLoad);
      script.addEventListener('error', onError);
    } else {
      script = document.createElement('script');
      script.setAttribute('async', 'async');
      script.setAttribute('data-created-by', 'testamd');
      script.addEventListener('load', onLoad);
      script.addEventListener('error', onError);
      loading(src, script);
      script.src = src;
      document.head.appendChild(script);
    }
  }
  exports.testamd.loadScript = loadScript;

  /**
   * Get url to module.
   * @param {string} name - module name.
   * @returns {string} url
   */
  function url(name) {
    return config.baseUrl + name + '.js';
  }
  exports.testamd.url = url;
})(window);
