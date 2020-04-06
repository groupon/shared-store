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

let timestampName;

const fs = require('fs');

const path = require('path');

const debug = require('debug')('shared-store:cache');

const isEqual = require('lodash/isEqual');

const property = require('lodash/property');

const partial = require('lodash/partial');

const mkdirp = require('mkdirp');

const { Observable } = require('rx');

const promisify = require('util.promisify');

const crashRecovery = require('./crash-recovery');

const dirContent = require('./dir-content');

const latestFile = require('./latest-file');

const { fromPromiseFunction } = require('./promise');

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);
const mkdirpStream = Observable.fromNodeCallback(mkdirp);

function isCacheFile({ filename }) {
  return /[\d-]+T[\d]+Z\.json/.test(filename);
}

this.timestampName = timestampName = function () {
  const date = new Date().toISOString().replace(/[:.]/g, '');
  return `${date}.json`;
};

function sortByMostRecent(files) {
  return files.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
}

function cleanup(tmpDir) {
  return (
    // enforce side effects
    dirContent(tmpDir, {
      watch: false,
      statFiles: true,
    })
      .filter(isCacheFile)
      .toArray()
      .flatMap(sortByMostRecent)
      .skip(5)
      .map(property('absolute'))
      .subscribe(unlink)
  );
}

function readCacheFile({ absolute }) {
  return readFile(absolute)
    .then(JSON.parse)
    .then(({ data, time }) => ({
      data,
      time,
      source: absolute,
      usingCache: true,
    }));
}

function latestCacheFile(tmpDir, watch = false) {
  const options = {
    watch,
    filter: isCacheFile,
  };
  return latestFile(tmpDir, options).flatMap(readCacheFile);
}

function writeCache(tmpDir, changed) {
  function writeIfChanged(latest) {
    if (latest != null && isEqual(changed.data, latest.data)) {
      debug('Latest cache file matches');
      return Observable.just(latest);
    } else {
      const filename = path.join(tmpDir, timestampName());
      debug('Writing new cache file', filename);
      const serialized = JSON.stringify(changed, null, 2);
      return fromPromiseFunction(() => writeFile(filename, serialized)).map(
        () => changed
      ); // return the data
    }
  }

  return mkdirpStream(tmpDir)
    .flatMap(() => tryCache(tmpDir))
    .defaultIfEmpty()
    .flatMap(writeIfChanged)
    .finally(() => cleanup(tmpDir));
}

function tryCache(tmpDir) {
  return latestCacheFile(tmpDir, false).catch(error => {
    if (error.code === 'ENOENT') {
      debug('No cache file found');
      return Observable.empty();
    } else if (error instanceof SyntaxError) {
      debug(`Invalid cache file found: ${error.message}`);
      return Observable.empty();
    } else {
      return Observable.throw(error);
    }
  });
}

function activeLoader(meta, loader, tmpDir, writeCacheFiles) {
  const rawData = meta.flatMapLatest(loader).map(otherData => {
    otherData.usingCache = false;
    return otherData;
  });

  if (!writeCacheFiles) {
    debug('skip writing a cache, returning raw data stream');
    return rawData.distinctUntilChanged(property('data'), isEqual).publish();
  }

  debug('wrapping data stream in cache', {
    tmpDir,
  });
  const { onDataLoaded, tearDownCrashHandler } = crashRecovery(tmpDir);
  const data = rawData.tap(
    onDataLoaded,
    tearDownCrashHandler,
    tearDownCrashHandler
  );
  const fromCache = tryCache(tmpDir);
  return fromCache
    .takeUntil(data)
    .merge(data)
    .distinctUntilChanged(property('data'), isEqual)
    .flatMapLatest(partial(writeCache, tmpDir))
    .publish();
}

function passiveLoader(tmpDir) {
  return latestCacheFile(tmpDir, true).publish();
}

this.cachedLoader = function (
  meta,
  loader,
  tmpDir,
  active,
  writeCacheFiles = true
) {
  debug('cachedLoader(%j)', active);
  loader = active
    ? activeLoader(meta, loader, tmpDir, writeCacheFiles)
    : passiveLoader(tmpDir);
  return Observable.create(observer => {
    loader.subscribe(observer);
    loader.connect();
  });
};

this.latestCacheFile = latestCacheFile;
