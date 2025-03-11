import {
    ResponderBuilder,
    ServerInterceptingCall,
    ServerInterceptingCallInterface,
    ServerInterceptor,
    ServerListenerBuilder,
} from "@grpc/grpc-js";
import { ServerMethodDefinition } from "@grpc/grpc-js/build/src/make-client";
import { status } from "@grpc/grpc-js";
import { getAuthenticated, isSnowballRService } from "../util";

/* eslint-disable  @typescript-eslint/no-explicit-any */

// Checks every call to the SnowballR api requiring the user to be authenticated
// against the currently authenticated users. If not authenticated, the call is
// intercepted and replied with an 'UNAUTHENTICATED' error. If correct
// credentials have been provided, the call is propagated to the original
// handler. The 'Authorization' header of the call is checked for an access
// token.
export const AUTH_INTERCEPTOR: ServerInterceptor = function (
    methodDescriptor: ServerMethodDefinition<any, any>,
    call: ServerInterceptingCallInterface,
): ServerInterceptingCall {
    const uncheckedCalls = [
        "Login",
        "Register",
        "IsAuthenticated",
        "RenewSession",
        "RequestPasswordReset",
    ];

    const shouldIgnore =
        !isSnowballRService(methodDescriptor) ||
        uncheckedCalls.some((c) => methodDescriptor.path.endsWith(c));

    const listener = new ServerListenerBuilder()
        .withOnReceiveMetadata((metadata, next) => {
            if (shouldIgnore) {
                next(metadata);
            } else if (getAuthenticated(metadata) != null) {
                next(metadata);
            } else {
                call.sendStatus({
                    code: status.UNAUTHENTICATED,
                    details: "The provided access token is invalid",
                });
            }
        })
        .build();
    const responder = new ResponderBuilder().withStart((next) => next(listener)).build();
    return new ServerInterceptingCall(call, responder);
};
