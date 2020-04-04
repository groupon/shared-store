'use strict';

const assert = require('assertive');

const httpResource = require('../lib/http');

const checkError = require('./check-error');

const MODIFIED_SINCE = 'If-Modified-Since';
const NONE_MATCH = 'If-None-Match';
describe('httpResource', () => {
  it('is a function', () => {
    assert.hasType(Function, httpResource);
  });
  describe('unavailable resource', () => {
    beforeEach(function () {
      this.resource = httpResource({
        fetch() {
          return Promise.reject(new Error('Fetch failed'));
        },
      });
    });
    it('forwards the error', function () {
      checkError(this.resource, error => {
        assert.equal('Fetch failed', error.message);
      });
    });
  });
  describe('successful fetch', () => {
    const LAST_MODIFIED = new Date().toString();
    const ETAG = 'some-etag';
    beforeEach(function () {
      this.fetchCount = 0;
      this.resource = httpResource({
        fetch: headers => {
          ++this.fetchCount;
          return Promise.resolve({
            url: 'http://my-url',
            response: {
              headers: {
                'last-modified': LAST_MODIFIED,
                etag: 'some-etag',
              },
            },
            body: {
              incoming: headers,
            },
          });
        },
        interval: 1000,
      });
    });
    it('succeeds and fetched once', function () {
      return this.resource
        .take(1)
        .toPromise()
        .then(({ data }) => {
          assert.equal(undefined, data.incoming[NONE_MATCH]);
          assert.equal(undefined, data.incoming[MODIFIED_SINCE]);
          assert.equal(1, this.fetchCount);
        });
    });
    it('includes the url as the source', function () {
      return this.resource
        .take(1)
        .toPromise()
        .then(({ source }) => {
          assert.equal('http://my-url', source);
        });
    });
    it('sends ETag and modified the second time around', function () {
      this.slow(1500);
      return this.resource
        .take(2)
        .toPromise()
        .then(({ data }) => {
          assert.equal(ETAG, data.incoming[NONE_MATCH]);
          assert.equal(LAST_MODIFIED, data.incoming[MODIFIED_SINCE]);
          assert.equal(2, this.fetchCount);
        });
    });
  });
});
