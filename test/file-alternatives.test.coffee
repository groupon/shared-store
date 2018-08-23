'use strict'

fs = require 'fs'
path = require 'path'
os = require 'os'

assert = require 'assertive'
promisify = require 'util.promisify'

fileAlternativesContent = require '../lib/file-alternatives'

checkError = require './check-error'

writeFile = promisify fs.writeFile

describe 'fileAlternativesContent', ->
  it 'is a function', ->
    assert.hasType Function, fileAlternativesContent

  describe 'for no existing files', ->
    it 'fails with no defaultValue', ->
      filename = path.join os.tmpdir(), 'missing.json'
      checkError fileAlternativesContent([filename], watch: false), (error) ->
        assert.include 'none of', error.message

    it 'returns a defaultValue', ->
      defaultValue = {}
      fileAlternativesContent([], { watch: false, defaultValue })
        .take(1).toPromise().then (data) -> assert.equal defaultValue, data

  describe 'for a single existing file', ->
    before ->
      @filename = path.join os.tmpdir(), 'some-file.json'
      @initialContent = initial: 'state'
      writeFile @filename, JSON.stringify @initialContent

    it 'accepts a string', ->
      fileAlternativesContent(@filename, watch: false)
        .take(1).toPromise().then ({data}) =>
          assert.deepEqual @initialContent, data

    it 'accepts an array with only one existing file', ->
      bogus = path.join os.tmpdir(), 'missing.json'
      fileAlternativesContent([bogus, @filename], watch: false)
        .take(1).toPromise().then ({data}) =>
          assert.deepEqual @initialContent, data

  describe 'for multiple existing files', ->
    before ->
      @filename1 = path.join os.tmpdir(), 'some-file.json'
      @filename2 = path.join os.tmpdir(), 'other-file.json'
      @initialContent = initial: 'state'
      Promise.all [@filename1, @filename2].map (filename) =>
        writeFile filename, JSON.stringify @initialContent

    it 'dies horribly', ->
      checkError(
        fileAlternativesContent([@filename1, @filename2], watch: false),
        (error) -> assert.include 'multiple', error.message
      )
