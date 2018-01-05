'use strict'

os = require 'os'
path = require 'path'
fs = require 'fs'

assert = require 'assertive'
rimraf = require 'rimraf'
mkdirp = require 'mkdirp'
{promisify} = Bluebird = require 'bluebird'

latestFile = require '../lib/latest-file'

checkError = require './check-error'

writeFile = promisify fs.writeFile

DIR_NAME = 'shared-store-latest-file-test'

dotJSON = ({filename}) -> /\.json$/.test filename

describe 'latestFile', ->
  it 'is a function', ->
    assert.hasType Function, latestFile

  before (done) ->
    @dir = path.join os.tmpdir(), DIR_NAME
    rimraf @dir, -> done()
    return

  describe 'with non-existant directory', ->
    before ->
      @resource = latestFile @dir, {
        watch: false, filter: dotJSON
      }

    it 'fails', ->
      checkError @resource, (error) ->
        assert.equal 'ENOENT', error.cause.code

  describe 'an existing directory', ->
    before (done) -> mkdirp(@dir, done)

    describe 'without any files', ->
      before ->
        @resource = latestFile @dir, {
          watch: false, filter: dotJSON
        }

      it 'fails', ->
        checkError @resource, (error) ->
          assert.equal 'ENOENT', error.code

    describe 'with two files', ->
      before ->
        @timeout 3000
        Bluebird.each [
          'first.json', 'second.json'
        ], (filename) =>
          absolute = path.join @dir, filename
          content = JSON.stringify {filename}
          # .delay to ensure different mtime
          writeFile(absolute, content).delay 1050

      before ->
        @resource = latestFile(@dir, {
          watch: true, filter: dotJSON
        }).publish()
        @_connection = @resource.connect()

      after ->
        @_connection.dispose() if @_connection?

      before ->
        @resource.take(1).toPromise().then (@firstFile) =>

      it 'emits the second (latest) file only', ->
        assert.equal 'second.json', @firstFile.filename

      describe 'with an additional file', ->
        before ->
          @additional = @resource.take(1).toArray().toPromise()
          return # don't block

        before ->
          filename = 'third.json'
          absolute = path.join @dir, filename
          writeFile absolute, JSON.stringify {filename}
            .delay 100 # race condition protection

        it 'emits the third file', ->
          @additional.then (results) ->
            assert.equal 1, results.length
            assert.equal 'third.json', results[0].filename
