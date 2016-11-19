
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
var Observable, debug, dirChanges, dirContent, extend, fromPromiseFunction, fs, niceStat, path, promisify, readdir, stat;

path = require('path');

fs = require('fs');

Observable = require('rx').Observable;

promisify = require('bluebird').promisify;

extend = require('lodash').extend;

debug = require('debug')('shared-store:dir-content');

fromPromiseFunction = require('./promise').fromPromiseFunction;

stat = promisify(fs.stat);

readdir = promisify(fs.readdir);

niceStat = function(props, absolute) {
  return stat(absolute).then(function(info) {
    return extend(info, props);
  });
};

dirChanges = function(dir, arg) {
  var statFiles;
  statFiles = (arg != null ? arg : {}).statFiles;
  if (statFiles == null) {
    statFiles = false;
  }
  return Observable.create(function(observer) {
    var dispose, onError, onNext, watcher;
    debug('Create watcher: %s', dir);
    watcher = fs.watch(dir, {
      persistent: false
    });
    onNext = observer.onNext.bind(observer);
    onError = observer.onError.bind(observer);
    watcher.on('error', onError);
    watcher.on('change', function(event, filename) {
      var absolute, props;
      if (!filename) {
        return;
      }
      debug('File changed (%s)', event, filename);
      absolute = path.join(dir, filename);
      props = {
        event: event,
        filename: filename,
        absolute: absolute
      };
      if (statFiles) {
        return niceStat(props, absolute).done(onNext, function(error) {
          var code, ref;
          code = (ref = error.cause) != null ? ref.code : void 0;
          debug('stat failed: %s', code, filename);
          if (code === 'ENOENT') {
            return;
          }
          return onError(error);
        });
      } else {
        return onNext(props);
      }
    });
    dispose = function() {
      debug('Closing watcher: %s', dir);
      return watcher.close();
    };
    return dispose;
  });
};

dirContent = function(dir, arg) {
  var initial, ref, statDir, statFiles, watch;
  ref = arg != null ? arg : {}, watch = ref.watch, statFiles = ref.statFiles;
  if (statFiles == null) {
    statFiles = false;
  }
  if (watch == null) {
    watch = false;
  }
  statDir = function() {
    return readdir(dir).map(function(filename) {
      var absolute, props;
      absolute = path.join(dir, filename);
      props = {
        filename: filename,
        absolute: absolute
      };
      if (statFiles) {
        return niceStat(props, absolute);
      } else {
        return props;
      }
    });
  };
  initial = fromPromiseFunction(statDir).flatMap(Observable.from);
  if (watch) {
    return initial.concat(dirChanges(dir, {
      statFiles: statFiles
    }));
  } else {
    return initial;
  }
};

module.exports = extend(dirContent, {
  dirChanges: dirChanges,
  niceStat: niceStat
});
