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
fs = require 'fs'

{promisify} = require 'bluebird'
{Observable} = require 'rx'
mkdirp = require 'mkdirp'
{identity, isEqual, property, partial} = require 'lodash'
debug = require('debug') 'shared-store:cache'

{fromPromiseFunction} = require './promise'
dirContent = require './dir-content'
latestFile = require './latest-file'
crashRecovery = require './crash-recovery'

writeFile = promisify fs.writeFile
readFile = promisify fs.readFile
unlink = promisify fs.unlink
mkdirpStream = Observable.fromNodeCallback mkdirp

isCacheFile = ({filename}) ->
  /[\d-]+T[\d]+Z\.json/.test filename

@timestampName = timestampName = ->
  date = new Date().toISOString().replace(/[:.]/g, '')
  "#{date}.json"

sortByMostRecent = (files) ->
  files.sort (a, b) ->
    b.mtime.getTime() - a.mtime.getTime()

cleanup = (tmpDir) ->
  dirContent(tmpDir, watch: false, statFiles: true)
    .filter isCacheFile
    .toArray().flatMap sortByMostRecent
    .skip 5
    .map(property 'absolute')
    .subscribe unlink # enforce side effects

readCacheFile = ({absolute}) ->
  readFile(absolute).then(JSON.parse).then ({ data, time }) ->
    { data, time, source: absolute, usingCache: true }

latestCacheFile = (tmpDir, watch = false) ->
  options = { watch, filter: isCacheFile }
  latestFile(tmpDir, options).flatMap readCacheFile

writeCache = (tmpDir, changed) ->
  writeIfChanged = (latest) ->
    if latest? && isEqual(changed.data, latest.data)
      debug 'Latest cache file matches'
      Observable.just latest
    else
      filename = path.join tmpDir, timestampName()
      debug 'Writing new cache file', filename
      serialized = JSON.stringify changed, null, 2
      fromPromiseFunction -> writeFile(filename, serialized)
        .map -> changed # return the data

  mkdirpStream(tmpDir)
    .flatMap -> tryCache tmpDir
    .defaultIfEmpty()
    .flatMap writeIfChanged
    .finally -> cleanup(tmpDir)

tryCache = (tmpDir) ->
  latestCacheFile(tmpDir, false)
    .catch (error) ->
      if error.code == 'ENOENT'
        debug 'No cache file found'
        Observable.empty()
      else
        Observable.throw error

activeLoader = (meta, loader, tmpDir) ->
  rawData = meta
    .flatMapLatest(loader)
    .map (data) ->
      data.usingCache = false
      data

  insurance = crashRecovery tmpDir

  data = rawData.tap(insurance.onDataLoaded).publish()
  fromCache = tryCache tmpDir

  data.connect()

  cachedData = fromCache
    .takeUntil(data)
    .merge(data)
    .distinctUntilChanged property('data'), isEqual
    .flatMapLatest partial(writeCache, tmpDir)
    .publish()

  cachedData.connect()

  return cachedData

passiveLoader = (tmpDir) ->
  rawData = latestCacheFile(tmpDir, true)

  data = rawData.publish()
  data.connect()
  return data

@cachedLoader = (meta, loader, tmpDir, active) ->
  debug 'cachedLoader(%j)', active
  if active then activeLoader(meta, loader, tmpDir)
  else passiveLoader(tmpDir)
