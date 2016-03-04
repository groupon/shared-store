
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
var filter, max, merge, pluck, reduce, ref, safeMerge, sourceList, toArray,
  slice = [].slice;

ref = require('lodash'), merge = ref.merge, pluck = ref.pluck, max = ref.max, reduce = ref.reduce, filter = ref.filter;

toArray = function(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (value != null) {
    return [value];
  } else {
    return [];
  }
};

sourceList = function(result, source) {
  return toArray(result).concat(toArray(source));
};

safeMerge = function() {
  var args, data, source, time;
  args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
  data = merge.apply(null, [{}].concat(slice.call(pluck(args, 'data'))));
  time = max(filter(pluck(args, 'time')));
  source = reduce(pluck(args, 'source'), sourceList);
  return {
    data: data,
    time: time,
    source: source
  };
};

module.exports = safeMerge;
