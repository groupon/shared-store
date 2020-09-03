'use strict';

const assert = require('assert');

const { Observable } = require('rx-lite');

const onInterval = require('../lib/interval');

const checkError = require('./check-error');

const LOAD_SUCCESS = {};

function loadSuccess() {
  return Observable.just(LOAD_SUCCESS);
}

describe('onInterval', () => {
  it('is a function', () => {
    assert.strictEqual(typeof onInterval, 'function');
  });

  describe('interval < 1s', () => {
    it('fails', async () => {
      const observable = onInterval(999, loadSuccess);
      await checkError(observable, err => {
        assert.strictEqual(
          err.message,
          `\
Interval has to be at least 1s: 999ms\
`
        );
      });
    });
  });

  describe('interval is falsey', () => {
    const verifyOne = observable =>
      observable
        .toArray()
        .toPromise()
        .then(values => {
          assert.strictEqual(values.length, 1);
          assert.strictEqual(values[0], LOAD_SUCCESS);
        });

    it('returns one value only for interval = 0', () =>
      verifyOne(onInterval(0, loadSuccess)));

    it('returns one value for negative interval', () =>
      verifyOne(onInterval(-1, loadSuccess)));

    it('returns one value for interval = false', () =>
      verifyOne(onInterval(false, loadSuccess)));

    it('returns one value for interval = undefined', () =>
      verifyOne(onInterval(undefined, loadSuccess)));
  });

  describe('interval >= 1s', () => {
    function loadIncremental() {
      let current = 0;
      return () => Observable.just(current++);
    }

    it('loads the first value immediately', async () => {
      const start = Date.now();
      const value = await onInterval(1000, loadIncremental())
        .take(1)
        .toPromise();

      assert.strictEqual(value, 0);
      assert.ok(Date.now() - start < 50, `took <<< 1s`);
    });

    it('loads one value per second', async function () {
      this.timeout(2100);
      this.slow(2050);
      const start = Date.now();
      const values = await onInterval(1000, loadIncremental())
        .take(3)
        .toArray()
        .toPromise();

      assert.deepStrictEqual(values, [0, 1, 2]); // 1st: immediate, 2nd: 1s, 3rd: 2s
      assert.ok(Date.now() - start >= 2000, `took >= 2s`);
    });
  });
});
