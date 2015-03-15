'use strict';

/* global testamd */
/* global define */
/* global require */

function scriptTagCount() {
  return document.querySelectorAll('head script[data-created-by=testamd]').length;
}

describe('testamd default config', function() {
  it('baseUrl should be empty', function() {
    expect(testamd.config.baseUrl).toEqual('');
  });

  it('requireErrorHandler should be equal defaultRequireErrorHandler', function() {
    expect(testamd.config.requireErrorHandler).toEqual(testamd.defaultRequireErrorHandler);
  });

  it('defaultRequireErrorHandler should throw error', function() {
    expect(function() {
      testamd.defaultRequireErrorHandler(new Error('Test!'));
    }).toThrow(new Error('Test!'));
  });
});

describe('testamd behaviour', function() {
  beforeEach(function() {
    testamd.config.baseUrl = 'base/fixtures/';
    testamd.config.requireErrorHandler = testamd.defaultRequireErrorHandler;

    Object.keys(testamd.definitions).forEach(function(key) {
      delete testamd.definitions[key];
    });

    Object.keys(testamd.modules).forEach(function(key) {
      delete testamd.modules[key];
    });

    var scriptNodes = document.querySelectorAll('head > script[data-created-by=testamd]');
    var scripts = Array.prototype.slice.call(scriptNodes);
    scripts.forEach(function(script) {
      document.head.removeChild(script);
    });
  });

  describe('.define', function() {
    it('should check arguments', function() {
      function cb() {}

      expect(function() { define(null, ['b', 'c'], cb); }).toThrowError(testamd.TestAmdError);
      expect(function() { define(1, ['b', 'c'], cb); }).toThrowError(testamd.TestAmdError);

      expect(function() { define('a', null, cb); }).toThrowError(testamd.TestAmdError);
      expect(function() { define('a', 'b', cb); }).toThrowError(testamd.TestAmdError);

      expect(function() { define('a', ['b', 'c']); }).toThrowError(testamd.TestAmdError);
      expect(function() { define('a', 'b', 'c'); }).toThrowError(testamd.TestAmdError);
    });

    it('should define modules', function() {
      function cb1() {
      }

      function cb2() {
      }

      define('testmodule1', [], cb1);
      define('testmodule2', ['a', 'b', 'c'], cb2);

      expect(Object.keys(testamd.definitions).length).toEqual(2);

      var def1 = testamd.definitions.testmodule1;
      expect(def1.constructor).toEqual(testamd.Definition);
      expect(def1.name).toEqual('testmodule1');
      expect(def1.dependencies).toEqual([]);
      expect(def1.callback).toEqual(cb1);

      var def2 = testamd.definitions.testmodule2;
      expect(def2.constructor).toEqual(testamd.Definition);
      expect(def2.name).toEqual('testmodule2');
      expect(def2.dependencies).toEqual(['a', 'b', 'c']);
      expect(def2.callback).toEqual(cb2);
    });

    it('should throw error if a module is defined', function() {
      function cb1() {
      }

      function cb2() {
      }

      define('testmodule', ['a', 'b'], cb1);
      expect(function() {
        define('testmodule', ['c', 'd'], cb2);
      }).toThrowError(testamd.TestAmdError);

      expect(Object.keys(testamd.definitions).length).toEqual(1);

      var def = testamd.definitions.testmodule;
      expect(def.constructor).toEqual(testamd.Definition);
      expect(def.name).toEqual('testmodule');
      expect(def.dependencies).toEqual(['a', 'b']);
      expect(def.callback).toEqual(cb1);
    });
  });

  describe('.url', function() {
    it('should return full url', function() {
      testamd.config.baseUrl = 'https://example.com/js/';
      expect(testamd.url('somemodule')).toEqual(
        'https://example.com/js/somemodule.js'
      );
    });

    it('should return relative url', function() {
      testamd.config.baseUrl = '';
      expect(testamd.url('othermodule')).toEqual('othermodule.js');
    });
  });

  describe('.asyncMap', function() {
    var reading = {};
    beforeEach(function() {
      reading = {};
    });
    function asyncRead(fileName, callback) {
      reading[fileName] = callback;
    }

    it('should call a callback for empty array', function() {
      var callback = jasmine.createSpy('callback');

      testamd.asyncMap(asyncRead, [], callback);

      expect(reading).toEqual({});
      expect(callback).toHaveBeenCalledWith(null, []);
      expect(callback.calls.count()).toEqual(1);
    });

    it('should call a callback only once with all results', function() {
      var callback = jasmine.createSpy('callback');

      testamd.asyncMap(asyncRead, ['a.txt', 'b.txt', 'c.txt'], callback);
      reading['a.txt'](null, 'aaa');
      reading['b.txt'](null, 'bbb');
      reading['c.txt'](null, 'ccc');

      expect(callback).toHaveBeenCalledWith(null, ['aaa', 'bbb', 'ccc']);
      expect(callback.calls.count()).toEqual(1);
    });

    it('should preserve an order of results', function() {
      var callback = jasmine.createSpy('callback');

      testamd.asyncMap(asyncRead, ['1.txt', '2.txt', '3.txt'], callback);
      reading['3.txt'](null, '3333');
      reading['1.txt'](null, '1111');
      reading['2.txt'](null, '2222');

      expect(callback).toHaveBeenCalledWith(null, ['1111', '2222', '3333']);
      expect(callback.calls.count()).toEqual(1);
    });

    it('should call a callback for each error', function() {
      var callback = jasmine.createSpy('callback');

      testamd.asyncMap(asyncRead,
        ['1.txt', '2.txt', '3.txt', '4.txt'],
        callback
      );
      reading['3.txt'](null, '333');
      reading['1.txt'](new Error('Cannot read 1.txt!'));
      reading['4.txt'](new Error('Cannot read 4.txt!'));
      reading['2.txt'](null, '222');

      expect(callback).toHaveBeenCalledWith(new Error('Cannot read 1.txt!'));
      expect(callback).toHaveBeenCalledWith(new Error('Cannot read 4.txt!'));
      expect(callback.calls.count()).toEqual(2);
    });
  });

  describe('.loadScript', function() {
    var countIncPath;
    beforeEach(function() {
      countIncPath = testamd.config.baseUrl + 'countinc.js';
      window.COUNT = 0;
    });

    it('should load content of script', function(done) {
      testamd.loadScript(countIncPath, function(error) {
        expect(error).toBeNull();
        expect(window.COUNT).toEqual(1);
        done();
      });
    });

    it('should add script tag if new loading', function(done) {
      expect(scriptTagCount()).toEqual(0);

      testamd.loadScript(countIncPath, function(error) {
        expect(error).toBeNull();
        expect(window.COUNT).toEqual(1);
        expect(scriptTagCount()).toEqual(1);
        done();
      });
    });

    it('should use old script tag if loading in progress', function(done) {
      expect(scriptTagCount()).toEqual(0);

      testamd.loadScript(countIncPath, function(error) {
        expect(error).toBeNull();
        expect(window.COUNT).toEqual(1);
        expect(scriptTagCount()).toEqual(1);
      });

      testamd.loadScript(countIncPath, function(error) {
        expect(error).toBeNull();
        expect(window.COUNT).toEqual(1);
        expect(scriptTagCount()).toEqual(1);
        done();
      });
    });

    it('should add new script tag if prev loading is finished successfully', function(done) {
      expect(scriptTagCount()).toEqual(0);

      testamd.loadScript(countIncPath, function(error) {
        expect(error).toBeNull();
        expect(window.COUNT).toEqual(1);
        expect(scriptTagCount()).toEqual(1);

        testamd.loadScript(countIncPath, function(error) {
          expect(error).toBeNull();
          expect(window.COUNT).toEqual(2);
          expect(scriptTagCount()).toEqual(2);
          done();
        });
      });
    });

    it('should add new script tag if prev loading is failed', function(done) {
      expect(scriptTagCount()).toEqual(0);

      testamd.loadScript('404.js', function(error) {
        expect(error).not.toBeNull();
        expect(scriptTagCount()).toEqual(1);

        testamd.loadScript('404.js', function(error) {
          expect(error).not.toBeNull();
          expect(scriptTagCount()).toEqual(2);
          done();
        });
      });
    });

    it('should call all callbacks when script loaded successfully', function(done) {
      var count = 0;
      function ifCountTwoThenDone() {
        count++;
        if (count === 2) {
          done();
        }
      }

      testamd.loadScript(countIncPath, function(error) {
        expect(error).toBeNull();
        ifCountTwoThenDone();
      });

      testamd.loadScript(countIncPath, function(error) {
        expect(error).toBeNull();
        ifCountTwoThenDone();
      });
    });

    it('should pass en error to all callbacks when script loading failed', function(done) {
      var count = 0;
      function ifCountTwoThenDone() {
        count++;
        if (count === 2) {
          done();
        }
      }

      testamd.loadScript('404.js', function(error) {
        expect(error.constructor).toEqual(testamd.TestAmdError);
        ifCountTwoThenDone();
      });

      testamd.loadScript('404.js', function(error) {
        expect(error.constructor).toEqual(testamd.TestAmdError);
        ifCountTwoThenDone();
      });
    });
  });

  describe('.loadDefinition', function() {
    it('should pass definition to a callback', function(done) {
      testamd.loadDefinition('level1value3', function(error, definition) {
        expect(error).toBeNull();
        expect(definition.constructor).toEqual(testamd.Definition);
        expect(definition.name).toEqual('level1value3');
        expect(definition.dependencies).toEqual(['level0value1', 'level0value2']);
        expect(definition.callback.constructor).toEqual(Function);
        done();
      });
    });

    it('should pass error to a callback', function(done) {
      testamd.loadDefinition('notexist', function(error, definition) {
        expect(error.constructor).toEqual(testamd.TestAmdError);
        expect(definition).toBeUndefined();
        done();
      });
    });

    it('should not load script if module already defined', function(done) {
      function cb() {}
      define('notinfile', ['a'], cb);

      testamd.loadDefinition('notinfile', function(error, definition) {
        expect(error).toBeNull();
        expect(definition.constructor).toEqual(testamd.Definition);
        expect(definition.name).toEqual('notinfile');
        expect(definition.dependencies).toEqual(['a']);
        expect(definition.callback).toEqual(cb);
        done();
      });
    });
  });

  describe('.require', function() {
    it('should check arguments', function() {
      function cb() {}

      expect(function() { require(null, cb); }).toThrowError(testamd.TestAmdError);
      expect(function() { require('b', cb); }).toThrowError(testamd.TestAmdError);

      expect(function() { require(['b', 'c']); }).toThrowError(testamd.TestAmdError);
      expect(function() { require('b', 'c'); }).toThrowError(testamd.TestAmdError);
    });

    it('should require predefined modules', function(done) {
      define('m3', [], function() {
        return { value: 3 };
      });

      define('m2', ['m3'], function(m3) {
        return { value: 2 + m3.value }; // = 5
      });

      define('m1', ['m2', 'm3'], function(m2, m3) {
        return { value: 1 + m2.value + m3.value }; // 1 + 5 + 3 = 9
      });

      require(['m1', 'm2'], function(m1, m2) {
        expect(m1).toEqual({ value: 9 });
        expect(m2).toEqual({ value: 5 });
        expect(scriptTagCount()).toEqual(0);
        done();
      });
    });

    it('should require modules from files', function(done) {
      expect(scriptTagCount()).toEqual(0);

      require(['level3value32'], function(level3value32) {
        expect(level3value32).toEqual(32);
        expect(scriptTagCount()).toEqual(11);
        done();
      });
    });

    it('should detect simple cyclic dependencies', function() {
      define('a', ['b'], function() { return 1; });
      define('b', ['c'], function() { return 2; });
      define('c', ['d'], function() { return 3; });
      define('d', ['e'], function() { return 4; });
      define('e', ['f', 'b'], function() { return 5; }); // make cycle
      define('f', [], function() { return 6; });

      expect(function() {
        require(['a'], function() {
          throw new Error('Should not be executed!');
        });
      }).toThrow(
        new testamd.TestAmdError('CyclicDependencyDetected', 'a->b!->c->d->e->b!')
      );
    });

    it('should detect complex cyclic dependencies', function(done) {
      define('level0value1', ['level3value32'], function() { return 1; }); // make cycle

      testamd.config.requireErrorHandler = function(error) {
        expect(error.constructor).toEqual(testamd.TestAmdError);
        done();
      };

      require(['level3value32'], function() {
        throw new Error('Should not be executed!');
      });
    });
  });
});
