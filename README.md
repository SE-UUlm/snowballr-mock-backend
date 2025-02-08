# SnowballR Mock Backend

The mock backend is a small self-contained implementation of the gRPC api
contract used for testing the frontend without having to spin up a full backend
including databases. This application neither implements real api queries for
scanning papers, nor does it persist any data.

> [!CAUTION]
> Security is an afterthough and this server should **never** be used in
> production. Passwords are stored in plaintext and nothing is encrypted.

## Building

```sh
npm i
npm run compile:proto
npm run build
```

## Usage

```sh
npm run start
```

If connecting from a gRPC Web client, the `GRPC_WEB_PORT` endpoint must be
targeted. If using a native client like `grpcui` or `grpcurl`, conecting to
`GRPC_PORT` is required.

### Configuration

| Environment Variable | Default | Description                                  |
| -------------------- | ------- | -------------------------------------------- |
| `GRPC_PORT`          | 3000    | The port the native server should listen on  |
| `GRPC_WEB_PORT`      | 3001    | The port the gRPC Web proxy should listen on |

## Tooling

Both [grpcurl](https://github.com/fullstorydev/grpcurl) and
[grpcui](https://github.com/fullstorydev/grpcui) can be very helpful when
getting to know the api or debugging. Install the ones you like and use them
like this (replacing the address if needed):

```sh
grpcui -plaintext 127.0.0.1:3000
grpcurl -plaintext 127.0.0.1:3000 snowballr.SnowballR.IsAuthenticated
```
