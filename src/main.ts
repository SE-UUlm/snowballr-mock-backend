import * as grpc from "@grpc/grpc-js";
import { snowballRService } from "./service";
import { snowballRDefinition } from "./grpc-gen/main.grpc-server";
import { AUTH_INTERCEPTOR } from "./interceptors/auth-interceptor";
import { LOGGING_INTERCEPTOR } from "./interceptors/logging-interceptor";
import { addReflection } from "grpc-server-reflection";
import * as path from "path";
import proxy from "@grpc-web/proxy";
import { loadExampleData, USERS } from "./model";
import { UserRole, UserStatus } from "./grpc-gen/user";
import { DELAYING_INTERCEPTOR } from "./interceptors/delaying-interceptor";
import { LOG } from "./log";
import { ENABLE_DUMMY_ADMIN, EXAMPLE_DATA_FILE, PORT, WEB_PORT } from "./options";

const ADDRESS = "0.0.0.0";
const ENDPOINT = `${ADDRESS}:${PORT}`;

proxy({
    target: `http://127.0.0.1:${PORT}`,
    origin: "",
    headers: "",
}).listen(WEB_PORT);

const server = new grpc.Server({
    interceptors: [AUTH_INTERCEPTOR, LOGGING_INTERCEPTOR, DELAYING_INTERCEPTOR],
});
server.addService(snowballRDefinition, snowballRService);
addReflection(server, path.join(__dirname, "schema.ds"));
server.bindAsync(
    ENDPOINT,
    grpc.ServerCredentials.createInsecure(),
    (err: Error | null, port: number) => {
        if (err) {
            LOG.fatal(`Server error: ${err.message}`);
        } else {
            LOG.info(`Native server listening on: ${ADDRESS}:${port}`);
            LOG.info(`gRPC Web proxy listening on: ${ADDRESS}:${WEB_PORT}`);
        }
    },
);

/* parse environment variables */

// Check, whether the dummy admin user should be added or not
if (ENABLE_DUMMY_ADMIN) {
    LOG.warn("Security Risk: dummy admin user enabled!");
    USERS.set("admin@admin", {
        id: "admin@admin",
        email: "admin@admin",
        firstName: "admin",
        lastName: "admin",
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        password: "admin",
        accessToken: "admin",
        refreshToken: "admin",
    });
    LOG.info(USERS.get("admin@admin"), "The dummy admin user");
}

// Check, whether a filepath to a file containing example data for the mock backend is set
if (EXAMPLE_DATA_FILE) {
    loadExampleData(EXAMPLE_DATA_FILE);
}
