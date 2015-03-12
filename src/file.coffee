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

fs = require 'fs'
path = require 'path'

{promisify} = Promise = require 'bluebird'
{partial, identity} = require 'lodash'
CSON = require 'cson-parser'
debug = require('debug') 'shared-store:file'

{fromPromiseFunction} = require './promise'
onInterval = require './interval'
{dirChanges} = require './dir-content'

readFile = promisify fs.readFile

fileChanges = (filename, options) ->
  dirChanges(path.dirname(filename), options)
    .filter ({absolute}) -> absolute == filename

isMissingError = (error) ->
  error.cause && error.cause.code == 'ENOENT'

parserFromExtension = (filename) ->
  switch path.extname filename
    when '.json' then JSON.parse
    when '.cson' then CSON.parse
    else identity

fileContent = (filename, options = {}) ->
  {defaultValue, watch, interval, parse, root} = options
  filename = path.resolve root, filename if root?
  parse ?= parserFromExtension filename
  hasDefault = defaultValue != undefined
  debug 'fileContent, watch: %j', !!watch, filename

  returnDefault = (error) ->
    if hasDefault then defaultValue
    else Promise.reject error

  loaded = (content) ->
    debug 'Parsing %j', content

  wrap = (data) ->
    { data, time: Date.now(), source: filename }

  load = partial fromPromiseFunction, ->
    debug 'readFile %s', filename
    readFile(filename, 'utf8')
      .tap loaded
      .then parse
      .then wrap
      .catch isMissingError, returnDefault

  if watch
    load().concat fileChanges(filename).flatMap(load)
  else
    onInterval interval, load

module.exports = fileContent
