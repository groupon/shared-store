'use strict';

const assert = require('assertive');

const { Observable } = require('rx');

const { fromPromiseFunction } = require('../lib/promise');

describe('fromPromiseFunction', () => {
  it('is a function', () => {
    assert.hasType(Function, fromPromiseFunction);
  });
  it('can convert back and forth', () => {
    const expected = {
      a: 'value',
    };
    return fromPromiseFunction(() => expected)
      .toPromise()
      .then(value => {
        assert.deepEqual(expected, value);
      });
  });
  it('handles rejections', () =>
    fromPromiseFunction(() => Promise.reject(new Error('Bad')))
      .catch(err => {
        assert.equal('Bad', err.message);
        return Observable.just('ok');
      })
      .toPromise()
      .then(ok => {
        assert.equal('ok', ok);
      }));
});
