'use strict'

assert = require 'assertive'
Promise = require 'bluebird'

httpResource = require '../lib/http'

checkError = require './check-error'

MODIFIED_SINCE = 'If-Modified-Since'
NONE_MATCH = 'If-None-Match'

describe 'httpResource', ->
  it 'is a function', ->
    assert.hasType Function, httpResource

  describe 'unavailable resource', ->
    beforeEach ->
      @resource = httpResource {
        fetch: ->
          Promise.reject new Error 'Fetch failed'
      }

    it 'forwards the error', ->
      checkError @resource, (error) ->
        assert.equal 'Fetch failed', error.message

  describe 'successful fetch', ->
    LAST_MODIFIED = new Date().toString()
    ETAG = 'some-etag'

    beforeEach ->
      @fetchCount = 0
      @resource = httpResource {
        fetch: (headers) =>
          ++@fetchCount
          Promise.resolve {
            url: 'http://my-url'
            response:
              headers: {
                'last-modified': LAST_MODIFIED
                'etag': 'some-etag'
              }
            body: { incoming: headers }
          }
        interval: 1000
      }

    it 'succeeds and fetched once', ->
      @resource.take(1).toPromise().then ({data}) =>
        assert.equal(
          undefined, data.incoming[NONE_MATCH]
        )
        assert.equal(
          undefined, data.incoming[MODIFIED_SINCE]
        )
        assert.equal 1, @fetchCount

    it 'includes the url as the source', ->
      @resource.take(1).toPromise().then ({source}) ->
        assert.equal(
          'http://my-url', source
        )

    it 'sends ETag and modified the second time around', ->
      @slow 1500
      @resource.take(2).toPromise().then ({data}) =>
        assert.equal(
          ETAG, data.incoming[NONE_MATCH]
        )
        assert.equal(
          LAST_MODIFIED, data.incoming[MODIFIED_SINCE]
        )
        assert.equal 2, @fetchCount
