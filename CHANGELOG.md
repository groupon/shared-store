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
