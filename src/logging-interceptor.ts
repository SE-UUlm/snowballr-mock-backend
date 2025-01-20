<<<<<<< Updated upstream
import { ResponderBuilder, ServerInterceptingCall, ServerInterceptingCallInterface, ServerInterceptor, ServerListenerBuilder } from "@grpc/grpc-js";
=======
import {
    ResponderBuilder,
    ServerInterceptingCall,
    ServerInterceptingCallInterface,
    ServerInterceptor,
    ServerListenerBuilder,
} from "@grpc/grpc-js";
import { Status } from "@grpc/grpc-js/build/src/constants";
>>>>>>> Stashed changes
import { ServerMethodDefinition } from "@grpc/grpc-js/build/src/make-client";

function log(tag: string, message: any) {
    const timestamp = new Date().toISOString();
    message = JSON.parse(JSON.stringify(message))
    console.log(`[${timestamp}] ${tag}:`, message)
}

export const loggingInterceptor: ServerInterceptor = function (_: ServerMethodDefinition<any, any>, call: ServerInterceptingCallInterface): ServerInterceptingCall {
    var listener = (new ServerListenerBuilder())
        .withOnReceiveMessage((message, next) => {
            log("Received", message)
            next(message)
        })
        .build()
    var responder = (new ResponderBuilder())
        .withStart(next => next(listener))
        .withSendMessage((message, next) => {
            log("Sent", message)
            next(message)
        })
<<<<<<< Updated upstream
        .build()
    return new ServerInterceptingCall(call, responder)
}
=======
        .withSendStatus((status, next) => {
            if (status.code != Status.OK) {
                log("Sent Error", {
                    ...status,
                    code: `${Status[status.code]} (${status.code})`,
                });
            }
            next(status);
        })
        .build();
    return new ServerInterceptingCall(call, responder);
};
>>>>>>> Stashed changes
