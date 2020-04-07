'use strict';

const fs = require('fs');

const os = require('os');

const path = require('path');

const assert = require('assertive');

const { promisify } = require('util');

const fileAlternativesContent = require('../lib/file-alternatives');

const checkError = require('./check-error');

const writeFile = promisify(fs.writeFile);
describe('fileAlternativesContent', () => {
  it('is a function', () => {
    assert.hasType(Function, fileAlternativesContent);
  });
  describe('for no existing files', () => {
    it('fails with no defaultValue', () => {
      const filename = path.join(os.tmpdir(), 'missing.json');
      checkError(
        fileAlternativesContent([filename], {
          watch: false,
        }),
        error => {
          assert.include('none of', error.message);
        }
      );
    });
    it('returns a defaultValue', () => {
      const defaultValue = {};
      return fileAlternativesContent([], {
        watch: false,
        defaultValue,
      })
        .take(1)
        .toPromise()
        .then(data => {
          assert.equal(defaultValue, data);
        });
    });
  });
  describe('for a single existing file', () => {
    before(function () {
      this.filename = path.join(os.tmpdir(), 'some-file.json');
      this.initialContent = {
        initial: 'state',
      };
      return writeFile(this.filename, JSON.stringify(this.initialContent));
    });
    it('accepts a string', function () {
      return fileAlternativesContent(this.filename, {
        watch: false,
      })
        .take(1)
        .toPromise()
        .then(({ data }) => {
          assert.deepEqual(this.initialContent, data);
        });
    });
    it('accepts an array with only one existing file', function () {
      const bogus = path.join(os.tmpdir(), 'missing.json');
      return fileAlternativesContent([bogus, this.filename], {
        watch: false,
      })
        .take(1)
        .toPromise()
        .then(({ data }) => {
          assert.deepEqual(this.initialContent, data);
        });
    });
  });
  describe('for multiple existing files', () => {
    before(function () {
      this.filename1 = path.join(os.tmpdir(), 'some-file.json');
      this.filename2 = path.join(os.tmpdir(), 'other-file.json');
      this.initialContent = {
        initial: 'state',
      };
      return Promise.all(
        [this.filename1, this.filename2].map(filename => {
          return writeFile(filename, JSON.stringify(this.initialContent));
        })
      );
    });
    it('dies horribly', function () {
      checkError(
        fileAlternativesContent([this.filename1, this.filename2], {
          watch: false,
        }),
        error => {
          assert.include('multiple', error.message);
        }
      );
    });
  });
});
