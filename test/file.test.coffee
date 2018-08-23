'use strict'

fs = require 'fs'
path = require 'path'
os = require 'os'

assert = require 'assertive'
promisify = require 'util.promisify'
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
      assert.equal 'ENOENT', error.code

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

  describe 'when the surrounding dir does not exist', ->
    before ->
      @filename = path.join os.tmpdir(), 'not-a-dir', 'some-file.cson'

    it 'does not fail, just ignores the watch', ->
      fileContent(@filename, watch: true, defaultValue: 42)
        .take(2)
        .toPromise()
        .then (result) ->
          assert.equal 42, result

  describe 'a CSON file with syntax errors', ->
    before ->
      @filename = path.join os.tmpdir(), 'some-file.cson'
      # The content is missing a closing quote after Hello
      writeFile @filename, 'x: 10\nfoo: 13\nbar: "Hello\nzapp: 42\n'

    it 'fails with a helpful error message', ->
      checkError fileContent(@filename, watch: false), (error) =>
        assert.equal 'SyntaxError', error.name
        assert.include 'missing "', error.message
        assert.include "in #{@filename}:3", error.message

  describe 'a JSON file with syntax errors', ->
    before ->
      @filename = path.join os.tmpdir(), 'some-file.json'
      # The content is missing a comma after 42
      writeFile @filename, '{\n  "foo": 42\n  "bar": 13\n}\n'

    it 'fails with a helpful error message', ->
      checkError fileContent(@filename, watch: false), (error) =>
        assert.equal 'SyntaxError', error.name
        assert.include 'Unexpected string', error.message
        assert.include "in #{@filename}", error.message
