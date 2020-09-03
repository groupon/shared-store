'use strict';

const assert = require('assert');

const { Observable } = require('rx-lite');

const { fromPromiseFunction } = require('../lib/promise');

describe('fromPromiseFunction', () => {
  it('is a function', () => {
    assert.strictEqual(typeof fromPromiseFunction, 'function');
  });

  it('can convert back and forth', () => {
    const expected = {
      a: 'value',
    };
    return fromPromiseFunction(() => expected)
      .toPromise()
      .then(value => {
        assert.deepStrictEqual(value, expected);
      });
  });

  it('handles rejections', () =>
    fromPromiseFunction(() => Promise.reject(new Error('Bad')))
      .catch(err => {
        assert.strictEqual(err.message, 'Bad');
        return Observable.just('ok');
      })
      .toPromise()
      .then(ok => {
        assert.strictEqual(ok, 'ok');
      }));
});
