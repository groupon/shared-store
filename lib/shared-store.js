
/*
Copyright (c) 2015, Groupon, Inc.
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions
are met:

Redistributions of source code must retain the above copyright notice,
this list of conditions and the following disclaimer.

Redistributions in binary form must reproduce the above copyright
notice, this list of conditions and the following disclaimer in the
documentation and/or other materials provided with the distribution.

Neither the name of GROUPON nor the names of its contributors may be
used to endorse or promote products derived from this software without
specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
'use strict';
var EventEmitter, Observable, RETRY_MULTIPLIER, SharedStore, TEN_MINUTES, TEN_SECONDS, cachedLoader, callbackify, cluster, freeze, latestCacheFile, path, ref, safeMerge, unexpectedError,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

path = require('path');

cluster = require('cluster');

EventEmitter = require('events').EventEmitter;

Observable = require('rx').Observable;

freeze = require('deep-freeze');

ref = require('./cache'), cachedLoader = ref.cachedLoader, latestCacheFile = ref.latestCacheFile;

safeMerge = require('./safe-merge');

RETRY_MULTIPLIER = 2;

TEN_SECONDS = 1000 * 10;

TEN_MINUTES = 1000 * 60 * 10;

unexpectedError = function(err) {
  return process.nextTick(function() {
    throw err;
  });
};

callbackify = function(p, callback) {
  if ('function' !== typeof callback) {
    return p;
  }
  return p.then(callback.bind(null, null), callback)["catch"](unexpectedError);
};

SharedStore = (function(superClass) {
  extend(SharedStore, superClass);

  function SharedStore(arg) {
    var active, loader, temp;
    loader = arg.loader, temp = arg.temp, active = arg.active;
    this._retry = bind(this._retry, this);
    this._handleMetaUpdate = bind(this._handleMetaUpdate, this);
    this._handleUpdate = bind(this._handleUpdate, this);
    this._handleError = bind(this._handleError, this);
    EventEmitter.call(this);
    this._active = active != null ? active : cluster.isMaster;
    this._temp = path.resolve(temp);
    if (this._temp === '/') {
      throw new Error("Refusing to use / as a tmp directory");
    }
    this._createStream = (function(_this) {
      return function() {
        var meta, ref1;
        if ((ref1 = _this.subscription) != null) {
          ref1.dispose();
        }
        meta = _this._createMeta();
        _this.stream = cachedLoader(meta, loader, _this._temp, _this._active, _this._writeCacheFiles);
        return _this.subscription = _this.stream.subscribe(_this._handleUpdate, _this._handleError);
      };
    })(this);
    this._createStream();
    this.on('meta', this._handleMetaUpdate);
    this._cache = null;
    this._writeCacheFiles = !!this._active;
    this._retryTimeout = TEN_SECONDS;
  }

  SharedStore.prototype.setActive = function(isActive) {
    if (isActive == null) {
      isActive = {
        writeCacheFiles: true
      };
    }
    this._active = !!isActive;
    if (isActive && typeof isActive.writeCacheFiles === 'boolean') {
      this._writeCacheFiles = isActive.writeCacheFiles;
    }
    return this._createStream();
  };

  SharedStore.prototype.getCurrent = function() {
    var ref1;
    return (ref1 = this._cache) != null ? ref1.data : void 0;
  };

  SharedStore.prototype.getCurrentWithMetaData = function() {
    return this._cache;
  };

  SharedStore.prototype.init = function(options, callback) {
    var result;
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    result = new Promise((function(_this) {
      return function(resolve, reject) {
        var handleData, handleErr;
        if (_this._cache != null) {
          return resolve(_this._cache.data);
        }
        handleData = function(data) {
          _this.removeListener('err', handleErr);
          return resolve(data);
        };
        handleErr = function(err) {
          _this.removeListener('data', handleData);
          return latestCacheFile(_this._temp).subscribe(function(cache) {
            _this._handleUpdate(cache);
            return resolve(cache.data);
          }, function() {
            return reject(err);
          });
        };
        _this.once('data', handleData);
        return _this.once('err', handleErr);
      };
    })(this));
    this.emit('meta', options);
    return callbackify(result, callback);
  };

  SharedStore.prototype._createMeta = function() {
    this._metaObserver = null;
    return Observable.create((function(_this) {
      return function(observer) {
        if (_this._options != null) {
          observer.onNext(_this._options);
        }
        return _this._metaObserver = observer;
      };
    })(this));
  };

  SharedStore.prototype._handleError = function(err) {
    this.emit('err', err);
    return setTimeout(this._retry, this._retryTimeout);
  };

  SharedStore.prototype._handleUpdate = function(arg) {
    var data, ref1, source, time, usingCache;
    data = arg.data, time = arg.time, source = arg.source, usingCache = arg.usingCache;
    if (usingCache === false) {
      this._retryTimeout = TEN_SECONDS;
    }
    this._cache = freeze({
      data: data,
      time: time,
      source: source
    });
    this.emit('changed', {
      isWorker: cluster.isWorker,
      id: (ref1 = cluster.worker) != null ? ref1.id : void 0
    });
    return this.emit('data', this._cache.data);
  };

  SharedStore.prototype._handleMetaUpdate = function(_options) {
    var ref1;
    this._options = _options;
    return (ref1 = this._metaObserver) != null ? ref1.onNext(this._options) : void 0;
  };

  SharedStore.prototype._retry = function() {
    this._createStream();
    this.emit('meta', this._options);
    this._retryTimeout *= RETRY_MULTIPLIER;
    if (this._retryTimeout > TEN_MINUTES) {
      return this._retryTimeout = TEN_MINUTES;
    }
  };

  return SharedStore;

})(EventEmitter);

SharedStore.safeMerge = safeMerge;

module.exports = SharedStore;
