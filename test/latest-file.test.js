'use strict';

const fs = require('fs');

const os = require('os');

const path = require('path');

const assert = require('assert');

const mkdirp = require('mkdirp');

const rimraf = require('rimraf');

const { promisify } = require('util');

const latestFile = require('../lib/latest-file');

const checkError = require('./check-error');

const writeFile = promisify(fs.writeFile);
const DIR_NAME = 'shared-store-latest-file-test';

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function dotJSON({ filename }) {
  return /\.json$/.test(filename);
}

// FIXME: this test suite doesn't run on its own. It relies on previous tests to run
describe('latestFile', () => {
  it('is a function', () => {
    assert.strictEqual(typeof latestFile, 'function');
  });

  before(function (done) {
    this.dir = path.join(os.tmpdir(), DIR_NAME);
    rimraf(this.dir, () => {
      done();
    });
  });

  describe('with non-existant directory', () => {
    before(function () {
      this.resource = latestFile(this.dir, {
        watch: false,
        filter: dotJSON,
      });
    });

    it('fails', function () {
      checkError(this.resource, error => {
        assert.strictEqual(error.code, 'ENOENT');
      });
    });
  });

  describe('an existing directory', () => {
    before(function () {
      return mkdirp(this.dir);
    });

    describe('without any files', () => {
      before(function () {
        this.resource = latestFile(this.dir, {
          watch: false,
          filter: dotJSON,
        });
      });

      it('fails', function () {
        checkError(this.resource, error => {
          assert.strictEqual(error.code, 'ENOENT');
        });
      });
    });

    describe('with two files', () => {
      before(function () {
        this.timeout(3000);

        const writeTestFile = filename => {
          const absolute = path.join(this.dir, filename);
          const content = JSON.stringify({
            filename,
          }); // delay to ensure different mtime

          return writeFile(absolute, content).then(() => delay(1050));
        };

        return writeTestFile('first.json').then(
          writeTestFile.bind(null, 'second.json')
        );
      });

      before(function () {
        this.resource = latestFile(this.dir, {
          watch: true,
          filter: dotJSON,
        }).publish();
        this._connection = this.resource.connect();
      });

      after(function () {
        if (this._connection != null) {
          this._connection.dispose();
        }
      });

      before(function () {
        return this.resource
          .take(1)
          .toPromise()
          .then(firstFile => {
            this.firstFile = firstFile;
          });
      });

      it('emits the second (latest) file only', function () {
        assert.strictEqual(this.firstFile.filename, 'second.json');
      });

      describe('with an additional file', () => {
        before(function () {
          this.additional = this.resource.take(1).toArray().toPromise();
        }); // don't block

        before(function () {
          const filename = 'third.json';
          const absolute = path.join(this.dir, filename);
          return writeFile(
            absolute,
            JSON.stringify({
              filename,
            })
          ).then(() => delay(100));
        }); // race condition protection

        it('emits the third file', function () {
          return this.additional.then(results => {
            assert.strictEqual(results.length, 1);
            assert.strictEqual(results[0].filename, 'third.json');
          });
        });
      });
    });
  });
});
