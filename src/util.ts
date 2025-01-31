import { Metadata } from "@grpc/grpc-js";
import { ServerUser, users } from "./model";
import { User } from "./grpc-gen/user";
import { ServerMethodDefinition } from "@grpc/grpc-js/build/src/make-client";

export function isEmpty(string: string | null): boolean {
    if (string == null) return true;
    else return string.trim().length == 0;
}

export function randomString(length: number): string {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const randomNum = () => Math.floor(Math.random() * alphabet.length);
    return Array.from({ length: length }, randomNum)
        .map((i) => alphabet.charAt(i))
        .join("");
}

export function randomToken(): string {
    return randomString(40);
}

export function getAuthenticated(metadata: Metadata): ServerUser | null {
    const authorization = metadata.get("Authorization").join("");
    if (authorization.trim() == "") return null;
    return findFirst(users.values(), "accessToken", authorization);
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

export function isSnowballRService(methodDescriptor: ServerMethodDefinition<any, any>): boolean {
    return methodDescriptor.path.startsWith("/snowballr.SnowballR/");
}
