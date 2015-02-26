'use strict'

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

path = require 'path'
fs = require 'fs'

{Observable} = require 'rx'
{promisify} = Promise = require 'bluebird'
{extend, compose} = require 'lodash'
debug = require('debug') 'shared-store:dir-content'

{fromPromiseFunction} = require './promise'

stat = promisify fs.stat
readdir = promisify fs.readdir

niceStat = (props, absolute) ->
  stat(absolute).then (info) -> extend(info, props)

dirChanges = (dir, {statFiles} = {}) ->
  statFiles ?= false

  Observable.create (observer) ->
    debug 'Create watcher: %s', dir
    watcher =
      fs.watch dir, persistent: false

    onNext = observer.onNext.bind observer
    onError = observer.onError.bind observer

    watcher.on 'error', onError

    watcher.on 'change', (event, filename) ->
      return unless filename
      debug 'File changed (%s)', event, filename
      absolute = path.join dir, filename

      props = { event, filename, absolute }

      if statFiles
        niceStat(props, absolute)
          .done onNext, (error) ->
            # This happens on file deletions and is fine.
            code = error.cause?.code
            debug 'stat failed: %s', code, filename
            return if code == 'ENOENT'
            onError error
      else
        onNext props

    return dispose = ->
      debug 'Closing watcher: %s', dir
      watcher.close()

dirContent = (dir, {watch, statFiles} = {}) ->
  statFiles ?= false
  watch ?= false

  statDir = ->
    readdir(dir).map (filename) ->
      absolute = path.join dir, filename
      props = { filename, absolute }

      if statFiles
        niceStat props, absolute
      else
        props

  initial = fromPromiseFunction(statDir)
    .flatMap(Observable.fromArray)

  if watch
    initial.concat dirChanges(dir, {statFiles})
  else
    initial

module.exports = extend dirContent, {dirChanges, niceStat}
