'use strict'

fs = require 'fs'
childProcess = require 'child_process'

assert = require 'assertive'
{promisify} = require 'bluebird'
tmp = require 'tmp'

{timestampName} = require '../lib/cache'

writeFile = promisify fs.writeFile
execFile = promisify childProcess.execFile

childPath = "#{__dirname}/crashing"

unexpected = ->
  throw new Error 'Unexpected success'

describe 'Crash recovery', ->
  before (done) ->
    tmp.dir { unsafeCleanup: true }, (err, @tmpDir) => done(err)

  before ->
    # Write known broken config
    brokenCache = JSON.stringify {
      data:
        crashing: true
    }, null, 2
    writeFile "#{@tmpDir}/#{timestampName()}", brokenCache

  it 'crashes initially', ->
    execFile(childPath, [ @tmpDir ])
      .then unexpected, (error) ->
        assert.include 'Error: Expected crash', error.message
        assert.include 'Cache reset successful', error.message

  it 'succeeds on retry', ->
    execFile(childPath, [ @tmpDir ])
      .then ([stdout, stderr]) ->
        assert.equal '', stderr
        assert.equal 'ok\n', stdout
