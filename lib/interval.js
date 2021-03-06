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

const { Observable } = require('rx-lite');

function onInterval(interval, load) {
  if (interval > 0) {
    if (interval < 1000) {
      return Observable.throw(
        new Error(`Interval has to be at least 1s: ${interval}ms`)
      );
    } else {
      return Observable.create(observer => {
        let timeoutHandle;
        let loadSubscription;

        function dispose() {
          if (timeoutHandle) {
            clearTimeout(timeoutHandle);
          }

          if (loadSubscription) {
            loadSubscription.dispose();
          }

          loadSubscription = null;
          timeoutHandle = null;
        }

        function prepareNext() {
          dispose();
          timeoutHandle = setTimeout(runLoad, interval);
        }

        function runLoad() {
          dispose();
          loadSubscription = load().subscribe(
            observer.onNext.bind(observer),
            observer.onError.bind(observer),
            prepareNext
          );
        }

        runLoad();
        return dispose;
      });
    }
  } else {
    return load();
  }
}

module.exports = onInterval;
