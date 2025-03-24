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
import { logger } from "./logger";
import { ENABLE_DUMMY_ADMIN, EXAMPLE_DATA_FILE, PORT, RANDOMNESS_SEED, WEB_PORT } from "./options";

const ADDRESS = "0.0.0.0";
const ENDPOINT = `${ADDRESS}:${PORT}`;

proxy({
    target: `http://127.0.0.1:${PORT}`,
    // Hack applied due to limiting types of @grpc-web/proxy. See cors library
    // for more options.
    origin: /.*/ as any as string,
    headers: [],
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
            logger.fatal(`Server error: ${err.message}`);
        } else {
            logger.info(`Native server listening on: ${ADDRESS}:${port}`);
            logger.info(`gRPC Web proxy listening on: ${ADDRESS}:${WEB_PORT}`);
        }
    },
);

/* parse environment variables */

// Check, whether the dummy admin user should be added or not
if (ENABLE_DUMMY_ADMIN) {
    logger.warn("Security Risk: dummy admin user enabled!");
    USERS.set("admin@example.com", {
        id: "admin@example.com",
        email: "admin@example.com",
        firstName: "admin",
        lastName: "admin",
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        password: "admin",
        accessToken: "admin",
        refreshToken: "admin",
    });
    logger.info(USERS.get("admin@example.com"), "The dummy admin user");
}

// Check, whether a filepath to a file containing example data for the mock backend is set
if (EXAMPLE_DATA_FILE) {
    loadExampleData(EXAMPLE_DATA_FILE);
}

logger.info(`Using randomness seed ${RANDOMNESS_SEED}`);
