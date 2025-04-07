import {
    ResponderBuilder,
    ServerInterceptingCall,
    ServerInterceptingCallInterface,
    ServerInterceptor,
} from "@grpc/grpc-js";
import { ServerMethodDefinition } from "@grpc/grpc-js/build/src/make-client";
import { LOG } from "../log";

const DEFAULT_DELAY = 50;
const DELAY = parseInt(process.env.RESPONSE_DELAY ?? DEFAULT_DELAY.toString());
const ACTIVE_DELAY = isNaN(DELAY) || DELAY < 0 ? DEFAULT_DELAY : DELAY;

if (ACTIVE_DELAY !== DELAY) {
    LOG.error(
        {},
        'The provided response delay "%s" was not a valid non-negative integer. Using %dms instead.',
        process.env.RESPONSE_DELAY,
        ACTIVE_DELAY,
    );
}

if (ACTIVE_DELAY > 0) {
    LOG.info("The server is responding %dms delayed.", ACTIVE_DELAY);
}

// Adds a delay to every response in accordance to an environment variable.
// Helps testing loading-skeletons in the frontend.
export const DELAYING_INTERCEPTOR: ServerInterceptor = function <RequestT, ResponseT>(
    _: ServerMethodDefinition<RequestT, ResponseT>,
    call: ServerInterceptingCallInterface,
): ServerInterceptingCall {
    const responder = new ResponderBuilder()
        .withSendMessage((message, next) => {
            setTimeout(() => next(message), ACTIVE_DELAY);
        })
        .build();
    return new ServerInterceptingCall(call, responder);
};
