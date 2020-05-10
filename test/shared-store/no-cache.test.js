'use strict';

const fs = require('fs');

const os = require('os');

const path = require('path');

const assert = require('assertive');

const { Observable } = require('rx-lite');

const tmp = require('tmp');

const SharedStore = require('../../');

const BASE_CONFIG = {
  opt: 'value',
};
describe('With cache disabled', () => {
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
  describe('with cache disabled', () => {
    before(function (done) {
      this.overrideFile = path.join(os.tmpdir(), 'shared-store.test.json');
      this.initialOverrides = {
        override: 'loaded',
      };
      fs.writeFile(
        this.overrideFile,
        JSON.stringify(this.initialOverrides),
        done
      );
    });
    before(function (done) {
      this.store = new SharedStore({
        temp: this.tmpDir,
        active: true,
        loader: baseConfig => {
          assert.deepEqual(BASE_CONFIG, baseConfig);
          return Observable.just({
            data: {
              static: 'data',
            },
            source: 'static',
          });
        },
      });
      this.store.setActive({
        writeCacheFiles: false,
      });
      this.store.init(
        {
          opt: 'value',
        },
        (err, initCallbackData) => {
          this.initCallbackData = initCallbackData;
          done(err);
        }
      );
    });
    it('returns the initial data', function () {
      assert.deepEqual(
        {
          static: 'data',
        },
        this.store.getCurrent()
      );
    });
    it('writes no cache file', function () {
      const cacheFiles = fs.readdirSync(this.tmpDir);
      assert.equal(0, cacheFiles.length);
    });
  });
});
