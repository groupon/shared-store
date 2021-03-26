[![nlm-github](https://img.shields.io/badge/github-groupon%2Fshared--store%2Fissues-F4D03F?logo=github&logoColor=white)](https://github.com/groupon/shared-store/issues)
![nlm-node](https://img.shields.io/badge/node-%3E%3D10.13-blue?logo=node.js&logoColor=white)
![nlm-version](https://img.shields.io/badge/version-4.0.8-blue?logo=version&logoColor=white)
# shared-store

This module allows you load data from a JSON/CSON file, URL or custom loader
function and share that data easily amongst multiple node.js worker processes.
When the data changes, the master process will load the latest changes, which
are immediately made available for all workers to consume.

At Groupon, this allows us to dynamically update app config in a central
system, and see those changes propagate automatically to our node.js processes
without having to restart our apps.

For development, engineers can change their local file-based config, and see
those changes reflected immediately.

Files are observed via `fs.watch` and URLs via a polling mechanism.  HTTP cache
headers are supported for optimal fetching behavior.

## Install

```bash
npm install --save shared-store
```

## Usage

The code below can be used in both master & child processes.  The master process
(i.e. `cluster.isMaster`) will run the loader; whereas the child processes will
fetch changes from the `temp` directory.

```js
const SharedStore = require('shared-store');
const fileContent = require('shared-store/file');

const store = new SharedStore({
  temp: 'tmp/config',

  loader(options) {
    return fileContent(options.filename, {
      watch: true,
    });
  }
});

// Load the initial configuration
store.init({ filename: 'conf/application.json' })
  .then(config => {

    // The `config` variable was passed into the callback for convenience
    // purposes only.  If you want the latest data at any point, you can call:
    const latestConfig = store.getCurrent();

    const server = require('http').createServer((req, res) => {
      res.end('ok');
    }).listen(latestConfig.port);
  }).catch(err => { throw err });
```

When loading fails, the store will fall back to the `temp` directory.

## API

### `new SharedStore({ temp, loader, active })`

Creates a new store, based on the given `loader`.

* `temp`:
  Directory to store cached versions of the data.
  This is used for handling load errors
  and for sharing data across processes.
  The directory should not contain any other files.
* `loader`:
  A function that takes `options` and returns
  an observable with the data.
* `active`:
  If this instance should actively load the data
  or just get the latest from the `temp` directory.
  Defaults to `cluster.isMaster`.


#### `store.init([ options, [ callback ] ])`

Sets the options that will be passed into the loader.
The promise will be resolved with the initial data.

Note that cached data could be returned in the callback/promise if it already
exists.

`SharedStore` does not interpret `options` in any way,
it is just forwarded to the loader.


#### `store.getCurrent()`

Get the last known version of the data.
This function is safe to call once `init` finished.
It will just return `undefined` otherwise.

#### `store.setActive(active=true)`

Enables/disables active mode (see constructor).

### `SharedStore.safeMerge`

Random utility function to deep-merge multiple objects
without mutating any of the input arguments.
Very useful in loader implementations
when combined with `Observable.combineLatest`.


### `fileContent(filename, options)`

```js
const fileContent = require('shared-store/file');
```

An observable representing the content of a file.
By default parses the content based on the extension.

Support for the following extensions is built in:

* `.json`:
  Parsed using `JSON.parse`
* `.cson`:
  Parsed using [`CSON.parse`](https://github.com/groupon/cson-parser)

##### Options

* `defaultValue`:
  If the file is not found, return this value instead.
  Parse errors will still cause failures.
* `root`:
  If provided, the filename will be resolved relative to it.
* `parse`:
  Function that takes a string and parses it into data.
  Defaults to auto-detection from the file's extension.
* `watch`: Watch file for changes, defaults to `false`.
* `interval`:
  Interval for checking for file changes in ms.
  If provided, has to be at least 1000 (1 second).
  Any value `<= 0` disables the behavior.
  If `watch` is enabled, `interval` is automatically disabled.
  Defaults to `0` (disabled).

### `fileAlternativesContent([filename, ...], options)`

```js
const fileAlternativesContent = require('shared-store/file-alternatives');
```

An observable representing the content of a single file, chosen from among
multiple alternatives.  All of the alternatives in the array argument are
checked for existence.  Iff exactly one exists, it is passed along with
`options` to `fileContent()`.  This is useful for multiple extensions:

```js
fileAlternativesContent(['some-file.cson', 'some-file.json'], options)
```

or for a legacy path location and a new path location:

```js
fileAlternativesContent([oldestPath, oldPath, currentPath], options)
```

If more than one or none of the paths exist, it is an error.

### `httpResource({fetch, interval})`

```js
const httpResource = require('shared-store/http');
```

An observable representing a cacheable HTTP resource.
Makes only minimal assumptions about how the data is fetched
and focuses on handling caching.

For `interval`, see the `fileContent` options above.

##### `fetch(headers) -> Promise({ body, response })`

The http resource will pass in cache headers
that should be forwarded by the fetch implementation.
`httpResource` will store `ETag` and `Last-Modified` headers
in the response and pass them into subsequent requests.
If `response.statusCode` is 304,
the last known body will be returned.
`httpResource` does not interpret the body in any way.

Example `fetch` implementation using `request`:

```js
function fetch(headers) {
  return new Promise((resolve, reject) => {
    request('http://my-service/config', {
      headers, json: true
    }, (error, response) => {
      if (response && response.statusCode === 304) {
        // Ignore parse errors etc. when a 304 is received
        return resolve({ response });
      } else if (error) {
        // Forward errors
        return reject(error);
      }
      // Default: resolve with response and body
      resolve({ response, body: response.body });
    });
  });
}
```

If you don't set an interval,
handling the `headers` argument isn't necessary.

## Events

Events are emitted on instances of the `SharedStore` class.  Most notably,
error events are emitted as `'err'` and not `'error'`.  This is because
unhandled `'error'` events throw, which isn't necessary when fetching fails
due to HTTP connection timeouts, etc.

In this scenario, the cached copy will continue to be used until the data
source is available again.

## Tests
Once you've cloned the repository, you can run:

```bash
npm run setup
npm test
```

Note: `npm run setup` is the same as `npm install` except that it ensures the
public npm registry is always used.

## License
```
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
```
