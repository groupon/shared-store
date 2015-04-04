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

Promise = require 'bluebird'
debug = require('debug') 'shared-store:http'
{partial} = require 'lodash'

{fromPromiseFunction} = require './promise'
onInterval = require './interval'

httpResource = ({fetch, interval}) ->
  lastETag = undefined
  lastModified = undefined
  lastBody = undefined

  wrap = (data, source) ->
    source ?= 'http'
    { data, time: Date.now(), source }

  checkModified = ({response, body, url}) ->
    {headers, statusCode} = response
    if statusCode == 304
      debug 'cache headers match'
    else
      debug 'cache header mismatch'
      lastBody = wrap body, url
      lastETag = headers.etag
      lastModified = headers['last-modified']

    lastBody

  load = partial fromPromiseFunction, ->
    fetch({
      'If-None-Match': lastETag
      'If-Modified-Since': lastModified
    }).then(checkModified)

  onInterval interval, load

module.exports = httpResource
