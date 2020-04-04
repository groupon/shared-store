'use strict';

const fs = require('fs');

const os = require('os');

const path = require('path');

const assert = require('assertive');

const { Observable } = require('rx');

const tmp = require('tmp');

const SharedStore = require('../../');

const fileContent = require('../../file');

const BASE_CONFIG = {
  opt: 'value',
};
const INITIAL_DATA = {
  override: 'loaded',
  fromFile: 42,
  static: 'data',
};
const CHANGED_DATA = {
  static: 'data',
  fromFile: 13,
};
describe('SharedStore', () => {
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
  describe('reading from multiple loaders', () => {
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
          return Observable.combineLatest(
            Observable.just({
              data: {
                static: 'data',
              },
              source: 'static',
            }),
            fileContent('example/config.json'),
            fileContent(this.overrideFile, {
              watch: true,
            }),
            SharedStore.safeMerge
          );
        },
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
      null;
    });
    it('returns the initial data', function () {
      assert.deepEqual(INITIAL_DATA, this.store.getCurrent());
    });
    it('passes the initial data into the callback', function () {
      assert.deepEqual(INITIAL_DATA, this.initCallbackData);
    });
    it('writes a cache file', function () {
      const cacheFiles = fs.readdirSync(this.tmpDir);
      assert.equal(1, cacheFiles.length);
    });
    describe('a passive store', () => {
      before(function () {
        this.passiveStore = new SharedStore({
          temp: this.tmpDir,
          active: false,
          loader: Observable.just({
            data: {
              static: 'data',
            },
            source: 'static',
          }),
        });
        return this.passiveStore.init({
          opt: '-- ignored --',
        });
      });
      it('gets the same data', function () {
        assert.deepEqual(INITIAL_DATA, this.passiveStore.getCurrent());
      });
      it('can switch to active', function (done) {
        this.passiveStore.setActive();
        setTimeout(() => {
          assert.deepEqual(
            {
              static: 'data',
            },
            this.passiveStore.getCurrent()
          );
          done();
        }, 300);
      });
    });
    describe('after changing a file', () => {
      before(function (done) {
        this.newOverrides = {
          fromFile: CHANGED_DATA.fromFile,
        };
        fs.writeFile(
          this.overrideFile,
          JSON.stringify(this.newOverrides),
          done
        );
      });
      before(done => {
        setTimeout(done, 300);
      });
      it('has the updated data', function () {
        assert.deepEqual(CHANGED_DATA, this.store.getCurrent());
      });
    });
  });
});
