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
      store = new SharedStore
        temp: @tmpDir
        loader: Observable.throw new Error('This throws!')

      store.init (err, data) ->
        assert.hasType undefined, data
        assert.hasType undefined, store.getCurrent()
        assert.equal 'This throws!', err.message
        done()

  describe 'reading from a loader that throws an error after a successful read', ->
    it 'will return the error through event handler', (done) ->
      store = new SharedStore
        temp: @tmpDir
        loader: Observable.create (observer) ->
          observer.onNext {data: {}}
          setTimeout (-> observer.onError new Error '¡Ay, caramba!'), 500

      store.init (err, data) ->
        assert.deepEqual {}, data
        assert.equal null, err

      store.on 'err', (err) ->
        assert.equal '¡Ay, caramba!', err.message
        done()
