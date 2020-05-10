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

const debug = require('debug')('shared-store:file-alternatives');

const { Observable } = require('rx-lite');

const fileContent = require('./file');

function filterExisting(filenames, rootDir) {
  return filenames.filter(filename => {
    if (rootDir != null) {
      filename = path.resolve(rootDir, filename);
    }

    return fs.existsSync(filename);
  });
}

function fileAlternativesContent(filenames, options = {}) {
  const { defaultValue, root: rootDir } = options;

  if (!Array.isArray(filenames)) {
    filenames = [filenames];
  }

  debug('checking file alternatives', filenames);
  const hasDefault = defaultValue !== undefined;
  const hits = filterExisting(filenames, rootDir);

  switch (hits.length) {
    case 0:
      debug('none found');

      if (hasDefault) {
        debug('using defaultValue');
        return Observable.just(defaultValue);
      } else {
        return Observable.throw(
          new Error(`none of ${filenames.join(', ')} exist`)
        );
      }

    case 1:
      const filename = hits[0];
      debug('using %s', filename);
      return fileContent(filename, options);

    default:
      return Observable.throw(
        new Error(`multiple file alternatives present: ${hits.join(', ')}`)
      );
  }
}

module.exports = fileAlternativesContent;
