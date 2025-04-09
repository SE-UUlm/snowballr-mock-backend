import {
    ResponderBuilder,
    ServerInterceptingCall,
    ServerInterceptingCallInterface,
    ServerInterceptor,
} from "@grpc/grpc-js";
import { ServerMethodDefinition } from "@grpc/grpc-js/build/src/make-client";
import { RESPONSE_DELAY_MS } from "../options";

// Adds a delay to every response in accordance to an environment variable.
// Helps testing loading-skeletons in the frontend.
export const DELAYING_INTERCEPTOR: ServerInterceptor = function <RequestT, ResponseT>(
    _: ServerMethodDefinition<RequestT, ResponseT>,
    call: ServerInterceptingCallInterface,
): ServerInterceptingCall {
    const responder = new ResponderBuilder()
        .withSendMessage((message, next) => {
            setTimeout(() => next(message), RESPONSE_DELAY_MS);
        })
        .build();
    return new ServerInterceptingCall(call, responder);
};
