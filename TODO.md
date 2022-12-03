# what do I need to do for the current release?

related: https://github.com/axios/axios/pull/5162

do I need to rewrite my import?
`import settle from 'axios/lib/core/settle';`
to
`import axios from 'axios'; const settle = axios.core.settle;`

## must

ensure newest Chrome + release candidate of axios-response-mock works with the following axios versions
(for each: test success case (status 200) and test failure case (status 400)):

- axios 1.2.0
- axios 1.0.0
- axios 0.27.2
- axios 0.26.1

## easy but optional

- increase to version 0.1.0
- add MIT license text file

## nice-to-have

- remove automatic association of mock instance with default axios instance

- ensure IE11 + release candidate of axios-response-mock works with the following axios versions:

  - axios 0.27.2
  - axios 0.26.1

- add support for axios versions below 0.13.0
- add more API documentation
- add comparison between axios-mock-adapter and axios-response-mock, showing differences, explaining why people should use the latter
