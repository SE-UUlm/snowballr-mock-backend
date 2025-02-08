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

### For gRPC Web (Frontend)

To be accessible from gRPC Web clients a proxy is needed in front of the native
backend. The provided docker compose file provides a basic setup allowing
access on port `8080`:

```sh
docker compose up
```

### Native Server

```sh
npm run start
```

### Configuration

| Environment Variable | Description                             |
| -------------------- | --------------------------------------- |
| `GRPC_PORT`          | The port the server should listen on    |
| `GRPC_ADDRESS`       | The address the server should listen on |

## Tooling

Both [grpcurl](https://github.com/fullstorydev/grpcurl) and
[grpcui](https://github.com/fullstorydev/grpcui) can be very helpful when
getting to know the api or debugging. Install the ones you like and use them
like this (replacing the address if needed):

```sh
grpcui -plaintext 127.0.0.1:8080
grpcurl -plaintext 127.0.0.1:8080 snowballr.SnowballR.IsAuthenticated
```

