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

const CSON = require('cson-parser');

const yaml = require('js-yaml');

const debug = require('debug')('shared-store:file');

const { promisify } = require('util');

const { dirChanges } = require('./dir-content');

const onInterval = require('./interval');

const { fromPromiseFunction } = require('./promise');

const readFile = promisify(fs.readFile);

function fileChanges(filename, options) {
  return dirChanges(path.dirname(filename), options).filter(
    ({ absolute }) => absolute === filename
  );
}

function isMissingError(error) {
  return error.code === 'ENOENT';
}

function parseYML(filename, content = '') {
  if (content.trim().length === 0) return {};

  try {
    return yaml.load(content);
  } catch (err) {
    err.message += ` in ${filename}`;
    throw err;
  }
}

/**
 * @param {string} filename
 * @param {string} content
 * @returns {{}}
 */
function parseCSON(filename, content = '') {
  if (content.trim().length === 0) return {};

  try {
    return CSON.parse(content);
  } catch (err) {
    err.message += ` in ${filename}:${err.location.first_line + 1}`;
    throw err;
  }
}

/**
 * @param {string} filename
 * @param {string} content
 * @returns {{}}
 */
function parseJSON(filename, content = '') {
  if (content.trim().length === 0) return {};

  try {
    return JSON.parse(content);
  } catch (err) {
    err.message += ` in ${filename}`;
    throw err;
  }
}

function parserFromExtension(filename) {
  switch (path.extname(filename)) {
    case '.json':
      return parseJSON.bind(null, filename);

    case '.cson':
      return parseCSON.bind(null, filename);

    case '.yml':
    case '.yaml':
      return parseYML.bind(null, filename);

    default:
      return value => value;
  }
}

function surroundingDirExists(filename) {
  try {
    const dirStat = fs.statSync(path.dirname(filename));
    return dirStat.isDirectory();
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err;
    }

    return false;
  }
}

function tap(fn) {
  return function (value) {
    fn(value);
    return value;
  };
}

function fileContent(filename, options = {}) {
  const { defaultValue, watch, interval, root: rootDir } = options;

  if (rootDir != null) {
    filename = path.resolve(rootDir, filename);
  }

  const parse =
    options.parse == null ? parserFromExtension(filename) : options.parse;

  const hasDefault = defaultValue !== undefined;
  debug('fileContent, watch: %j', !!watch, filename);

  function returnDefault(error) {
    if (isMissingError(error) && hasDefault) {
      return defaultValue;
    } else {
      return Promise.reject(error);
    }
  }

  const loaded = content => debug('Parsing %j', content);

  const wrap = data => ({
    data,
    time: Date.now(),
    source: filename,
  });

  const load = fromPromiseFunction.bind(null, () => {
    debug('readFile %s', filename);
    return readFile(filename, 'utf8')
      .then(tap(loaded))
      .then(parse)
      .then(wrap)
      .catch(returnDefault);
  });

  if (watch && surroundingDirExists(filename)) {
    return load().concat(fileChanges(filename).flatMap(load));
  } else {
    return onInterval(interval, load);
  }
}

module.exports = fileContent;
