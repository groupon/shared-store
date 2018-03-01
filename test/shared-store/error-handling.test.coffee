'use strict'

assert = require 'assertive'
{Observable} = require 'rx'
tmp = require 'tmp'

{promisify} = require 'bluebird'
childProcess = require 'child_process'
execFile = promisify childProcess.execFile, multiArgs: true

SharedStore = require '../../'

describe 'SharedStore (error handling)', ->
  describe 'reading from a loader that throws an error immediately', ->
    describe 'with no cache', ->
      tmpDir = null
      before (done) ->
        tmp.dir { unsafeCleanup: true }, (err, tmpDirParam) ->
          tmpDir = tmpDirParam
          done(err)
        return

      it 'will return the error through callback', (done) ->
        thrownError = false
        store = new SharedStore
          temp: tmpDir
          loader: Observable.create (observer) ->
            return if thrownError
            observer.onError new Error 'This throws!'
            thrownError = true

        store.init (err, data) ->
          assert.hasType undefined, data
          assert.hasType undefined, store.getCurrent()
          assert.equal 'This throws!', err.message
          done()
        null
        return

    describe 'with a cache', ->
      tmpDir = null
      childPath = null
      before (done) ->
        childPath = "#{__dirname}/file-store-with-cache"
        tmp.dir { unsafeCleanup: true }, (err, tmpDirParam) ->
          tmpDir = tmpDirParam
          store = new SharedStore
            temp: tmpDir
            loader: -> Observable.just {data: 'tastic'}
          store.init (storeErr, data) ->
            done(storeErr)
        return

      it 'warns about Syntax Error and returns cache through callback & getCurrent', (done) ->
        execFile(childPath, [ tmpDir ])
          .then ([stdout, stderr]) ->
            assert.include 'Syntax Error', stderr
            assert.include 'data: tastic', stdout
            assert.include 'getCurrent: tastic', stdout
            assert.include 'err: null', stdout
          .finally(done)
        return

  describe 'reading from a loader that throws an error after a successful read', ->
    tmpDir = null
    before (done) ->
      tmp.dir { unsafeCleanup: true }, (err, tmpDirParam) ->
        tmpDir = tmpDirParam
        done(err)
      return

    it 'will return the error through event handler', (done) ->
      thrownError = false
      store = new SharedStore
        temp: tmpDir
        loader: Observable.create (observer) ->
          observer.onNext {data: {}}
          setTimeout ->
            return if thrownError
            observer.onError new Error '¡Ay, caramba!'
            thrownError = true
          , 500

      store.init (err, data) ->
        assert.equal null, err
        assert.deepEqual {}, data

      store.on 'err', (err) ->
        assert.equal '¡Ay, caramba!', err.message
        done()
      return
