'use strict';

const assert = require('assert');

const httpResource = require('../lib/http');

const checkError = require('./check-error');

const MODIFIED_SINCE = 'If-Modified-Since';
const NONE_MATCH = 'If-None-Match';

describe('httpResource', () => {
  it('is a function', () => {
    assert.strictEqual(typeof httpResource, 'function');
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
        assert.strictEqual(error.message, 'Fetch failed');
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
          assert.strictEqual(data.incoming[NONE_MATCH], undefined);
          assert.strictEqual(data.incoming[MODIFIED_SINCE], undefined);
          assert.strictEqual(this.fetchCount, 1);
        });
    });

    it('includes the url as the source', function () {
      return this.resource
        .take(1)
        .toPromise()
        .then(({ source }) => {
          assert.strictEqual(source, 'http://my-url');
        });
    });

    it('sends ETag and modified the second time around', function () {
      this.slow(1500);
      return this.resource
        .take(2)
        .toPromise()
        .then(({ data }) => {
          assert.strictEqual(data.incoming[NONE_MATCH], ETAG);
          assert.strictEqual(data.incoming[MODIFIED_SINCE], LAST_MODIFIED);
          assert.strictEqual(this.fetchCount, 2);
        });
    });
  });
});
