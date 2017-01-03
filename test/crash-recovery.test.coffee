'use strict'

fs = require 'fs'
childProcess = require 'child_process'

assert = require 'assertive'
{promisify} = require 'bluebird'
tmp = require 'tmp'
_ = require 'lodash'

{timestampName} = require '../lib/cache'

writeFile = promisify fs.writeFile
execFile = promisify childProcess.execFile, multiArgs: true

childPath = "#{__dirname}/crashing"

unexpected = ->
  throw new Error 'Unexpected success'

describe 'Crash recovery', ->
  before (done) ->
    process.setMaxListeners(99) # repeated process.on('exit') blab warnings
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

describe 'Crash avoidance', ->
  before (done) ->
    process.setMaxListeners(99) # repeated process.on('exit') blab warnings
    tmp.dir { unsafeCleanup: true }, (err, @tmpDir) => done(err)

  before ->
    # Write invalid JSON config
    badJSON = '{'
    writeFile "#{@tmpDir}/#{timestampName()}", badJSON

  it 'starts up anyway', ->
    env = _.extend { DEBUG: 'shared-store:cache' }, process.env
    execFile(childPath, [ @tmpDir ], { env })
      .then ([stdout, stderr]) ->
        assert.equal 'ok\n', stdout
