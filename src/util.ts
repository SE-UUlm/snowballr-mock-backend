import { Metadata } from "@grpc/grpc-js";
import {
    PAPER_REVIEWS,
    PROJECT_PAPERS,
    PROJECT_PROJECT_PAPERS,
    REVIEWS,
    ServerProjectPaper,
    ServerUser,
    TokenPair,
    USERS,
} from "./model";
import { User } from "./grpc-gen/user";
import { ServerMethodDefinition } from "@grpc/grpc-js/build/src/make-client";
import { PaperDecision, Project_Paper, ReviewDecisionMatrix_Pattern } from "./grpc-gen/project";
import { ReviewDecision } from "./grpc-gen/review";
import * as cookie from "cookie";
import { Id } from "./grpc-gen/base";

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
 * @param metadata the request metadata (= header) containing the cookies
 * @return the server user with the given access token or null, if no server user was found
 */
export function getAuthenticated(metadata: Metadata): ServerUser | null {
    const tokenPair = getTokenPair(metadata);
    if (tokenPair === undefined) return null;
    return findFirst(USERS.values(), "accessToken", tokenPair.accessToken);
}

/**
 * Extract access- and refresh-token from the cookies inside of the headers of
 * a gRPC call.
 *
 * @param metadata the request metadata (= header) containing the cookies
 * @return the token pair or undefined if no or invalid tokens were provided
 */
export function getTokenPair(metadata: Metadata): TokenPair | undefined {
    let accessToken = undefined;
    let refreshToken = undefined;

    for (const header of metadata.get("cookie").reverse()) {
        const cookies = cookie.parse(header.toString());
        accessToken ??= cookies["accessToken"];
        refreshToken ??= cookies["refreshToken"];
    }

    accessToken = accessToken?.trim();
    refreshToken = refreshToken?.trim();

    if (
        accessToken === undefined ||
        refreshToken === undefined ||
        accessToken === "" ||
        refreshToken === ""
    )
        return undefined;
    else return { accessToken, refreshToken };
}

/**
 * Converts a user into a server user, so the user information are extended by the password and tokens
 * of the user.
 *
 * @param user the user object to be extended
 * @param password the password of the user
 * @param tokenPair the login tokens, so the authorization and refresh tokens of the user
 * @return the server user created from the user, password and login secret
 */
export function toServerUser(user: User, password: string, tokenPair: TokenPair): ServerUser {
    return {
        ...user,
        ...tokenPair,
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
 * Construct a single pattern for the ReviewDecisionMatrix. A pattern applies to
 * a given paper if and only if the exact number of reviews for each category
 * "accepted/declined/maybe" is equivalent with the provided one. If a pattern
 * applies to a paper its decision is directed by the one stored in the pattern.
 *
 * @param countAccepted the required count of accepting reviews for this pattern
 * to apply.
 * @param countDeclined the required count of declining reviews for this pattern
 * to apply.
 * @param countMaybe the required count of maybe reviews for this pattern
 * to apply.
 * @param decision the decision for the paper if this pattern applies.
 * @returns ReviewDecisionMatrix_Pattern
 */
export function makeReviewDecisionMatrixPattern(
    countAccepted: number,
    countDeclined: number,
    countMaybe: number,
    decision: PaperDecision,
): ReviewDecisionMatrix_Pattern {
    return {
        entries: [
            {
                reviewDecision: ReviewDecision.ACCEPTED,
                count: BigInt(countAccepted),
            },
            {
                reviewDecision: ReviewDecision.DECLINED,
                count: BigInt(countDeclined),
            },
            {
                reviewDecision: ReviewDecision.MAYBE,
                count: BigInt(countMaybe),
            },
        ],
        decision,
    };
}

/**
 * Create gRPC headers from a set of authentication tokens to set these tokens
 * as cookies in the client. Other calls will check for their existence when
 * a requests comes in.
 *
 * Send these headers to the client like this:
 * ```
 * call.sendMetadata(makeResponseAuthMetadata(tokenPair));
 * ```
 * Using the response trailer WILL NOT WORK.
 */
export function makeResponseAuthMetadata(tokenPair: TokenPair): Metadata {
    const meta = new Metadata();
    // set-cookie should probably also have 'secure', 'max-age' or 'expires'
    // properties. For testing purposes 'secure' may be inconvenient.
    meta.add("set-cookie", `accessToken=${tokenPair.accessToken}; HttpOnly`);
    meta.add("set-cookie", `refreshToken=${tokenPair.refreshToken}; HttpOnly`);
    return meta;
}

interface PaperInProjectResult {
    projectId: string;
    projectPaper?: Project_Paper;
    projectPapers: Project_Paper[];
}

/**
 * Searches for the project paper with the given id, the according project and its project papers.
 *
 * @param paperId the id of the paper that should be found.
 * @returns PaperInProjectResult
 */
export function getProjectPaperData(paperId: Id): PaperInProjectResult {
    const projectId = paperId.id.split("-")[0];
    const projectPapers = PROJECT_PROJECT_PAPERS.get(projectId)!
        .map((ppp) => PROJECT_PAPERS.get(ppp)!)
        .map(addProjectPaperReviews);
    const projectPaper = projectPapers.find((pp) => pp.id === paperId.id);
    return { projectId, projectPaper, projectPapers };
}
