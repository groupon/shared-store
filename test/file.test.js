'use strict';

const fs = require('fs');

const os = require('os');

const path = require('path');

const assert = require('assertive');

const CSON = require('cson-parser');

const { promisify } = require('util');

const fileContent = require('../lib/file');

const checkError = require('./check-error');

const writeFile = promisify(fs.writeFile);
describe('fileContent', () => {
  it('is a function', () => {
    assert.hasType(Function, fileContent);
  });
  it('fails when the file does not exist', () => {
    const filename = path.join(os.tmpdir(), 'missing.json');
    checkError(
      fileContent(filename, {
        watch: false,
      }),
      error => {
        assert.equal('ENOENT', error.code);
      }
    );
  });
  describe('a CSON file', () => {
    before(function () {
      this.filename = path.join(os.tmpdir(), 'some-file.cson');
      this.initialContent = {
        initial: 'state',
      };
      return writeFile(
        this.filename,
        CSON.stringify(this.initialContent, null, 2)
      );
    });
    it('returns the parsed content', function () {
      return fileContent(this.filename, {
        watch: false,
      })
        .toPromise()
        .then(({ data }) => {
          assert.deepEqual(this.initialContent, data);
        });
    });
  });
  describe('a JSON file', () => {
    before(function () {
      this.filename = path.join(os.tmpdir(), 'some-file.json');
      this.initialContent = {
        initial: 'state',
      };
      return writeFile(this.filename, JSON.stringify(this.initialContent));
    });
    it('returns the parsed content', function () {
      return fileContent(this.filename, {
        watch: true,
      })
        .take(1)
        .toPromise()
        .then(({ data }) => {
          assert.deepEqual(this.initialContent, data);
        });
    });
    describe('after changing the file', () => {
      before(function () {
        this.content = fileContent(this.filename, {
          watch: true,
        }).publish();
        this._connection = this.content.connect();
        return this.content.take(1).toPromise();
      }); // Skip initial

      after(function () {
        if (this._connection) {
          this._connection.dispose();
        }
      });
      before(function () {
        this.changed = this.content.take(1).toPromise();
      }); // don't block

      before(function () {
        this.updated = {
          updated: 'content',
        };
        return writeFile(this.filename, JSON.stringify(this.updated));
      });
      it('returns the updated content', function () {
        return this.changed.then(({ data }) => {
          assert.deepEqual(this.updated, data);
        });
      });
    });
  });
  describe('when the surrounding dir does not exist', () => {
    before(function () {
      this.filename = path.join(os.tmpdir(), 'not-a-dir', 'some-file.cson');
    });
    it('does not fail, just ignores the watch', function () {
      return fileContent(this.filename, {
        watch: true,
        defaultValue: 42,
      })
        .take(2)
        .toPromise()
        .then(result => {
          assert.equal(42, result);
        });
    });
  });
  describe('a CSON file with syntax errors', () => {
    before(function () {
      this.filename = path.join(os.tmpdir(), 'some-file.cson'); // The content is missing a closing quote after Hello

      return writeFile(
        this.filename,
        'x: 10\nfoo: 13\nbar: "Hello\nzapp: 42\n'
      );
    });
    it('fails with a helpful error message', function () {
      checkError(
        fileContent(this.filename, {
          watch: false,
        }),
        error => {
          assert.equal('SyntaxError', error.name);
          assert.include('missing "', error.message);
          assert.include(`in ${this.filename}:3`, error.message);
        }
      );
    });
  });
  describe('a JSON file with syntax errors', () => {
    before(function () {
      this.filename = path.join(os.tmpdir(), 'some-file.json'); // The content is missing a comma after 42

      return writeFile(this.filename, '{\n  "foo": 42\n  "bar": 13\n}\n');
    });
    it('fails with a helpful error message', function () {
      checkError(
        fileContent(this.filename, {
          watch: false,
        }),
        error => {
          assert.equal('SyntaxError', error.name);
          assert.include('Unexpected string', error.message);
          assert.include(`in ${this.filename}`, error.message);
        }
      );
    });
  });
});
