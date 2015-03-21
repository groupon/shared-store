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

    meta = Observable.create (observer) =>
      @on 'meta', (value) -> observer.onNext value

    @stream = cachedLoader(
      meta, loader, temp, active, @emit.bind(this, 'error')
    )

    @_receivedData = false
    @_subscription = @stream.subscribe @_handleUpdate, @_handleError

    @_cache = null

  getCurrent: ->
    @_cache?.data

  getCurrentWithMetaData: ->
    @_cache

  init: (options, callback) ->
    if typeof options == 'function'
      callback = options
      options = {}

    result = new Promise (resolve, reject) =>
      @stream.take(1)
        .map property 'data'
        .subscribe resolve, reject

    @emit 'meta', options

    result.nodeify callback

  _handleError: (err) =>
    return unless @_receivedData # pass err to init callback
    @emit 'error', err

  _handleUpdate: ({ data, time, source }) =>
    @_receivedData = true
    @_cache = freeze {data, time, source}

    @emit 'changed', {
      isWorker: cluster.isWorker
      id: cluster.worker?.id
    }
    @emit 'data', @_cache.data

SharedStore.safeMerge = safeMerge

module.exports = SharedStore
