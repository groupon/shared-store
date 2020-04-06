'use strict';

const assert = require('assertive');

const { Observable } = require('rx');

const tmp = require('tmp');

const SharedStore = require('../../');

describe('SharedStore (retry functionality)', () => {
  let tmpDir;
  before(done => {
    tmp.dir(
      {
        unsafeCleanup: true,
      },
      (err, dir) => {
        tmpDir = dir;
        done(err);
      }
    );
  });

  describe('reading from a loader with a single value', () => {
    let store = null;
    before(() => {
      store = new SharedStore({
        temp: tmpDir,
        loader: Observable.just({
          data: 'test',
        }),
      });
    });

    it('init and retry will emit the same meta ', async () => {
      let metaCount = 0;
      store.on('meta', options => {
        assert.equal('some-options', options);
        metaCount++;
      });

      await store.init('some-options');

      store._retry();

      assert.equal(2, metaCount);
    });
  });
});
