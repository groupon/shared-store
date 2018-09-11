'use strict'

path = require 'path'
os = require 'os'
fs = require 'fs'

assert = require 'assertive'
{Observable} = require 'rx'
tmp = require 'tmp'

SharedStore = require '../../'

BASE_CONFIG = opt: 'value'

describe 'With cache disabled', ->
  before (done) ->
    tmp.dir { unsafeCleanup: true }, (err, @tmpDir) => done(err)
    return

  describe 'with cache disabled', ->
    before (done) ->
      @overrideFile =
        path.join os.tmpdir(), 'shared-store.test.json'
      @initialOverrides = override: 'loaded'

      fs.writeFile(
        @overrideFile, JSON.stringify(@initialOverrides), done
      )
      return

    before (done) ->
      @store = new SharedStore {
        temp: @tmpDir
        active: true
        loader: (baseConfig) =>
          assert.deepEqual BASE_CONFIG, baseConfig
          Observable.just(data: { static: 'data' }, source: 'static')
      }
      @store.setActive writeCacheFiles: false
      @store.init opt: 'value', (err, @initCallbackData) => done(err)
      return

    it 'returns the initial data', ->
      assert.deepEqual {
        static: 'data'
      }, @store.getCurrent()

    it 'writes no cache file', ->
      cacheFiles = fs.readdirSync @tmpDir
      assert.equal 0, cacheFiles.length
