'use strict';

const assert = require('assertive');

const { Observable } = require('rx');

const tmp = require('tmp');

const promisify = require('util.promisify');

const SharedStore = require('../../');

const tmpDir = promisify(tmp.dir, tmp);

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('SharedStore (with data already in cache)', () => {
  let cacheTmpDir = null;
  beforeEach(() =>
    tmpDir({
      unsafeCleanup: true,
    }).then(createdDir => {
      cacheTmpDir = createdDir;
      const store = new SharedStore({
        temp: cacheTmpDir,
        loader: Observable.just({
          data: 'some data',
        }),
      });
      return store.init();
    })
  );
  describe('taking a long time to load data', () => {
    let store;
    let notSoCurrent = (store = null);
    beforeEach(() => {
      store = new SharedStore({
        temp: cacheTmpDir,
        loader: Observable.just({
          data: 'other data',
        }).delay(500),
      });
      return store.init().then(current => {
        notSoCurrent = current;
        return notSoCurrent;
      });
    });
    beforeEach(() => delay(1000));
    it('should return cached data immediately in callback', () => {
      assert.equal('some data', notSoCurrent);
    });
    it('should return latest data in getCurrent', () => {
      assert.equal('other data', store.getCurrent());
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
          assert.equal('some data', data);
        }));
  });
  describe('throwing a load error & then producing a value', () => {
    let thrownError;
    let store = (thrownError = null);
    beforeEach(() => {
      thrownError = false;

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

      store = new SharedStore({
        temp: cacheTmpDir,
        loader,
      });
      return store.init();
    });
    it('will throw an error first', () => {
      store.on('err', err => {
        assert.equal('kaboom!', err.message);
      });
    });
    it('will keep on streaming after an error is thrown', () =>
      delay(1500).then(() => {
        assert.equal('2nd value', store.getCurrent());
      }));
  });
});
