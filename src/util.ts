import { Metadata } from "@grpc/grpc-js";
import { ServerUser, USERS } from "./model";
import { User } from "./grpc-gen/user";
import { ServerMethodDefinition } from "@grpc/grpc-js/build/src/make-client";
import { LoginSecret } from "./grpc-gen/authentication";

/**
 * Select a random items from a list. The number of items to be selected
 * is randomly chosen from a value between the minimum and maximum number.
 * The default minimum or maximum number is 1, so if only the list is given,
 * only on random item is selected.
 *
 * If the number of items to be chosen is greater that the number of items in the list,
 * the entire list is returned
 *
 * @param list - The list the items are randomly selected of
 * @param minNumberOfItems - The minimum number of items to be chosen
 * @param maxNumberOfItems - The maximum number of items to be chosen
 */
export function getRandomItems<T>(list: T[], minNumberOfItems = 1, maxNumberOfItems = 1): T[] {
    const shuffledList = [...list].sort(() => Math.random() - 0.5);
    return shuffledList.slice(
        0,
        Math.floor(Math.random() * (maxNumberOfItems - minNumberOfItems)) + minNumberOfItems,
    );
}

export function isEmpty(string: string | null): boolean {
    if (string == null) return true;
    else return string.trim().length == 0;
}

function randomString(length: number): string {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const randomNum = () => Math.floor(Math.random() * alphabet.length);
    return Array.from({ length: length }, randomNum)
        .map((i) => alphabet.charAt(i))
        .join("");
}

const tokens: string[] = [];
export function randomToken(): string {
    let token = randomString(40);
    while (tokens.some((t) => t == token)) {
        token = randomString(40);
    }
    tokens.push(token);
    return token;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getAuthenticated(metadata: Metadata): ServerUser | null {
    /*const authorization = metadata.get("Authorization").join("");
    if (authorization.trim() == "") return null;
    return findFirst(USERS.values(), "accessToken", authorization);*/
    return USERS.get("alice.smith@example.com")!;
}

/**
 * Converts a user into a server user, so the user information are extended by the password and tokens
 * of the user.
 *
 * @param user - The user object to be extended
 * @param password - The password of the user
 * @param loginSecret - The login secret, so the authorization and refresh tokens of the user
 */
export function fromUser(user: User, password: string, loginSecret: LoginSecret): ServerUser {
    return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        password: password,
        accessToken: loginSecret.accessToken,
        refreshToken: loginSecret.refreshToken,
    };
}

export function toUser(serverUser: ServerUser): User {
    return {
        id: serverUser.id,
        email: serverUser.email,
        firstName: serverUser.firstName,
        lastName: serverUser.lastName,
        role: serverUser.role,
        status: serverUser.status,
    };
}

export function findFirst<T, K extends keyof T, V extends T[K]>(
    objects: Iterable<T>,
    key: K,
    value: V,
) {
    for (const object of objects) {
        if (object[key] == value) {
            return object;
        }
    }

    return null;
}

export function anythingUndefined<T extends object>(obj: T): boolean {
    return Object.values(obj).some((v) => {
        return v == undefined || (typeof v === "object" && anythingUndefined(v));
    });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isSnowballRService(methodDescriptor: ServerMethodDefinition<any, any>): boolean {
    return methodDescriptor.path.startsWith("/snowballr.SnowballR/");
}

export function getNextId<T extends Map<string, V>, V>(objs: T): string {
    let i = objs.size;
    while (objs.has(i.toString())) {
        i++;
    }
    return i.toString();
}
