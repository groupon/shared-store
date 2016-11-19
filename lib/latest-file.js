
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
var Observable, dirChanges, dirContent, getLatestFileInfo, getMTime, latestFile, mostRecent, onInterval;

Observable = require('rx').Observable;

dirChanges = (dirContent = require('./dir-content')).dirChanges;

onInterval = require('./interval');

mostRecent = function(previous, current) {
  if (current.mtime.getTime() > previous.mtime.getTime()) {
    return current;
  }
  return previous;
};

getLatestFileInfo = function(dir, filter) {
  return dirContent(dir, {
    statFiles: true,
    watch: false
  }).filter(filter).defaultIfEmpty().reduce(mostRecent).flatMap(function(info) {
    var err;
    if (info != null) {
      return Observable.just(info);
    } else {
      err = new Error("No file found in " + dir);
      err.code = 'ENOENT';
      return Observable["throw"](err);
    }
  });
};

getMTime = function(arg) {
  var mtime;
  mtime = arg.mtime;
  return mtime.getTime();
};

latestFile = function(dir, options) {
  var changes, filter, interval, load, watch;
  if (options == null) {
    options = {};
  }
  watch = options.watch, interval = options.interval, filter = options.filter;
  if (filter == null) {
    filter = function() {
      return true;
    };
  }
  if (watch == null) {
    watch = false;
  }
  if (interval == null) {
    interval = 0;
  }
  load = function() {
    return getLatestFileInfo(dir, filter);
  };
  if (watch) {
    changes = dirChanges(dir, {
      statFiles: true
    }).filter(filter);
    return load().concat(changes).scan(mostRecent).distinctUntilChanged(getMTime);
  } else {
    return onInterval(interval, load);
  }
};

module.exports = latestFile;
