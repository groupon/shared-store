'use strict'

path = require 'path'
os = require 'os'
fs = require 'fs'

assert = require 'assertive'
rimraf = require 'rimraf'
mkdirp = require 'mkdirp'
{Observable} = require 'rx'
tmp = require 'tmp'

SharedStore = require '../'
fileContent = require '../file'

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

      store.on 'error', (err) ->
        assert.equal '¡Ay, caramba!', err.message
        done()

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
