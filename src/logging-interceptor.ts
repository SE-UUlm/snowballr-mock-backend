import {
    ResponderBuilder,
    ServerInterceptingCall,
    ServerInterceptingCallInterface,
    ServerInterceptor,
    ServerListenerBuilder,
} from "@grpc/grpc-js";
import { Status } from "@grpc/grpc-js/build/src/constants";
import { ServerMethodDefinition } from "@grpc/grpc-js/build/src/make-client";
import { isSnowballRService } from "./util";

function log(tag: string, message: any) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${tag}:`, {
        ...message,
    });
}

export const loggingInterceptor: ServerInterceptor = function (
    methodDescriptor: ServerMethodDefinition<any, any>,
    call: ServerInterceptingCallInterface,
): ServerInterceptingCall {
    const shouldLog = isSnowballRService(methodDescriptor);
    const listener = new ServerListenerBuilder()
        .withOnReceiveMessage((message, next) => {
            if (shouldLog) log("Received", message);
            next(message);
        })
        .build();
    const responder = new ResponderBuilder()
        .withStart((next) => next(listener))
        .withSendMessage((message, next) => {
            if (shouldLog) log("Sent", message);
            next(message);
        })
        .withSendStatus((status, next) => {
            if (shouldLog && status.code != Status.OK) {
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
