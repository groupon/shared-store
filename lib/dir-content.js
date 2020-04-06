/*
Copyright (c) 2015, Groupon, Inc.
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions
are met:

Redistributions of source code must retain the above copyright notice,
this list of conditions and the following disclaimer.

Redistributions in binary form must reproduce the above copyright
notice, this list of conditions and the following disclaimer in the
documentation and/or other materials provided with the distribution.

Neither the name of GROUPON nor the names of its contributors may be
used to endorse or promote products derived from this software without
specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

'use strict';

const fs = require('fs');

const path = require('path');

const debug = require('debug')('shared-store:dir-content');

const extend = require('lodash/extend');

const { Observable } = require('rx');

const { promisify } = require('util');

const { fromPromiseFunction } = require('./promise');

const stat = promisify(fs.stat);
const readdir = promisify(fs.readdir);

function niceStat(props, absolute) {
  return stat(absolute).then(info => extend(info, props));
}

function unexpectedError(err) {
  return process.nextTick(() => {
    throw err;
  });
}

function dirChanges(dir, { statFiles } = {}) {
  if (statFiles == null) {
    statFiles = false;
  }

  return Observable.create(observer => {
    debug('Create watcher: %s', dir);
    const watcher = fs.watch(dir, {
      persistent: false,
    });
    const onNext = observer.onNext.bind(observer);
    const onError = observer.onError.bind(observer);
    watcher.on('error', onError);
    watcher.on('change', (event, filename) => {
      if (!filename) {
        return;
      }

      debug('File changed (%s)', event, filename);
      const absolute = path.join(dir, filename);
      const props = {
        event,
        filename,
        absolute,
      };

      if (statFiles) {
        niceStat(props, absolute)
          .then(onNext, error => {
            // This happens on file deletions and is fine.
            const { code } = error;
            debug('stat failed: %s', code, filename);

            if (code === 'ENOENT') {
              return;
            }

            onError(error);
          })
          .catch(unexpectedError);
      } else {
        onNext(props);
      }
    });

    function dispose() {
      debug('Closing watcher: %s', dir);
      return watcher.close();
    }

    return dispose;
  });
}

function promiseMap(handler) {
  return arr => Promise.all(arr.map(handler));
}

function dirContent(dir, { watch, statFiles } = {}) {
  if (statFiles == null) {
    statFiles = false;
  }

  if (watch == null) {
    watch = false;
  }

  const statDir = () =>
    readdir(dir).then(
      promiseMap(filename => {
        const absolute = path.join(dir, filename);
        const props = {
          filename,
          absolute,
        };

        if (statFiles) {
          return niceStat(props, absolute);
        } else {
          return props;
        }
      })
    );

  const initial = fromPromiseFunction(statDir).flatMap(Observable.from);

  if (watch) {
    return initial.concat(
      dirChanges(dir, {
        statFiles,
      })
    );
  } else {
    return initial;
  }
}

module.exports = extend(dirContent, {
  dirChanges,
  niceStat,
});
