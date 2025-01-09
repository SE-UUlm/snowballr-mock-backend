import { ResponderBuilder, ServerInterceptingCall, ServerInterceptingCallInterface, ServerInterceptor, ServerListenerBuilder } from "@grpc/grpc-js"
import { ServerMethodDefinition } from "@grpc/grpc-js/build/src/make-client"
import { status } from "@grpc/grpc-js";
import { getAuthenticated } from "./util";

export const authInterceptor: ServerInterceptor = function (methodDescriptor: ServerMethodDefinition<any, any>, call: ServerInterceptingCallInterface): ServerInterceptingCall {
    const uncheckedCalls = [
        "Login",
        "Register",
        "IsAuthenticated",
        "RenewSession",
        "RequestPasswordReset",
    ]
    var listener = (new ServerListenerBuilder())
        .withOnReceiveMetadata((metadata, next) => {
            if (uncheckedCalls.some(n => methodDescriptor.path.endsWith(n))) {
                next(metadata)
            } else if (getAuthenticated(metadata) != null) {
                next(metadata)
            } else {
                call.sendStatus({
                    code: status.UNAUTHENTICATED,
                    details: "The provided access token is invalid"
                })
            }
        })
        .build()
    var responder = (new ResponderBuilder())
        .withStart(next => next(listener))
        .build()
    return new ServerInterceptingCall(call, responder)
}
