'use strict'

fs = require 'fs'
path = require 'path'
os = require 'os'

assert = require 'assertive'
{promisify} = Promise = require 'bluebird'
CSON = require 'cson-parser'

fileContent = require '../lib/file'

checkError = require './check-error'

writeFile = promisify fs.writeFile

describe 'fileContent', ->
  it 'is a function', ->
    assert.hasType Function, fileContent

  it 'fails when the file does not exist', ->
    filename = path.join os.tmpdir(), 'missing.json'
    checkError fileContent(filename, watch: false), (error) ->
      assert.equal 'ENOENT', error.cause.code

  describe 'a CSON file', ->
    before ->
      @filename = path.join os.tmpdir(), 'some-file.cson'
      @initialContent = initial: 'state'
      writeFile(
        @filename, CSON.stringify(@initialContent, null, 2)
      )

    it 'returns the parsed content', ->
      fileContent(@filename, watch: false)
        .toPromise().then ({data}) =>
          assert.deepEqual @initialContent, data

  describe 'a JSON file', ->
    before ->
      @filename = path.join os.tmpdir(), 'some-file.json'
      @initialContent = initial: 'state'
      writeFile @filename, JSON.stringify @initialContent

    it 'returns the parsed content', ->
      fileContent(@filename, watch: true)
        .take(1).toPromise().then ({data}) =>
          assert.deepEqual @initialContent, data

    describe 'after changing the file', ->
      before ->
        @content = fileContent(@filename, watch: true)
          .publish()
        @_connection = @content.connect()
        @content.take(1).toPromise() # Skip initial

      after ->
        @_connection.dispose() if @_connection

      before ->
        @changed = @content.take(1).toPromise()
        return # don't block

      before ->
        @updated = updated: 'content'
        writeFile @filename, JSON.stringify @updated

      it 'returns the updated content', ->
        @changed.then ({data}) =>
          assert.deepEqual @updated, data
