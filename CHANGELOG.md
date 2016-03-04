### 2.0.2

* Update to nlm v2 - **[@jkrems](https://github.com/jkrems)** [#27](https://github.com/groupon/shared-store/pull/27)
  - [`9d61ca8`](https://github.com/groupon/shared-store/commit/9d61ca8a9720139bdfb8f8114f5ed597f5d3e05c) **chore:** Update to nlm v2


### 2.0.1

* fix: survive invalid json tmpfile on init() - **[@dbushong](https://github.com/dbushong)** [#26](https://github.com/groupon/shared-store/pull/26)
  - [`7d5c9cc`](https://github.com/groupon/shared-store/commit/7d5c9ccae0b8f4d3ab3fed80ad29fdb90ff8c915) **fix:** survive invalid json tmpfile on init()


### 2.0.0

#### Breaking Changes

We are only testing against node v4 from now on.

*See: [`e782cba`](https://github.com/groupon/shared-store/commit/e782cba29798d6bd5b1913d15e4b2b6b58ee53c4)*

#### Commits

* Switch from npub to nlm - **[@jkrems](https://github.com/jkrems)** [#25](https://github.com/groupon/shared-store/pull/25)
  - [`e782cba`](https://github.com/groupon/shared-store/commit/e782cba29798d6bd5b1913d15e4b2b6b58ee53c4) **chore:** Switch from npub to nlm


1.1.0
-----
* More useful parse errors for files - @jkrems
  https://github.com/groupon/shared-store/pull/24

1.0.12
------
* fix to resolve store.init if cache = loaded data - @chkhoo #22

1.0.11
------
* emit correct @_options to meta - @chkhoo #20
* fix when store.init errors, fetches from cache & getCurrent is null - @chkhoo #19

1.0.10
------
* fix ENOTFOUND error by intercepting init rejection - @chkhoo #18

1.0.9
-----
* fix getaddrinfo ENOTFOUND by connecting only when subscribed - @chkhoo #17

1.0.8
-----
* retry upon failure - @chkhoo #14

1.0.7
-----
* fix fetching data from cache with init - @chkhoo #12

1.0.6
-----
* fix multiple error events for single onError value - @chkhoo #11

1.0.5
-----
* fix first error to store.init callback - @chkhoo #9
* Put more focus on loader `options` in example - @jkrems #7
* remove redundant npub tasks & Observable declarations - @chkhoo #6
* fix err typo in README.md - @chkhoo #3

1.0.4
-----
* Clean up license headers - @jkrems #2
* Clear cache when app fails to start - @jkrems #1
