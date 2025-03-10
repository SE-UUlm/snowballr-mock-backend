import { Metadata } from "@grpc/grpc-js";
import { PAPER_REVIEWS, REVIEWS, ServerProjectPaper, ServerUser, USERS } from "./model";
import { User } from "./grpc-gen/user";
import { ServerMethodDefinition } from "@grpc/grpc-js/build/src/make-client";
import { LoginSecret } from "./grpc-gen/authentication";
import { Project_Paper } from "./grpc-gen/project";

/**
 * Checks whether a string is empty
 *
 * @param string the string to check against the empty string
 * @return true, if the string is empty or null, otherwise false
 */
export function isEmpty(string: string | null): boolean {
    if (string == null) return true;
    else return string.trim().length == 0;
}

/**
 * Select random items from a list. The number of items to be selected
 * is randomly chosen from a value between the minimum and maximum number.
 * The default minimum and maximum number is 1, so if only the list is given,
 * only one random item is selected.
 *
 * If the number of items to be chosen is greater that the number of items in the list,
 * the entire list is returned
 *
 * @param list the list from which items are randomly selected of
 * @param minNumberOfItems the minimum number of items to be chosen
 * @param maxNumberOfItems the maximum number of items to be chosen
 * @return the list containing the randomly selected items
 */
export function getRandomItems<T>(
    list: Iterable<T>,
    minNumberOfItems = 1,
    maxNumberOfItems = 1,
): T[] {
    const shuffledList = [...list].sort(() => Math.random() - 0.5);
    return shuffledList.slice(
        0,
        Math.floor(Math.random() * (maxNumberOfItems - minNumberOfItems)) + minNumberOfItems,
    );
}

/**
 * Generates a random alphanumeric string
 *
 * @param length the length of the random string
 */
function randomString(length: number): string {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const randomNum = () => Math.floor(Math.random() * alphabet.length);
    return Array.from({ length: length }, randomNum)
        .map((i) => alphabet.charAt(i))
        .join("");
}

const tokens: string[] = [];
/**
 * Generates a random token, which is a random alphanumeric string of length 40
 */
export function randomToken(): string {
    let token = randomString(40);
    while (tokens.some((t) => t == token)) {
        token = randomString(40);
    }
    tokens.push(token);
    return token;
}

/**
 * Search for the (server) user with the provided "Authorization" token.
 *
 * @privateRemarks
 *
 * At the moment the frontend has no implementation for adding the "Authorization" header.
 * As the different calls in mock backend are already protected with authentication,
 * using this mock backend in the frontend is useless, as you always would get an "Unauthenticated"
 * error. Hence, this method currently constantly return a user that is "logged in".
 * This must be changed as soon as the authentication is completed in the frontend.
 *
 * @param metadata the request metadata (= header) containing the "Authorization" header
 * @return the server user with the given access token or null, if no server user was found
 */
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
 * @param user the user object to be extended
 * @param password the password of the user
 * @param loginSecret the login secret, so the authorization and refresh tokens of the user
 * @return the server user created from the user, password and login secret
 */
export function toServerUser(user: User, password: string, loginSecret: LoginSecret): ServerUser {
    return {
        ...user,
        ...loginSecret,
        password: password,
    };
}

/**
 * Converts a server user (= user with password and login credentials) to a normal user.
 */
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

export function isSnowballRService<TRequest, TResponse>(
    methodDescriptor: ServerMethodDefinition<TRequest, TResponse>,
): boolean {
    return methodDescriptor.path.startsWith("/snowballr.SnowballR/");
}

/**
 * Finds the first object that has a specific key-value pair.
 *
 * @param objects an iterable collection of objects.
 * @param key the key to check in each object.
 * @param value the value to match against.
 * @return the first object that matches the key-value condition, null if nothing was found
 */
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

/**
 * Generates the next id.
 *
 * @param objs the map of already exist elements with ids
 * @return the next available id
 */
export function getNextId<T extends Map<string, V>, V>(objs: T): string {
    let i = objs.size;
    while (objs.has(i.toString())) {
        i++;
    }
    return i.toString();
}

/**
 * Adds review details to a project paper.
 *
 * @param paper the project paper to extend with review information
 * @return the new project paper with an added 'reviews' array populated from the associated reviews
 */
export function addProjectPaperReviews(paper: ServerProjectPaper): Project_Paper {
    return {
        ...paper,
        reviews: PAPER_REVIEWS.get(paper.id)!.map((reviewId) => REVIEWS.get(reviewId)!),
    };
}

/**
 * Checks if any property in an object (including nested objects) is undefined.
 *
 * @param obj the object to check
 * @returns true if any property (or sub-property) is undefined, otherwise false
 */
export function anythingUndefined<T extends object>(obj: T): boolean {
    return Object.values(obj).some((v) => {
        return v == undefined || (typeof v === "object" && anythingUndefined(v));
    });
}

/**
 * Checks whether the given string indicates that an option is enabled.
 * An option is considered as enabled, if it is set to either:
 * - 1
 * - (y/Y)es
 * - (t/T)rue
 *
 * @param option the input to check
 * @return true, if the given option is set to value listed above, otherwise false
 */
export function isOptionEnabled(option?: string): boolean {
    option = option?.toLowerCase() ?? "";
    return ["1", "yes", "true"].includes(option);
}

/**
 * Asserts that a given conditions holds and throws an error, if not
 *
 * @param condition the condition that must hold
 * @param msg the error message, if the condition is not true
 */
export function assert(condition: unknown, msg?: string): asserts condition {
    if (condition === false) throw new Error(msg);
}
