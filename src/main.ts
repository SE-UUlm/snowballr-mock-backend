import * as grpc from "@grpc/grpc-js";
import { snowballRService } from "./service";
import { snowballRDefinition } from "./grpc-gen/main.grpc-server";
import { authInterceptor } from "./auth-interceptor";
import { loggingInterceptor } from "./logging-interceptor";
import { addReflection } from "grpc-server-reflection";
import * as path from "path";

const port = process.env.GRPC_PORT ?? "8080";
const address = process.env.GRPC_ADDRESS ?? "0.0.0.0";
const endpoint = `${address}:${port}`;

const server = new grpc.Server({
    interceptors: [authInterceptor, loggingInterceptor],
});
server.addService(snowballRDefinition, snowballRService);
addReflection(server, path.join(__dirname, "schema.ds"));
server.bindAsync(
    endpoint,
    grpc.ServerCredentials.createInsecure(),
    (err: Error | null, port: number) => {
        if (err) {
            console.error(`Server error: ${err.message}`);
        } else {
            console.log(`Server bound on: ${address}:${port}`);
        }
    },
);
