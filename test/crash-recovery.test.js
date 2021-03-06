'use strict';

const childProcess = require('child_process');

const fs = require('fs');

const assert = require('assert');

const tmp = require('tmp');

const { promisify } = require('util');

const { timestampName } = require('../lib/cache');

const writeFile = promisify(fs.writeFile);

function execFile(...args) {
  return new Promise((resolve, reject) => {
    childProcess.execFile(...Array.from(args), (err, stdout, stderr) => {
      if (err) {
        return reject(err);
      }

      return resolve({
        stdout,
        stderr,
      });
    });
  });
}

const childPath = `${__dirname}/crashing`;

function unexpected() {
  throw new Error('Unexpected success');
}

describe('Crash recovery', () => {
  before(function (done) {
    process.setMaxListeners(99); // repeated process.on('exit') blab warnings

    tmp.dir(
      {
        unsafeCleanup: true,
      },
      (err, tmpDir) => {
        this.tmpDir = tmpDir;
        done(err);
      }
    );
  });
  before(function () {
    // Write known broken config
    const brokenCache = JSON.stringify(
      {
        data: {
          crashing: true,
        },
      },
      null,
      2
    );
    return writeFile(`${this.tmpDir}/${timestampName()}`, brokenCache);
  });

  it('crashes initially', function () {
    return execFile(childPath, [this.tmpDir]).then(unexpected, error => {
      assert.ok(error.message.includes('Error: Expected crash'));
      assert.ok(error.message.includes('Cache reset successful'));
    });
  });

  it('succeeds on retry', function () {
    return execFile(childPath, [this.tmpDir]).then(({ stdout, stderr }) => {
      assert.strictEqual(stderr, '');
      assert.strictEqual(stdout, 'ok\n');
    });
  });
});
describe('Crash avoidance', () => {
  before(function (done) {
    process.setMaxListeners(99); // repeated process.on('exit') blab warnings

    tmp.dir(
      {
        unsafeCleanup: true,
      },
      (err, tmpDir) => {
        this.tmpDir = tmpDir;
        done(err);
      }
    );
  });
  before(function () {
    // Write invalid JSON config
    const badJSON = '{';
    return writeFile(`${this.tmpDir}/${timestampName()}`, badJSON);
  });

  it('starts up anyway', function () {
    const env = {
      DEBUG: 'shared-store:cache',

      ...process.env,
    };
    return execFile(childPath, [this.tmpDir], {
      env,
    }).then(({ stdout }) => {
      assert.strictEqual(stdout, 'ok\n');
    });
  });
});
