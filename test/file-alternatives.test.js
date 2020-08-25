'use strict';

const fs = require('fs');

const os = require('os');

const path = require('path');

const assert = require('assert');

const { promisify } = require('util');

const fileAlternativesContent = require('../lib/file-alternatives');

const checkError = require('./check-error');

const writeFile = promisify(fs.writeFile);

describe('fileAlternativesContent', () => {
  it('is a function', () => {
    assert.strictEqual(typeof fileAlternativesContent, 'function');
  });

  describe('for no existing files', () => {
    it('fails with no defaultValue', () => {
      const filename = path.join(os.tmpdir(), 'missing.json');
      checkError(
        fileAlternativesContent([filename], {
          watch: false,
        }),
        error => {
          assert.ok(error.message.includes('none of'));
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
          assert.strictEqual(data, defaultValue);
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
          assert.deepStrictEqual(data, this.initialContent);
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
          assert.deepStrictEqual(data, this.initialContent);
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
          assert.ok(error.message.includes('multiple'));
        }
      );
    });
  });
});
