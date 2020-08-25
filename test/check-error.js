'use strict';

const assert = require('assert');

const { Observable } = require('rx-lite');

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
