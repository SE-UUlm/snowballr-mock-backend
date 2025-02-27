import { LoginSecret } from "./grpc-gen/authentication";
import { Criterion } from "./grpc-gen/criterion";
import { Paper } from "./grpc-gen/paper";
import { Project, Project_Member, Project_Paper } from "./grpc-gen/project";
import { Review } from "./grpc-gen/review";
import { User, UserRole, UserStatus } from "./grpc-gen/user";
import { UserSettings } from "./grpc-gen/user_settings";
import { LOG } from "./log";
import { fromUser } from "./util";

export type ServerUser = User & { password: string } & LoginSecret;
export type ServerProjectPaper = Omit<Project_Paper, "reviews">;

export const AVAILABLE_FETCHERS = [
    "arXiv API",
    "Semantic Scholar API",
    "PubMed API",
    "CrossRef API",
    "CORE API",
    "Springer Nature API",
    "Elsevier Scopus API",
    "IEEE Xplore API",
    "OpenCitations API",
    "Europe PMC API",
];
export const USERS: Map<string, ServerUser> = new Map();
// Project id => Project
export const PROJECTS: Map<string, Project> = new Map();
// Project id => Ids of Project Paper Entities belonging to Project
export const PROJECT_PROJECT_PAPERS: Map<string, string[]> = new Map();
// Project Paper id => Project Paper
export const PROJECT_PAPERS: Map<string, ServerProjectPaper> = new Map();
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

export function addProjectPaperReviews(paper: ServerProjectPaper): Project_Paper {
    return {
        ...paper,
        reviews: PAPER_REVIEWS.get(paper.id)!.map((reviewId) => REVIEWS.get(reviewId)!),
    };
}

export interface ExampleData {
    users?: User[];
    projects?: Project[];
    projectMembers?: { projectId: string; members: Project_Member[] }[];
    criteria?: Criterion[];
    projectCriteria?: { projectId: string; criteriaIds: string[] }[];
    papers?: Paper[];
}

/**
 * Imports example data from another (typescript) file and initialize mock backend with all given
 * data.
 *
 *
 * @param filename - The name of the file containing the example data
 */
function loadExampleData(filename: string) {
    import(`./data/${filename.replace(".ts", "")}`)
        .then((loadedData: { exampleData: ExampleData }) => {
            const data = loadedData.exampleData;

            data.users?.forEach((user: User) =>
                USERS.set(
                    user.email,
                    fromUser(user, `user${user.id}`, { accessToken: "", refreshToken: "" }),
                ),
            );

            data.projects?.forEach((project: Project) => PROJECTS.set(project.id, project));
            data.projectMembers?.forEach(({ projectId, members }) =>
                MEMBERS.set(projectId, members),
            );
            data.criteria?.forEach((criterion: Criterion) => CRITERIA.set(criterion.id, criterion));
            data.projectCriteria?.forEach(({ projectId, criteriaIds }) =>
                PROJECT_CRITERIA.set(projectId, criteriaIds),
            );
            data.papers?.forEach((paper: Paper) => PAPERS.set(paper.id, paper));

            LOG.info(
                `Successfully load example data from file "${filename}". Server is starting with preloaded data...`,
            );
        })
        .catch(() => {
            LOG.error(
                `Failed to load example data from file "${filename}". Falling back to default settings, so starting server with no initial data...`,
            );
        });
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
    LOG.info(USERS.get("admin@admin"), "The dummy admin user");
}

// Check, whether a filepath to a file containing example data for the mock backend is set
if (process.env.EXAMPLE_DATA_FILE !== undefined && process.env.EXAMPLE_DATA_FILE !== "") {
    loadExampleData(process.env.EXAMPLE_DATA_FILE);
}
