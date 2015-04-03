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
Promise = require 'bluebird'
freeze = require 'deep-freeze'
{property} = require 'lodash'

{cachedLoader} = require './cache'
safeMerge = require './safe-merge'

class SharedStore extends EventEmitter
  constructor: ({loader, temp, active}) ->
    EventEmitter.call this

    active ?= cluster.isMaster
    temp = path.resolve temp

    @_createStream = =>
      @subscription?.dispose()
      meta = @_createMeta()
      @stream = cachedLoader meta, loader, temp, active
      @subscription = @stream.subscribe @_handleUpdate, @_handleError

    @_createStream()

    @_cache = null
    @_retryTimeout = 1000

  getCurrent: ->
    @_cache?.data

  getCurrentWithMetaData: ->
    @_cache

  init: (options, callback) ->
    if typeof options == 'function'
      callback = options
      options = {}

    result = new Promise (resolve, reject) =>
      current = @getCurrent()
      return resolve(current) if current?

      @stream.take(1)
        .map property 'data'
        .subscribe resolve, reject

    @emit 'meta', options
    @options = options

    result.nodeify callback

  _createMeta: ->
    Observable.create (observer) =>
      @removeListener('meta', @_metaListener) if @_metaListener?
      @_metaListener = (value) -> observer.onNext value
      @on 'meta', @_metaListener

  _handleError: (err) =>
    @emit 'err', err
    setTimeout @_retry, @_retryTimeout

  _handleUpdate: ({ data, time, source, usingCache }) =>
    @_retryTimeout = 1000 if usingCache == false
    @_cache = freeze { data, time, source }

    @emit 'changed', {
      isWorker: cluster.isWorker
      id: cluster.worker?.id
    }
    @emit 'data', @_cache.data

  _retry: =>
    @_createStream()
    @emit 'meta', @options
    @_retryTimeout *= 2 # TODOCK: test me plz
    @_retryTimeout = 10000 if @_retryTimeout > 10000 # TODOCK: test me plz

SharedStore.safeMerge = safeMerge

module.exports = SharedStore
