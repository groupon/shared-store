'use strict';

const fs = require('fs');

const os = require('os');

const path = require('path');

const assert = require('assert');

const CSON = require('cson-parser');

const yaml = require('js-yaml');

const { promisify } = require('util');

const fileContent = require('../lib/file');

const checkError = require('./check-error');

const writeFile = promisify(fs.writeFile);

describe('fileContent', () => {
  it('is a function', () => {
    assert.strictEqual(typeof fileContent, 'function');
  });

  it('fails when the file does not exist', async () => {
    const filename = path.join(os.tmpdir(), 'missing.json');
    await checkError(
      fileContent(filename, {
        watch: false,
      }),
      error => {
        assert.strictEqual(error.code, 'ENOENT');
      }
    );
  });

  describe('supported file types', () => {
    const testCases = [
      ['.cson', CSON.stringify, [null, 2]],
      ['.json', JSON.stringify, [null, 2]],
      ['.yml', yaml.dump],
    ];

    for (const testCase of testCases) {
      const [fileType, writer, writerArgs = []] = testCase;

      describe(fileType, () => {
        let filename;
        let initialContent;
        beforeEach(() => {
          filename = path.join(os.tmpdir(), `some-file${fileType}`);
          initialContent = {
            initial: 'state',
          };
          return writeFile(filename, writer(initialContent, ...writerArgs));
        });

        it('returns the parsed content', async () => {
          const { data } = await fileContent(filename, {
            watch: false,
          }).toPromise();

          assert.deepStrictEqual(data, initialContent);
        });

        it("doesn't throw on an empty file", async () => {
          filename = path.join(os.tmpdir(), `some-file${fileType}`);
          await writeFile(filename, '');

          const { data } = await fileContent(filename, {
            watch: false,
          }).toPromise();

          assert.deepStrictEqual(data, {});
        });

        it("doesn't throw on a file with newline chars", async () => {
          filename = path.join(os.tmpdir(), `some-file${fileType}`);
          await writeFile(filename, '\n\n'); // when folks delete newline chars might remain

          const { data } = await fileContent(filename, {
            watch: false,
          }).toPromise();

          assert.deepStrictEqual(data, {});
        });

        describe('after changing the file', () => {
          let content;
          let connection;
          let changed;
          let updated;

          beforeEach(() => {
            content = fileContent(filename, {
              watch: true,
            }).publish();
            connection = content.connect();
            return content.take(1).toPromise();
          }); // Skip initial

          beforeEach(() => {
            changed = content.take(1).toPromise();
            updated = {
              updated: 'content',
            };
            return writeFile(filename, writer(updated, ...writerArgs));
          });

          afterEach(() => {
            if (connection) {
              connection.dispose();
            }
          });

          it('returns the updated content', async () => {
            const { data } = await changed;

            assert.deepStrictEqual(data, updated);
          });
        });
      });
    }
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
          assert.strictEqual(result, 42);
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

    it('fails with a helpful error message', async function () {
      await checkError(
        fileContent(this.filename, {
          watch: false,
        }),
        error => {
          assert.strictEqual(error.name, 'SyntaxError');
          assert.ok(error.message.includes('missing "'));
          assert.ok(error.message.includes(`in ${this.filename}:3`));
        }
      );
    });
  });

  describe('a JSON file with syntax errors', () => {
    before(function () {
      this.filename = path.join(os.tmpdir(), 'some-file.json'); // The content is missing a comma after 42

      return writeFile(this.filename, '{\n  "foo": 42\n  "bar": 13\n}\n');
    });

    it('fails with a helpful error message', async function () {
      await checkError(
        fileContent(this.filename, {
          watch: false,
        }),
        error => {
          assert.strictEqual(error.name, 'SyntaxError');
          assert.ok(error.message.includes('Unexpected string'));
          assert.ok(error.message.includes(`in ${this.filename}`));
        }
      );
    });
  });
});
