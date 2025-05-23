# SnowballR Mock Backend

The mock backend is a small self-contained implementation of the gRPC api
contract used for testing the frontend without having to spin up a full backend
including databases. This application neither implements real api queries for
scanning papers, nor does it persist any data.

> [!CAUTION]
> Security is an afterthought and this server should **never** be used in
> production. Passwords are stored in plaintext and nothing is encrypted.

## Get Started

The fastest way to get started is to clone the repository and run the mock
backend using docker compose. This will start the mock backend and a gRPC web
proxy. The mock backend will be available at `http://localhost:3001` and the gRPC
web proxy at `http://localhost:3000`.

```sh
git clone git@github.com:SE-UUlm/snowballr-mock-backend.git
cd snowballr-mock-backend
git submodule update --init
docker compose up
```

To start the mock backend with existing data and an admin user, you can use the `mock-sample` profile.

```sh
docker compose --profile mock-sample up
```

Alternatively, you can build and run the mock backend from source.

```sh
npm i
npm run compile:proto
npm run build
npm run start
```

To run the mock backend with existing data and an admin user, you can use the following command:

```sh
npm run dev
```

If connecting from a gRPC web client, the `GRPC_WEB_PORT` endpoint must be
targeted. If using a native client like `grpcui` or `grpcurl`, connecting to
`GRPC_PORT` is required.

### Initial data

If you're not going to use the mock backend for automated tests, but only to manually check the frontend functionality, it's useful to have some initial data.
You can start the mock backend with initial data for this purpose, whereas these initial data must be saved in a typescript file.
This file must be located in the [src/data/](src/data) directory. The data in this file is then imported and,
if it is correct, saved as initial data in a "database" with which the mock backend is started.
The file is considered to be correct, if it exports an object named `exampleData` conforming the `ExampleData` interface, e.g.

```typescript
export const exampleData: ExampleData = {
    users: users,
    ...
};
```

### Configuration

A boolean variable may be enabled by setting it to either `1`, `yes`, or `true`.

| Environment Variable | Default                 | Description                                                                                                                                                                                                                                                     |
| -------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GRPC_PORT`          | 3000                    | The port the native server should listen on                                                                                                                                                                                                                     |
| `GRPC_WEB_PORT`      | 3001                    | The port the gRPC web proxy should listen on                                                                                                                                                                                                                    |
| `GRPC_ALLOW_ORIGIN`  | `.*` (allow everything) | A [regex](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/RegExp) describing what origins should be allowed by [cors](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Access-Control-Allow-Origin). |
| `ENABLE_DUMMY_ADMIN` | false                   | Whether to enable a dummy admin user                                                                                                                                                                                                                            |
| `RESPONSE_DELAY`     | 50                      | The number of milliseconds the server's responses are delayed by.                                                                                                                                                                                               |
| `LOG_LEVEL`          | `debug`                 | The log level to use. One of `fatal`, `error`, `warn`, `info`, `debug`, `trace`, or `silent`.                                                                                                                                                                   |
| `EXAMPLE_DATA_FILE`  | ""                      | Relative path to a file inside [src/data/](src/data) containing example data for the mock backend (e.g. standardData.ts)                                                                                                                                        |
| `RANDOMNESS_SEED`    | \<random\>              | Seed used for every pseudo random value generation, (default seed is random)                                                                                                                                                                                    |

## Tooling

Both [grpcurl](https://github.com/fullstorydev/grpcurl) and
[grpcui](https://github.com/fullstorydev/grpcui) can be very helpful when
getting to know the api or debugging. Install the ones you like and use them
like this (replacing the address if needed):

```sh
grpcui -plaintext 127.0.0.1:3000
grpcurl -plaintext 127.0.0.1:3000 snowballr.SnowballR.IsAuthenticated
```

Authorization is handled using a token residing in the `Authorization` header.
In `grpcui`, this should be added using the header ui. For `grpcurl`, this can
be achieved like this:

```sh
grpcurl -plaintext 127.0.0.1:3000 snowballr.SnowballR.CreateProject -d '{"name": "Foo"}' -H Authorization:<access-token>
```
