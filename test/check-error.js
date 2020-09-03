'use strict';

const assert = require('assert');

const { Observable } = require('rx-lite');

/**
 *
 * @param {Rx.Observable} observable
 * @param {function} fn
 * @returns {Rx.IPromise<void>}
 */
function checkError(observable, fn) {
  const OK = {};
  return observable
    .catch(err => {
      fn(err);
      return Observable.just(OK);
    })
    .toPromise()
    .then(value => {
      assert.deepStrictEqual(value, OK);
    });
}

module.exports = checkError;
