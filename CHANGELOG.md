### 4.0.4 - 2020-07-20

* chore(deps): bump lodash from 4.17.15 to 4.17.19 - **[@dependabot[bot]](https://github.com/apps/dependabot)** [#45](https://github.com/groupon/shared-store/pull/45)
  - [`c468f10`](https://github.com/groupon/shared-store/commit/c468f100a06c19652df78a2179820d039ddbc1bf) **chore:** bump lodash from 4.17.15 to 4.17.19 - see: [4](- [Commits](https://github.com/lodash/lodash/compare/4)


### 4.0.3 - 2020-05-10

* refactor: switch to rx-lite packages - **[@aaarichter](https://github.com/aaarichter)** [#44](https://github.com/groupon/shared-store/pull/44)
  - [`c8dc636`](https://github.com/groupon/shared-store/commit/c8dc63691e09cc02f8a421571459d907e5acb984) **refactor:** switch to rx-lite packages


### 4.0.2 - 2020-05-06

* fix: set internal vars ahead of time - **[@aaarichter](https://github.com/aaarichter)** [#43](https://github.com/groupon/shared-store/pull/43)
  - [`5f7008d`](https://github.com/groupon/shared-store/commit/5f7008d214be98a2c64320973e7200beb74c863a) **fix:** set internal vars ahead of time


### 4.0.1 - 2020-04-30

* chore: update package and remove unused bluebird pkg - **[@aaarichter](https://github.com/aaarichter)** [#42](https://github.com/groupon/shared-store/pull/42)
  - [`36a7c5a`](https://github.com/groupon/shared-store/commit/36a7c5a93705db5f89cd4f32d21452f47acd7d39) **chore:** update package and remove unused bluebird pkg


### 4.0.0 - 2020-04-07

#### Breaking Changes

- drop node 8 support due to dependencies

*See: [`ad0263e`](https://github.com/groupon/shared-store/commit/ad0263e16033790f095d049c5699c5b728678218)*

#### Commits

* refactor: decaf, node 8 deprecation & package upgrades - **[@aaarichter](https://github.com/aaarichter)** [#41](https://github.com/groupon/shared-store/pull/41)
  - [`da08155`](https://github.com/groupon/shared-store/commit/da081559157016869b0c257ec5dad9f419536806) **refactor:** decaf /test
  - [`651472b`](https://github.com/groupon/shared-store/commit/651472b8a8e80cda33e0386f08e9a1f9ed5d273a) **refactor:** decaf /lib & improve tests
  - [`99a61da`](https://github.com/groupon/shared-store/commit/99a61dac1422f1be6ddae539ab9d3844b1d03654) **refactor:** safeMerge()
  - [`514a840`](https://github.com/groupon/shared-store/commit/514a840bb27cb30afb309a66eecec48a79e4147d) **chore:** upgrade cson-parser
  - [`ad0263e`](https://github.com/groupon/shared-store/commit/ad0263e16033790f095d049c5699c5b728678218) **chore:** drop node 8 support & upgrade mkdirp
  - [`84dcdd1`](https://github.com/groupon/shared-store/commit/84dcdd16e90829bf32c81fdd984e99487af92743) **refactor:** replace util.promisify with node promisify
  - [`15ab806`](https://github.com/groupon/shared-store/commit/15ab8061ee729d8790197408db0be37ed6b087c8) **chore:** ugprade debug
  - [`9ad2792`](https://github.com/groupon/shared-store/commit/9ad27927c46be953da6b4f6fb86c4e4430326bfc) **chore:** upgrade dev dependencies
  - [`dd4cdc8`](https://github.com/groupon/shared-store/commit/dd4cdc8d549b8a826a5b4f525086b226ccdcf22e) **chore:** add nyc
  - [`d0971dd`](https://github.com/groupon/shared-store/commit/d0971ddaf95552eed56a1969fb93654304073df9) **refactor:** replace lodash functions
  - [`a178aaf`](https://github.com/groupon/shared-store/commit/a178aaf2ec9db436e7d3e072a629e3b46a7a428b) **style:** clean code
  - [`948dc19`](https://github.com/groupon/shared-store/commit/948dc1933b6c7719c2b414c1d0524e6b4fb0bc02) **chore:** upgrade to rx 4.x
  - [`e168b42`](https://github.com/groupon/shared-store/commit/e168b42b3670422de90f545a62139b687ec684c3) **fix:** update travis.yml
  - [`49e4f31`](https://github.com/groupon/shared-store/commit/49e4f3194ed324d1af6bb7b9bbdb0eb2e7a4555b) **docs:** update readme


### 3.1.1

* default `setActive()` to write cache files - **[@dbushong](https://github.com/dbushong)** [#40](https://github.com/groupon/shared-store/pull/40)
  - [`70fb4ea`](https://github.com/groupon/shared-store/commit/70fb4eae8937521abe99cacde9da701dfc5bc9e9) **fix:** default `setActive()` to write cache files


### 3.1.0

* Allow skipping all tmp files - **[@jkrems](https://github.com/jkrems)** [#39](https://github.com/groupon/shared-store/pull/39)
  - [`ebf18c1`](https://github.com/groupon/shared-store/commit/ebf18c1d39172d5710f8edc84d6e2f9cdd2841c2) **feat:** Allow skipping all tmp files


### 3.0.0

#### Breaking Changes

None of the methods return Bluebird promises anymore.
If a consumer of this library depends on it, they need to refactor
to use native promise-based solutions.

*See: [`5f22f8c`](https://github.com/groupon/shared-store/commit/5f22f8c80831e5531a4deb49d7835f7ca4f51500)*

#### Commits

* Remove bluebird dependency - **[@jkrems](https://github.com/jkrems)** [#38](https://github.com/groupon/shared-store/pull/38)
  - [`5f22f8c`](https://github.com/groupon/shared-store/commit/5f22f8c80831e5531a4deb49d7835f7ca4f51500) **refactor:** Remove bluebird dependency


### 2.2.2

* Apply latest nlm generator - **[@markowsiak](https://github.com/markowsiak)** [#36](https://github.com/groupon/shared-store/pull/36)
  - [`535aa21`](https://github.com/groupon/shared-store/commit/535aa21152e4b283d783daca04a860e8fd56feb3) **chore:** Apply latest nlm generator
  - [`cf92a1e`](https://github.com/groupon/shared-store/commit/cf92a1e7b0ac80f409dc99aeb06e01a761e4e79a) **chore:** cleanup generator misses


### 2.2.1

* fix: properly bundle all top-level js endpoints - **[@dbushong](https://github.com/dbushong)** [#35](https://github.com/groupon/shared-store/pull/35)
  - [`89ded1c`](https://github.com/groupon/shared-store/commit/89ded1c4b0344cd57cbc23091a301b407adb5cd4) **fix:** properly bundle all top-level js endpoints


### 2.2.0

* feat: add fileAlternativesContent() handler - **[@dbushong](https://github.com/dbushong)** [#34](https://github.com/groupon/shared-store/pull/34)
  - [`0c8e56f`](https://github.com/groupon/shared-store/commit/0c8e56f16bcf30f908fe17ee9533564c8cbdbdd2) **feat:** add fileAlternativesContent() handler


### 2.1.4

* Gracefully handle missing dir - **[@jkrems](https://github.com/jkrems)** [#33](https://github.com/groupon/shared-store/pull/33)
  - [`571d011`](https://github.com/groupon/shared-store/commit/571d011cbcd00d0065d4034ed023d7301cccc090) **fix:** Gracefully handle missing dir


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
