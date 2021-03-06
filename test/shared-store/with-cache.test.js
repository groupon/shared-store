'use strict';

const assert = require('assert');

const { Observable } = require('rx-lite');

const tmp = require('tmp');

const { promisify } = require('util');

const SharedStore = require('../../');

const tmpDir = promisify(tmp.dir);

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('SharedStore (with data already in cache)', () => {
  let cacheTmpDir = null;

  beforeEach(() =>
    tmpDir({ unsafeCleanup: true })
      .then(createdDir => {
        cacheTmpDir = createdDir;
        return new SharedStore({
          temp: cacheTmpDir,
          loader: Observable.just({
            data: 'some data',
          }),
        });
      })
      .then(store => store.init())
  );

  describe('taking a long time to load data', () => {
    let store;
    let notSoCurrent;

    beforeEach(async () => {
      store = new SharedStore({
        temp: cacheTmpDir,
        loader: Observable.just({
          data: 'other data',
        }).delay(500),
      });

      notSoCurrent = await store.init();
    });

    beforeEach(() => delay(1000));

    it('should return cached data immediately in callback', () => {
      assert.strictEqual(notSoCurrent, 'some data');
    });

    it('should return latest data in getCurrent', () => {
      assert.strictEqual(store.getCurrent(), 'other data');
    });
  });

  describe('having cache data = loaded data', () => {
    let store = null;
    beforeEach(() => {
      store = new SharedStore({
        temp: cacheTmpDir,
        loader: Observable.just({
          data: 'some data',
        }),
      });
    });

    it("should resolve the promise even if there's a long period between construction & initialization", () =>
      delay(1000)
        .then(() => store.init())
        .then(data => {
          assert.strictEqual(data, 'some data');
        }));
  });

  describe('throwing a load error & then producing a value', () => {
    let thrownError = false;
    let store;

    const loader = () =>
      Observable.create(observer =>
        delay(250).then(() => {
          if (!thrownError) {
            observer.onError(new Error('kaboom!'));
            thrownError = true;
            return;
          }

          observer.onNext({
            data: '2nd value',
          });
        })
      );

    beforeEach(async () => {
      store = new SharedStore({
        temp: cacheTmpDir,
        loader,
      });

      await store.init();
    });

    it('will throw an error first', done => {
      store.on('err', err => {
        assert.strictEqual(err.message, 'kaboom!');
        done();
      });
    });

    it('will keep on streaming after an error is thrown', () =>
      delay(1500).then(() => {
        assert.strictEqual(store.getCurrent(), '2nd value');
      }));
  });
});
