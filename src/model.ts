import { LoginSecret } from "./grpc-gen/authentication";
import { Criterion } from "./grpc-gen/criterion";
import { Paper } from "./grpc-gen/paper";
import { Project, Project_Member, Project_Paper } from "./grpc-gen/project";
import { Review } from "./grpc-gen/review";
import { User, UserRole, UserStatus } from "./grpc-gen/user";
import { UserSettings } from "./grpc-gen/user_settings";
import { LOG } from "./log";
import * as fs from "fs";

export type ServerUser = User & { password: string } & LoginSecret;

export const AVAILABLE_FETCHERS = ["fake", "mock"];
export const USERS: Map<string, ServerUser> = new Map();
export const PROJECTS: Map<string, Project> = new Map();
export const PROJECT_PROJECT_PAPERS: Map<string, string[]> = new Map();
export const PROJECT_PAPERS: Map<string, Project_Paper> = new Map();
export const PAPERS: Map<string, Paper> = new Map();
export const USER_SETTINGS: Map<string, UserSettings> = new Map();
export const READING_LISTS: Map<string, Paper[]> = new Map();
export const MEMBERS: Map<string, Project_Member[]> = new Map();
export const PROGRESS: Map<string, number> = new Map();
export const PROJECT_CRITERIA: Map<string, string[]> = new Map();
export const CRITERIA: Map<string, Criterion> = new Map();
export const REVIEWS: Map<string, Review> = new Map();
export const PAPER_REVIEWS: Map<string, string[]> = new Map();
export const PAPER_PDFS: Map<string, Uint8Array> = new Map();

function loadExampleData(filepath: string) {
    try {
        const rawData = fs.readFileSync(filepath, "utf-8");
        const jsonData = JSON.parse(rawData);
        LOG.info(
            `Successfully loaded example data from file "${filepath}". Server is starting with preloaded data...`,
        );
        console.log(jsonData);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        LOG.error(
            `Failed to load example data from file "${filepath}". Falling back to default settings, so starting server with no initial data...`,
        );
    }
}

/**
 * Checks whether the given string indicates that an option is enabled.
 * An option is considered as enabled, if it is set to either:
 * - 1
 * - yes
 * - Yes
 * - true
 * - True
 *
 * @param option
 */
function isOptionEnabled(option?: string): boolean {
    option = option?.toLowerCase() ?? "";
    switch (option) {
        case "1":
        case "yes":
        case "Yes":
        case "true":
        case "True":
            return true;
        default:
            return false;
    }
}

/*
Parse the environment variables.
 */

// Check, whether the dummy admin user should be added or not
if (isOptionEnabled(process.env.ENABLE_DUMMY_ADMIN)) {
    LOG.warn("Security Risk: dummy admin user enabled!");
    USERS.set("admin@admin", {
        id: "admin@admin",
        email: "admin@admin",
        firstName: "admin",
        lastName: "admin",
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        password: "admin",
        accessToken: "admin",
        refreshToken: "admin",
    });
}

// Check, whether a filepath to a file containing example data for the mock backend is set
if (process.env.EXAMPLE_DATA_FILE_PATH !== undefined && process.env.EXAMPLE_DATA_FILE_PATH !== "") {
    loadExampleData(process.env.EXAMPLE_DATA_FILE_PATH);
}
