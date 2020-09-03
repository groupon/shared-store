'use strict';

const fs = require('fs');

const os = require('os');

const path = require('path');

const assert = require('assert');

const { Observable } = require('rx-lite');

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

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('SharedStore', () => {
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

  describe('reading from multiple loaders', () => {
    let store;
    let overrideFile;
    let initCallbackData;

    before(done => {
      overrideFile = path.join(os.tmpdir(), 'shared-store.test.json');
      const initialOverrides = {
        override: 'loaded',
      };
      fs.writeFile(overrideFile, JSON.stringify(initialOverrides), done);
    });

    before(async () => {
      store = new SharedStore({
        temp: tmpDir,
        active: true,
        loader: baseConfig => {
          assert.deepStrictEqual(baseConfig, BASE_CONFIG);

          return Observable.combineLatest(
            Observable.just({
              data: {
                static: 'data',
              },
              source: 'static',
            }),
            fileContent('example/config.json'),
            fileContent(overrideFile, {
              watch: true,
            }),
            SharedStore.safeMerge
          );
        },
      });

      initCallbackData = await store.init({
        opt: 'value',
      });
    });

    it('returns the initial data', () => {
      assert.deepStrictEqual(store.getCurrent(), INITIAL_DATA);
    });

    it('passes the initial data into the callback', () => {
      assert.deepStrictEqual(initCallbackData, INITIAL_DATA);
    });

    it('writes a cache file', () => {
      const cacheFiles = fs.readdirSync(tmpDir);

      assert.strictEqual(cacheFiles.length, 1);
    });

    describe('a passive store', () => {
      let passiveStore;

      before(async () => {
        passiveStore = new SharedStore({
          temp: tmpDir,
          active: false,
          loader: Observable.just({
            data: {
              static: 'data',
            },
            source: 'static',
          }),
        });

        await passiveStore.init({
          opt: '-- ignored --',
        });
      });

      it('gets the same data', () => {
        assert.deepStrictEqual(passiveStore.getCurrent(), INITIAL_DATA);
      });

      it('can switch to active', async () => {
        passiveStore.setActive();
        await delay(300);

        assert.deepStrictEqual(passiveStore.getCurrent(), { static: 'data' });
      });
    });

    describe('after changing a file', () => {
      before(done => {
        const newOverrides = {
          fromFile: CHANGED_DATA.fromFile,
        };
        fs.writeFile(overrideFile, JSON.stringify(newOverrides), done);
      });
      before(() => delay(300));

      it('has the updated data', () => {
        assert.deepStrictEqual(store.getCurrent(), CHANGED_DATA);
      });
    });
  });
});
