'use strict';

const assert = require('assertive');

const { Observable } = require('rx');

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
          assert.hasType(undefined, data);
          assert.hasType(undefined, store.getCurrent());
          assert.equal('This throws!', err.message);
          done();
        });
        null;
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
          assert.equal('tastic', data);
          assert.equal('tastic', store.getCurrent());
          assert.equal(null, err);
          done();
        });
        null;
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
        assert.equal(null, err);
        assert.deepEqual({}, data);
      });
      store.on('err', err => {
        assert.equal('¡Ay, caramba!', err.message);
        done();
      });
    });
  });
});
