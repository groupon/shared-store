'use strict'

path = require 'path'
os = require 'os'
fs = require 'fs'

assert = require 'assertive'
{Observable} = require 'rx'
tmp = require 'tmp'

SharedStore = require '../../'
fileContent = require '../../file'

BASE_CONFIG = opt: 'value'

INITIAL_DATA =
  override: 'loaded'
  fromFile: 42
  static: 'data'

CHANGED_DATA =
  static: 'data'
  fromFile: 13

describe 'SharedStore', ->
  before (done) ->
    tmp.dir { unsafeCleanup: true }, (err, @tmpDir) => done(err)

  describe 'reading from multiple loaders', ->
    before (done) ->
      @overrideFile =
        path.join os.tmpdir(), 'shared-store.test.json'
      @initialOverrides = override: 'loaded'

      fs.writeFile(
        @overrideFile, JSON.stringify(@initialOverrides), done
      )

    before (done) ->
      @store = new SharedStore {
        temp: @tmpDir
        active: true
        loader: (baseConfig) =>
          assert.deepEqual BASE_CONFIG, baseConfig
          Observable.combineLatest(
            Observable.just(data: { static: 'data' }, source: 'static')
            fileContent('example/config.json')
            fileContent(@overrideFile, watch: true)
            SharedStore.safeMerge
          )
      }
      @store.init opt: 'value', (err, @initCallbackData) => done(err)
      null

    it 'returns the initial data', ->
      assert.deepEqual INITIAL_DATA, @store.getCurrent()

    it 'passes the initial data into the callback', ->
      assert.deepEqual INITIAL_DATA, @initCallbackData

    it 'writes a cache file', ->
      cacheFiles = fs.readdirSync @tmpDir
      assert.equal 1, cacheFiles.length

    describe 'a passive store', ->
      before ->
        @passiveStore = new SharedStore {
          temp: @tmpDir
          active: false
        }
        @passiveStore.init(opt: '-- ignored --')

      it 'gets the same data', ->
        assert.deepEqual(
          INITIAL_DATA, @passiveStore.getCurrent()
        )

    describe 'after changing a file', ->
      before (done) ->
        @newOverrides = fromFile: CHANGED_DATA.fromFile
        fs.writeFile(
          @overrideFile, JSON.stringify(@newOverrides), done
        )

      before (done) -> setTimeout done, 300

      it 'has the updated data', ->
        assert.deepEqual(
          CHANGED_DATA, @store.getCurrent()
        )
