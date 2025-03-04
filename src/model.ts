import { LoginSecret } from "./grpc-gen/authentication";
import { Criterion } from "./grpc-gen/criterion";
import { Paper } from "./grpc-gen/paper";
import { Project, Project_Member, Project_Paper } from "./grpc-gen/project";
import { Review } from "./grpc-gen/review";
import { User, UserRole, UserStatus } from "./grpc-gen/user";
import { UserSettings } from "./grpc-gen/user_settings";
import { LOG } from "./log";

export type ServerUser = User & { password: string } & LoginSecret;

export const AVAILABLE_FETCHERS = ["fake", "mock"];
// User id => User
export const USERS: Map<string, ServerUser> = new Map();
// Project id => Project
export const PROJECTS: Map<string, Project> = new Map();
// Project id => Ids of Project Paper Entities belonging to Project
export const PROJECT_PROJECT_PAPERS: Map<string, string[]> = new Map();
// Project Paper id => Project Paper
export const PROJECT_PAPERS: Map<string, Project_Paper> = new Map();
// Paper id => Paper
export const PAPERS: Map<string, Paper> = new Map();
// User id => User Settings
export const USER_SETTINGS: Map<string, UserSettings> = new Map();
// User id => List of Papers
export const READING_LISTS: Map<string, Paper[]> = new Map();
// Project id => List of Project Members
export const MEMBERS: Map<string, Project_Member[]> = new Map();
// Project id => Progress in range [0,1]
export const PROGRESS: Map<string, number> = new Map();
// Project id => Ids of Criteria
export const PROJECT_CRITERIA: Map<string, string[]> = new Map();
// Criterion id => Criterion
export const CRITERIA: Map<string, Criterion> = new Map();
// Review id => Review
export const REVIEWS: Map<string, Review> = new Map();
// Project Paper id => Ids of Reviews
export const PAPER_REVIEWS: Map<string, string[]> = new Map();
// Paper Id => PDF Blob
export const PAPER_PDFS: Map<string, Uint8Array> = new Map();


function isEnabled(option: string | undefined): boolean {
    option = option?.toLowerCase() ?? "";
    return option == "1" || option == "yes" || option == "true";
}

if (isEnabled(process.env.ENABLE_DUMMY_ADMIN)) {
    LOG.warn("Security Risk: Dummy Admin User Enabled!");
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
