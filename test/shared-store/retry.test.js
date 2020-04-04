'use strict';

const assert = require('assertive');

const { Observable } = require('rx');

const tmp = require('tmp');

const SharedStore = require('../../');

describe('SharedStore (retry functionality)', () => {
  before(function (done) {
    tmp.dir(
      {
        unsafeCleanup: true,
      },
      (err, tmpDir) => {
        this.tmpDir = tmpDir;
        done(err);
      }
    );
  });
  describe('reading from a loader with a single value', () => {
    let store = null;
    before(function () {
      store = new SharedStore({
        temp: this.tmpDir,
        loader: Observable.just({
          data: 'test',
        }),
      });
    });
    it('init and retry will emit the same meta ', done => {
      let metaCount = 0;
      store.on('meta', options => {
        assert.equal('some-options', options);
        return metaCount++;
      });
      store.init('some-options');

      store._retry();

      assert.equal(2, metaCount);
      done();
    });
  });
});
