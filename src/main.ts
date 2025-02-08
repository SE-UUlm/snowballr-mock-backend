import * as grpc from "@grpc/grpc-js";
import { snowballRService } from "./service";
import { snowballRDefinition } from "./grpc-gen/main.grpc-server";
import { AUTH_INTERCEPTOR } from "./auth-interceptor";
import { LOGGING_INTERCEPTOR } from "./logging-interceptor";
import { addReflection } from "grpc-server-reflection";
import * as path from "path";
import proxy from "@grpc-web/proxy";
import { LOG } from "./log";

const port = process.env.GRPC_PORT ?? "3000";
const webPort = process.env.GRPC_WEB_PORT ?? "3001";

const address = "0.0.0.0";
const endpoint = `${address}:${port}`;

proxy({
    target: `http://127.0.0.1:${port}`,
} as any).listen(webPort);

const server = new grpc.Server({
    interceptors: [AUTH_INTERCEPTOR, LOGGING_INTERCEPTOR],
});
server.addService(snowballRDefinition, snowballRService);
addReflection(server, path.join(__dirname, "schema.ds"));
server.bindAsync(
    endpoint,
    grpc.ServerCredentials.createInsecure(),
    (err: Error | null, port: number) => {
        if (err) {
            LOG.fatal(`Server error: ${err.message}`)
        } else {
            LOG.info(`Native server listening on: ${address}:${port}`);
            LOG.info(`gRPC Web proxy listening on: ${address}:${webPort}`);
        }
    },
);
