import { Metadata } from "@grpc/grpc-js";
import { ServerUser, users } from "./model";

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
    for (const [_, user] of users) {
        if (user.accessToken == authorization && user.accessToken != "") {
            return user;
        }
    }

    return null;
}
