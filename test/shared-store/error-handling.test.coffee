'use strict'

assert = require 'assertive'
{Observable} = require 'rx'
tmp = require 'tmp'

SharedStore = require '../../'

describe 'SharedStore (error handling)', ->
  before (done) ->
    tmp.dir { unsafeCleanup: true }, (err, @tmpDir) => done(err)

  describe 'reading from a loader that throws an error immediately', ->
    it 'will return the error through callback', (done) ->
      thrownError = false
      store = new SharedStore
        temp: @tmpDir
        loader: Observable.create (observer) ->
          return if thrownError
          observer.onError new Error 'This throws!'
          thrownError = true

      store.init (err, data) ->
        assert.hasType undefined, data
        assert.hasType undefined, store.getCurrent()
        assert.equal 'This throws!', err.message
        done()

  describe 'reading from a loader that throws an error after a successful read', ->
    it 'will return the error through event handler', (done) ->
      thrownError = false
      store = new SharedStore
        temp: @tmpDir
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
