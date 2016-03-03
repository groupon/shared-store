
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
var crashRecovery, fs, path;

fs = require('fs');

path = require('path');

crashRecovery = function(tmpDir) {
  var onApplicationCrashed, onDataLoaded, tearDownCrashHandler;
  onApplicationCrashed = function(exitCode) {
    var err, files;
    if (exitCode === 0) {
      return;
    }
    console.error('Application crashed with current config. Resetting cache.');
    files = (function() {
      var error;
      try {
        return fs.readdirSync(tmpDir);
      } catch (error) {
        err = error;
        console.error('Failed to read config cache directory', err.message);
        return null;
      }
    })();
    console.error('Trying to remove cache files', files);
    if (files == null) {
      return;
    }
    files.forEach(function(filename) {
      var absolute, error;
      absolute = path.join(tmpDir, filename);
      try {
        return fs.unlinkSync(absolute);
      } catch (error) {
        err = error;
        return console.error('Failed to reset %j', absolute, err.message);
      }
    });
    return console.error('Cache reset successful.');
  };
  process.on('exit', onApplicationCrashed);
  tearDownCrashHandler = function() {
    return process.removeListener('exit', onApplicationCrashed);
  };
  onDataLoaded = function() {
    return setTimeout(tearDownCrashHandler, 5000);
  };
  return {
    onDataLoaded: onDataLoaded,
    tearDownCrashHandler: tearDownCrashHandler
  };
};

module.exports = crashRecovery;
