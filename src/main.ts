import * as grpc from "@grpc/grpc-js"
import { snowballRService } from "./service"
import { snowballRDefinition } from "./grpc-gen/main.grpc-server"
import { authInterceptor } from "./auth-interceptor"

const server = new grpc.Server({
    interceptors: [ authInterceptor ],
})
server.addService(snowballRDefinition, snowballRService)
server.bindAsync(
    '0.0.0.0:8081',
    grpc.ServerCredentials.createInsecure(),
    (err: Error | null, port: number) => {
        if (err) {
            console.error(`Server error: ${err.message}`)
        } else {
            console.log(`Server bound on port: ${port}`)
        }
    }
)
