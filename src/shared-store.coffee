###
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
###

'use strict'

path = require 'path'
cluster = require 'cluster'
{EventEmitter} = require 'events'

{Observable} = require 'rx'
Bluebird = require 'bluebird'
freeze = require 'deep-freeze'

{cachedLoader, latestCacheFile} = require './cache'
safeMerge = require './safe-merge'

RETRY_MULTIPLIER = 2
TEN_SECONDS = 1000 * 10
TEN_MINUTES = 1000 * 60 * 10

class SharedStore extends EventEmitter
  constructor: ({loader, temp, active}) ->
    EventEmitter.call this

    active ?= cluster.isMaster
    @_temp = path.resolve temp
    if @_temp == '/'
      throw new Error "Refusing to use / as a tmp directory"

    @_createStream = =>
      @subscription?.dispose()
      meta = @_createMeta()
      @stream = cachedLoader meta, loader, @_temp, active
      @subscription = @stream.subscribe @_handleUpdate, @_handleError
    @_createStream()

    @on 'meta', @_handleMetaUpdate
    @_cache = null
    @_retryTimeout = TEN_SECONDS

  getCurrent: ->
    @_cache?.data

  getCurrentWithMetaData: ->
    @_cache

  init: (options, callback) ->
    if typeof options == 'function'
      callback = options
      options = {}

    result = new Bluebird (resolve, reject) =>
      return resolve @_cache.data if @_cache?

      handleData = (data) =>
        @removeListener 'err', handleErr
        resolve data

      handleErr = (err) =>
        @removeListener 'data', handleData
        latestCacheFile(@_temp).subscribe(
          (cache) =>
            @_handleUpdate cache
            resolve cache.data
          ->
            reject err
        )

      @once 'data', handleData
      @once 'err', handleErr

    @emit 'meta', options

    result.nodeify callback

  _createMeta: ->
    @_metaObserver = null
    Observable.create (observer) =>
      observer.onNext(@_options) if @_options?
      @_metaObserver = observer

  _handleError: (err) =>
    @emit 'err', err
    setTimeout @_retry, @_retryTimeout

  _handleUpdate: ({ data, time, source, usingCache }) =>
    @_retryTimeout = TEN_SECONDS if usingCache == false
    @_cache = freeze { data, time, source }

    @emit 'changed', {
      isWorker: cluster.isWorker
      id: cluster.worker?.id
    }
    @emit 'data', @_cache.data

  _handleMetaUpdate: (@_options) =>
    @_metaObserver?.onNext @_options

  _retry: =>
    @_createStream()
    @emit 'meta', @_options
    @_retryTimeout *= RETRY_MULTIPLIER
    @_retryTimeout = TEN_MINUTES if @_retryTimeout > TEN_MINUTES

SharedStore.safeMerge = safeMerge

module.exports = SharedStore
