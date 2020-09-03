'use strict';

const assert = require('assert');

const { Observable } = require('rx-lite');

const tmp = require('tmp');

const SharedStore = require('../../');

describe('SharedStore (error handling)', () => {
  describe('reading from a loader that throws an error immediately', () => {
    describe('with no cache', () => {
      let tmpDir = null;

      before(done => {
        tmp.dir(
          {
            unsafeCleanup: true,
          },
          (err, tmpDirParam) => {
            tmpDir = tmpDirParam;
            done(err);
          }
        );
      });

      it('will return the error through callback', done => {
        let thrownError = false;
        const store = new SharedStore({
          temp: tmpDir,
          loader: Observable.create(observer => {
            if (thrownError) {
              return;
            }

            observer.onError(new Error('This throws!'));
            thrownError = true;
          }),
        });

        store.init((err, data) => {
          assert.strictEqual(data, undefined);
          assert.strictEqual(store.getCurrent(), undefined);
          assert.strictEqual(err.message, 'This throws!');
          done();
        });
      });
    });

    describe('with a cache', () => {
      let tmpDir = null;

      before(done => {
        tmp.dir(
          {
            unsafeCleanup: true,
          },
          (err, tmpDirParam) => {
            tmpDir = tmpDirParam;
            const store = new SharedStore({
              temp: tmpDir,

              loader() {
                return Observable.just({
                  data: 'tastic',
                });
              },
            });

            store.init(storeErr => {
              done(storeErr);
            });
          }
        );
      });

      it('will return the cache through callback & getCurrent', done => {
        let thrownError = false;
        const store = new SharedStore({
          temp: tmpDir,
          loader: Observable.create(observer => {
            if (thrownError) {
              return;
            }

            observer.onError(new Error('This throws!'));
            thrownError = true;
          }),
        });

        store.init((err, data) => {
          assert.strictEqual(data, 'tastic');
          assert.strictEqual(store.getCurrent(), 'tastic');
          assert.strictEqual(err, null);
          done();
        });
      });
    });
  });

  describe('reading from a loader that throws an error after a successful read', () => {
    let tmpDir = null;

    before(done => {
      tmp.dir(
        {
          unsafeCleanup: true,
        },
        (err, tmpDirParam) => {
          tmpDir = tmpDirParam;
          done(err);
        }
      );
    });

    it('will return the error through event handler', done => {
      let thrownError = false;
      const store = new SharedStore({
        temp: tmpDir,
        loader: Observable.create(observer => {
          observer.onNext({
            data: {},
          });
          return setTimeout(() => {
            if (thrownError) {
              return;
            }

            observer.onError(new Error('¡Ay, caramba!'));
            thrownError = true;
          }, 500);
        }),
      });

      store.init((err, data) => {
        assert.strictEqual(err, null);
        assert.deepStrictEqual(data, {});
      });
      store.on('err', err => {
        assert.strictEqual(err.message, '¡Ay, caramba!');
        done();
      });
    });
  });
});
