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

const cluster = require('cluster');

const { EventEmitter } = require('events');

const path = require('path');

const freeze = require('deep-freeze');

const { Observable } = require('rx');

const { cachedLoader, latestCacheFile } = require('./cache');

const safeMerge = require('./safe-merge');

const RETRY_MULTIPLIER = 2;
const TEN_SECONDS = 1000 * 10;
const TEN_MINUTES = 1000 * 60 * 10;

function unexpectedError(err) {
  return process.nextTick(() => {
    throw err;
  });
}

function callbackify(p, callback) {
  if ('function' !== typeof callback) {
    return p;
  }

  return p.then(callback.bind(null, null), callback).catch(unexpectedError);
}

class SharedStore extends EventEmitter {
  constructor({ loader, temp, active }) {
    super();
    this._handleError = this._handleError.bind(this);
    this._handleUpdate = this._handleUpdate.bind(this);
    this._handleMetaUpdate = this._handleMetaUpdate.bind(this);
    this._retry = this._retry.bind(this);
    this._active = active != null ? active : cluster.isMaster;
    this._temp = path.resolve(temp);

    if (this._temp === '/') {
      throw new Error('Refusing to use / as a tmp directory');
    }

    this.loader = loader;
    this._createStream();

    this.on('meta', this._handleMetaUpdate);
    this._cache = null;
    this._writeCacheFiles = !!this._active;
    this._retryTimeout = TEN_SECONDS;
  }

  setActive(
    isActive = {
      writeCacheFiles: true,
    }
  ) {
    this._active = !!isActive;

    if (isActive && typeof isActive.writeCacheFiles === 'boolean') {
      this._writeCacheFiles = isActive.writeCacheFiles;
    }

    return this._createStream();
  }

  getCurrent() {
    return this._cache != null ? this._cache.data : undefined;
  }

  getCurrentWithMetaData() {
    return this._cache;
  }

  init(options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }

    const result = new Promise((resolve, reject) => {
      if (this._cache != null) {
        return resolve(this._cache.data);
      }

      let handleData;

      const handleErr = err => {
        this.removeListener('data', handleData);
        return latestCacheFile(this._temp).subscribe(
          cache => {
            this._handleUpdate(cache);

            return resolve(cache.data);
          },
          () => reject(err)
        );
      };

      handleData = data => {
        this.removeListener('err', handleErr);
        return resolve(data);
      };

      this.once('data', handleData);
      return this.once('err', handleErr);
    });
    this.emit('meta', options);
    return callbackify(result, callback);
  }

  _createStream() {
    if (this.subscription != null) {
      this.subscription.dispose();
    }

    const meta = this._createMeta();

    this.stream = cachedLoader(
      meta,
      this.loader,
      this._temp,
      this._active,
      this._writeCacheFiles
    );
    this.subscription = this.stream.subscribe(
      this._handleUpdate,
      this._handleError
    );
    return this.subscription;
  }
  _createMeta() {
    this._metaObserver = null;
    return Observable.create(observer => {
      if (this._options != null) {
        observer.onNext(this._options);
      }

      this._metaObserver = observer;
    });
  }

  _handleError(err) {
    this.emit('err', err);
    setTimeout(this._retry, this._retryTimeout);
  }

  _handleUpdate({ data, time, source, usingCache }) {
    if (usingCache === false) {
      this._retryTimeout = TEN_SECONDS;
    }

    this._cache = freeze({
      data,
      time,
      source,
    });

    this.emit('changed', {
      isWorker: cluster.isWorker,
      id: cluster.worker != null ? cluster.worker.id : undefined,
    });

    this.emit('data', this._cache.data);
  }

  _handleMetaUpdate(_options) {
    this._options = _options;
    return this._metaObserver != null
      ? this._metaObserver.onNext(this._options)
      : undefined;
  }

  _retry() {
    this._createStream();

    this.emit('meta', this._options);
    this._retryTimeout *= RETRY_MULTIPLIER;

    if (this._retryTimeout > TEN_MINUTES) {
      this._retryTimeout = TEN_MINUTES;
    }
  }
}

SharedStore.safeMerge = safeMerge;
module.exports = SharedStore;
