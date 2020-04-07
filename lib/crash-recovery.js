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

const console = require('console');

const path = require('path');

function crashRecovery(tmpDir) {
  function onApplicationCrashed(exitCode) {
    if (exitCode === 0) {
      return;
    }

    console.error(`\
Application crashed with current config. Resetting cache.\
`);

    let files;
    try {
      files = fs.readdirSync(tmpDir);
    } catch (error) {
      console.error('Failed to read config cache directory', error.message);
    }

    console.error('Trying to remove cache files', files);

    if (files == null) {
      return;
    }

    files.forEach(filename => {
      const absolute = path.join(tmpDir, filename);

      try {
        fs.unlinkSync(absolute);
      } catch (error) {
        console.error('Failed to reset %j', absolute, error.message);
      }
    });
    console.error('Cache reset successful.');
  }

  process.on('exit', onApplicationCrashed);

  const tearDownCrashHandler = () =>
    process.removeListener('exit', onApplicationCrashed);

  const onDataLoaded = () =>
    // if the app survives 5s after initial load, we believe it's fine
    setTimeout(tearDownCrashHandler, 5000);

  return {
    onDataLoaded,
    tearDownCrashHandler,
  };
}

module.exports = crashRecovery;
