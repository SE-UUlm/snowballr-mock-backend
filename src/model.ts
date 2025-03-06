import { LoginSecret } from "./grpc-gen/authentication";
import { Criterion } from "./grpc-gen/criterion";
import { Paper } from "./grpc-gen/paper";
import { PaperDecision, Project, Project_Member, Project_Paper } from "./grpc-gen/project";
import { Review } from "./grpc-gen/review";
import { User } from "./grpc-gen/user";
import { UserSettings } from "./grpc-gen/user_settings";
import { fromUser, getRandomItems } from "./util";
import { LOG } from "./main";

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

export interface ExampleData {
    criteria?: Criterion[];
    papers?: Paper[];
    users?: User[];
    userSettings?: UserSettings[];
    projects?: Project[];
    projectMembers?: { projectId: string; members: Project_Member[] }[];
    reviews?: Review[];
    projectPapers?: Project_Paper[];
}

/**
 * Processes the loaded example data, i.e. (eventually) initializing the maps (= "database")
 * containing all the data of the mock backend.
 *
 * @param data - The loaded example data
 */
function processExampleData(data: ExampleData) {
    data.criteria?.forEach((criterion) => CRITERIA.set(criterion.id, criterion));
    data.papers?.forEach((paper) => PAPERS.set(paper.id, paper));
    data.reviews?.forEach((review) => REVIEWS.set(review.id, review));
    data.users?.forEach((user) => {
        USERS.set(
            user.email,
            fromUser(user, `user${user.id}`, { accessToken: "", refreshToken: "" }),
        );

        // create random reading list for this user
        READING_LISTS.set(user.email, getRandomItems(Array.from(PAPERS.values()), 4, 10));

        // add user settings
        USER_SETTINGS.set(user.email, getRandomItems(data.userSettings ?? [])[0]);
    });
    data.projects?.forEach((project) => {
        PROJECTS.set(project.id, project);
        PROJECT_PROJECT_PAPERS.set(project.id, []);

        // create project criteria
        PROJECT_CRITERIA.set(project.id, getRandomItems(Array.from(CRITERIA.keys()), 5, 10).sort());

        // create a set of project papers
        getRandomItems(Array.from(data.projectPapers ?? []), 25, 40)
            .filter((paper) => paper.stage <= project.maxStage)
            .map((paper) => ({ ...paper, id: project.id + "-" + paper.id }))
            .forEach((paper: Project_Paper) => {
                PROJECT_PAPERS.set(paper.id, paper);
                PROJECT_PROJECT_PAPERS.get(project.id)?.push(paper.id);

                // add paper reviews in separate PAPER_REVIEWS map
                PAPER_REVIEWS.set(
                    paper.id,
                    paper.reviews.map((review) => review.id),
                );
            });

        // set the progress of the project
        PROGRESS.set(
            project.id,
            ((PROJECT_PROJECT_PAPERS.get(project.id)
                ?.map((id) => PROJECT_PAPERS.get(id))
                .filter(
                    (paper) =>
                        paper !== undefined &&
                        paper.stage === project.currentStage &&
                        paper.decision !== PaperDecision.UNDECIDED,
                ).length ?? 0) *
                100) /
                (PROJECT_PROJECT_PAPERS.get(project.id)?.length ?? Infinity),
        );
    });
    data.projectMembers?.forEach(({ projectId, members }) => MEMBERS.set(projectId, members));
}

/**
 * Imports example data from another (typescript) file and initialize mock backend with all given
 * data.
 *
 *
 * @param filename - The name of the file containing the example data
 */
export function loadExampleData(filename: string) {
    import(`./data/${filename.replace(".ts", "")}`)
        .then((loadedData: { exampleData: ExampleData }) => {
            const data = loadedData.exampleData;

            processExampleData(data);

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
