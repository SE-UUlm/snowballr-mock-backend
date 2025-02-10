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
