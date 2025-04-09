import { assert } from "@protobuf-ts/runtime";
import { LOG } from "./log";

/**
 * Parses an environment variable using a set of functions.
 * A value is parsed and verified using the according functions.
 * Every output of this function is guaranteed to pass the `verify` condition.
 *
 * If the input is `undefined`, the fallback value is returned and `onDefault`
 * is called.
 *
 * If the parsing function throws or returns `undefined`, the fallback value is
 * returned and `onParseFailed` is called.
 *
 * If the parsing was successful but the `verify`-condition was violated, the
 * fallback value is returned and `onVerifyFailed` is called.
 *
 * If the value was parsed successfully and passed the `verify`-check, it is
 * returned and `onSuccess` is called.
 */
function parseOption<T>(
    str: string | undefined,
    fallback: T,
    parse: (str: string) => T | undefined,
    verify: (val: T) => boolean = () => true,
    onSuccess: (usedVal: T, usedStr: string) => void = () => {},
    onParseFailed: (usedVal: T, parsedStr: string) => void = () => {},
    onVerifyFailed: (usedVal: T, parsedVal: T, parsedStr: string) => void = () => {},
    onDefault: (fallback: T) => void = () => {},
): T {
    assert(verify(fallback));

    if (str === undefined) {
        onDefault(fallback);
        return fallback;
    }

    let parsed;
    try {
        parsed = parse(str);
    } catch {
        parsed = undefined;
    }

    if (parsed === undefined) {
        onParseFailed(fallback, str);
        return fallback;
    }

    if (verify(parsed)) {
        onSuccess(parsed, str);
        return parsed;
    } else {
        onVerifyFailed(fallback, parsed, str);
        return fallback;
    }
}

/**
 * Parses a boolean option from an optional string.
 * The following values are interpreted as:
 *  - `true`:  "yes", "1", "true"
 *  - `false`: "no", "0", "false"
 *
 * Strings are compared case-insensitive, thus for example "YeS" is also
 * considered to be `true`.
 */
function parseBoolOption(str: string | undefined, fallback: boolean): boolean {
    function parseOptionBool(str: string): boolean | undefined {
        str = str.toLowerCase();
        if (["1", "yes", "true"].includes(str)) {
            return true;
        } else if (["0", "no", "false"].includes(str)) {
            return false;
        } else {
            return undefined;
        }
    }

    return parseOption(str, fallback, parseOptionBool);
}

export const RESPONSE_DELAY_MS = parseOption(
    process.env.RESPONSE_DELAY,
    50,
    parseInt,
    (v) => !isNaN(v) && v >= 0,
    (v) => LOG.info("The server responds with a delay of %dms.", v),
    () => {},
    (u, _, s) =>
        LOG.error(
            'The provided response delay of "%s" was not a valid non-negative integer. Using a delay of %dms instead.',
            s,
            u,
        ),
    (v) => LOG.info("The server responds with a delay of %dms.", v),
);

function verifyPort(str: string): boolean {
    const port = parseInt(str);
    return !isNaN(port) && port > 0 && port < 1 << 16;
}

export const PORT = parseOption(process.env.GRPC_PORT, "3000", (s) => s, verifyPort);

export const WEB_PORT = parseOption(process.env.GRPC_WEB_PORT, "3001", (s) => s, verifyPort);

export const ENABLE_DUMMY_ADMIN = parseBoolOption(process.env.ENABLE_DUMMY_ADMIN, false);

export const EXAMPLE_DATA_FILE = parseOption(process.env.EXAMPLE_DATA_FILE, undefined, (s) => s);
