'use strict'

assert = require 'assertive'
{Observable} = require 'rx'
tmp = require 'tmp'

SharedStore = require '../../'
fileContent = require '../../file'

describe 'SharedStore (caching functionality)', ->
  before (done) ->
    tmp.dir { unsafeCleanup: true }, (err, @tmpDir) => done(err)

  describe 'with data already in cache', ->
    beforeEach (done) ->
      tmp.dir { unsafeCleanup: true }, (err, @cacheTmpDir) =>
        store = new SharedStore
          temp: @cacheTmpDir
          loader: Observable.just {data: 'some data'}
        store.init (err) ->
          assert.equal null, err
          done()

    it 'will return cached data in init callback if it already exists', (done) ->
      store = new SharedStore
        temp: @cacheTmpDir
        loader: Observable
          .just {data: 'other data'}
          .delay 500

      setTimeout ->
        store.init (err, current) ->
          assert.equal null, err
          assert.equal 'some data', current
          done()
      , 1000

    it 'will keep on streaming after an error is thrown', (done) ->
      @timeout 5000
      thrownError = false
      store = new SharedStore
        temp: @cacheTmpDir
        loader: Observable.create (observer) ->
          setTimeout ->
            unless thrownError
              observer.onError new Error 'kaboom!'
              thrownError = true
              return

            observer.onNext data: '2nd value'
          , 250

      store.init (err, current) ->
        assert.equal null, err
        assert.equal 'some data', current

      store.on 'err', (err) ->
        assert.equal 'kaboom!', err.message

      setTimeout ->
        assert.equal '2nd value', store.getCurrent()
        done()
      , 2000 # wait for retryTimeout
