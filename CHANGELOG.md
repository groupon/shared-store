### 2.1.3

* Consume body of 304 response - **[@jkrems](https://github.com/jkrems)** [#32](https://github.com/groupon/shared-store/pull/32)
  - [`1453210`](https://github.com/groupon/shared-store/commit/145321022e7110d9509424d0b982fbb1d18c156e) **fix:** Consume body of 304 response


### 2.1.2

* Safer interval handling - **[@jkrems](https://github.com/jkrems)** [#31](https://github.com/groupon/shared-store/pull/31)
  - [`bfb7276`](https://github.com/groupon/shared-store/commit/bfb72765ba460a2f1af73b93eb5715f222cdf0ba) **fix:** Safer interval handling
  - [`4bd2ffa`](https://github.com/groupon/shared-store/commit/4bd2ffaafa666916e7e6384ab41d7479affe46cd) **test:** Pass on node 6


### 2.1.1

* stop emitting updates on HTTP 304s - **[@dbushong](https://github.com/dbushong)** [#30](https://github.com/groupon/shared-store/pull/30)
  - [`b5ea890`](https://github.com/groupon/shared-store/commit/b5ea890801b616759577eada2257e97786a6fdf8) **perf:** stop emitting updates on HTTP 304s
  - [`4d1a718`](https://github.com/groupon/shared-store/commit/4d1a7183d6fa96f1ff2c480cd37177a910e5d8b3) **chore:** update nlm & mocha; rebuild JS
  - [`9a8f23b`](https://github.com/groupon/shared-store/commit/9a8f23be74eb479cb5ad7faa7fe7a24481b542e3) **chore:** update coffeelint & make code pass


### 2.1.0

* feat: allow switching active mode after instantiation - **[@dbushong](https://github.com/dbushong)** [#29](https://github.com/groupon/shared-store/pull/29)
  - [`115352a`](https://github.com/groupon/shared-store/commit/115352aec3ec3037587fbda622f47efa6ec97581) **feat:** allow switching active mode after instantiation


### 2.0.3

* Apply latest nlm generator & upgrade to bluebird 3.x - **[@i-tier-bot](https://github.com/i-tier-bot)** [#28](https://github.com/groupon/shared-store/pull/28)
  - [`55b3a28`](https://github.com/groupon/shared-store/commit/55b3a2878c6a6aacef08c8f94b23c5b7dc978e04) **chore:** Apply latest nlm generator
  - [`cac9301`](https://github.com/groupon/shared-store/commit/cac9301c64169aefea505a957fba036f0dc54ce9) **fix:** Changes for bluebird 3


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
