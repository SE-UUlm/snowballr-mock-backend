import {
    ResponderBuilder,
    ServerInterceptingCall,
    ServerInterceptingCallInterface,
    ServerInterceptor,
    ServerListenerBuilder,
} from "@grpc/grpc-js";
import { Status } from "@grpc/grpc-js/build/src/constants";
import { ServerMethodDefinition } from "@grpc/grpc-js/build/src/make-client";
import { isSnowballRService } from "../util";
import { LOG } from "../main";

/* eslint-disable  @typescript-eslint/no-explicit-any */
function stripPrefix(value: string, prefix: string) {
    return value.startsWith(prefix) ? value.substring(prefix.length) : value;
}

// Logs every gRPC call and its contents to the console with debug level.
export const LOGGING_INTERCEPTOR: ServerInterceptor = function (
    methodDescriptor: ServerMethodDefinition<any, any>,
    call: ServerInterceptingCallInterface,
): ServerInterceptingCall {
    const methodName = stripPrefix(methodDescriptor.path, "/snowballr.SnowballR/");

    const shouldLog = isSnowballRService(methodDescriptor);
    const listener = new ServerListenerBuilder()
        .withOnReceiveMessage((message, next) => {
            if (shouldLog) LOG.debug(message, `Received "${methodName}" call`);
            next(message);
        })
        .build();
    const responder = new ResponderBuilder()
        .withStart((next) => next(listener))
        .withSendMessage((message, next) => {
            if (shouldLog) LOG.debug(message, `Replied to "${methodName}"`);
            next(message);
        })
        .withSendStatus((status, next) => {
            if (shouldLog && status.code != Status.OK) {
                LOG.error(
                    {
                        ...status,
                        code: `${Status[status.code]} (${status.code})`,
                    },
                    `Replied to "${methodName}" with error`,
                );
            }
            next(status);
        })
        .build();
    return new ServerInterceptingCall(call, responder);
};
