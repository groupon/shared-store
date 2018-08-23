'use strict'

assert = require 'assertive'

{Observable} = require 'rx'

checkError = (observable, fn) ->
  OK = {}
  observable
    .catch (err) ->
      fn(err)
      Observable.just OK
    .toPromise()
    .then (value) ->
      assert.equal OK, value

module.exports = checkError
