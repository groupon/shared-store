'use strict';

const assert = require('assertive');

const { Observable } = require('rx');

function checkError(observable, fn) {
  const OK = {};
  return observable
    .catch(err => {
      fn(err);
      return Observable.just(OK);
    })
    .toPromise()
    .then(value => {
      assert.equal(OK, value);
    });
}

module.exports = checkError;
