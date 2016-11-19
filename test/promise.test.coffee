'use strict'

assert = require 'assertive'
Bluebird = require 'bluebird'
{Observable} = require 'rx'

{fromPromiseFunction} = require '../lib/promise'

describe 'fromPromiseFunction', ->
  it 'is a function', ->
    assert.hasType Function, fromPromiseFunction

  it 'can convert back and forth', ->
    expected = { a: 'value' }
    fromPromiseFunction -> expected
      .toPromise()
      .then (value) -> assert.deepEqual expected, value

  it 'handles rejections', ->
    fromPromiseFunction -> Bluebird.reject(new Error 'Bad')
      .catch (err) ->
        assert.equal 'Bad', err.message
        Observable.just 'ok'
      .toPromise()
      .then (ok) -> assert.equal 'ok', ok
