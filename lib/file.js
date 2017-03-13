
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
var Bluebird, CSON, debug, dirChanges, fileChanges, fileContent, fromPromiseFunction, fs, identity, isMissingError, onInterval, parseCSON, parseJSON, parserFromExtension, partial, path, promisify, readFile, ref, surroundingDirExists;

fs = require('fs');

path = require('path');

promisify = (Bluebird = require('bluebird')).promisify;

ref = require('lodash'), partial = ref.partial, identity = ref.identity;

CSON = require('cson-parser');

debug = require('debug')('shared-store:file');

fromPromiseFunction = require('./promise').fromPromiseFunction;

onInterval = require('./interval');

dirChanges = require('./dir-content').dirChanges;

readFile = promisify(fs.readFile);

fileChanges = function(filename, options) {
  return dirChanges(path.dirname(filename), options).filter(function(arg) {
    var absolute;
    absolute = arg.absolute;
    return absolute === filename;
  });
};

isMissingError = function(error) {
  return error.cause && error.cause.code === 'ENOENT';
};

parseCSON = function(filename, content) {
  var err;
  try {
    return CSON.parse(content);
  } catch (error1) {
    err = error1;
    err.message += " in " + filename + ":" + (err.location.first_line + 1);
    throw err;
  }
};

parseJSON = function(filename, content) {
  var err;
  try {
    return JSON.parse(content);
  } catch (error1) {
    err = error1;
    err.message += " in " + filename;
    throw err;
  }
};

parserFromExtension = function(filename) {
  switch (path.extname(filename)) {
    case '.json':
      return partial(parseJSON, filename);
    case '.cson':
      return partial(parseCSON, filename);
    default:
      return identity;
  }
};

surroundingDirExists = function(filename) {
  var dirStat, err;
  try {
    dirStat = fs.statSync(path.dirname(filename));
    return dirStat.isDirectory();
  } catch (error1) {
    err = error1;
    if (err.code !== 'ENOENT') {
      throw err;
    }
    return false;
  }
};

fileContent = function(filename, options) {
  var defaultValue, hasDefault, interval, load, loaded, parse, returnDefault, rootDir, watch, wrap;
  if (options == null) {
    options = {};
  }
  defaultValue = options.defaultValue, watch = options.watch, interval = options.interval, parse = options.parse, rootDir = options.root;
  if (rootDir != null) {
    filename = path.resolve(rootDir, filename);
  }
  if (parse == null) {
    parse = parserFromExtension(filename);
  }
  hasDefault = defaultValue !== void 0;
  debug('fileContent, watch: %j', !!watch, filename);
  returnDefault = function(error) {
    if (hasDefault) {
      return defaultValue;
    } else {
      return Bluebird.reject(error);
    }
  };
  loaded = function(content) {
    return debug('Parsing %j', content);
  };
  wrap = function(data) {
    return {
      data: data,
      time: Date.now(),
      source: filename
    };
  };
  load = partial(fromPromiseFunction, function() {
    debug('readFile %s', filename);
    return readFile(filename, 'utf8').tap(loaded).then(parse).then(wrap)["catch"](isMissingError, returnDefault);
  });
  if (watch && surroundingDirExists(filename)) {
    return load().concat(fileChanges(filename).flatMap(load));
  } else {
    return onInterval(interval, load);
  }
};

module.exports = fileContent;
