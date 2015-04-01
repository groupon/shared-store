'use strict'

assert = require 'assertive'
{Observable} = require 'rx'
tmp = require 'tmp'

SharedStore = require '../../'
fileContent = require '../../file'

describe 'SharedStore', ->
  before (done) ->
    tmp.dir { unsafeCleanup: true }, (err, @tmpDir) => done(err)

  describe 'with data already in cache', ->
    before (done) ->
      tmp.dir { unsafeCleanup: true }, (err, @cacheTmpDir) =>
        store = new SharedStore
          temp: @cacheTmpDir
          loader: Observable.just {data: 'some data'}
        store.init (err) ->
          done()

    it 'will return cached data in init callback if it already exists', (done) ->
      store = new SharedStore
        temp: @cacheTmpDir
        loader: Observable
          .just {data: 'other data'}
          .delay 5000

      setTimeout ->
        store.init (err, current) ->
          assert.equal 'some data', current
          done()
      , 1000
