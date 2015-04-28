'use strict'

assert = require 'assertive'
{Observable} = require 'rx'
tmp = require 'tmp'

SharedStore = require '../../'

describe 'SharedStore (retry functionality)', ->
  before (done) ->
    tmp.dir { unsafeCleanup: true }, (err, @tmpDir) => done(err)

  describe 'reading from a loader with a single value', ->
    store = null
    before ->
      store = new SharedStore
        temp: @tmpDir
        loader: Observable.just {data: 'test'}

    it 'init and retry will emit the same meta ', (done) ->
      metaCount = 0
      store.on 'meta', (options) ->
        assert.equal 'some-options', options
        metaCount++

      store.init 'some-options'
      store._retry()

      assert.equal 2, metaCount
      done()
