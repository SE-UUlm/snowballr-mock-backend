import { LoginSecret } from "./grpc-gen/authentication";
import { Criterion } from "./grpc-gen/criterion";
import { Paper } from "./grpc-gen/paper";
import { PaperDecision, Project, Project_Member, Project_Paper } from "./grpc-gen/project";
import { Review } from "./grpc-gen/review";
import { User } from "./grpc-gen/user";
import { UserSettings } from "./grpc-gen/user_settings";
import { toServerUser, getRandomItems } from "./util";
import { LOG } from "./log";

export type ServerUser = User & { password: string } & LoginSecret;
export type ServerProjectPaper = Omit<Project_Paper, "reviews">;

/* Maps storing all data of the mock backend and simulating a "database" */
export let AVAILABLE_FETCHERS: string[] = [];
// User id => User (with login credentials and password)
export const USERS: Map<string, ServerUser> = new Map();
// User id => Ids of projects to which the user has been invited
export const INVITATIONS: Map<string, string[]> = new Map();
// Project id => Project
export const PROJECTS: Map<string, Project> = new Map();
// Project id => Ids of project paper entities belonging to the project
export const PROJECT_PROJECT_PAPERS: Map<string, string[]> = new Map();
// Project Paper id => Project paper
export const PROJECT_PAPERS: Map<string, ServerProjectPaper> = new Map();
// Paper id => Paper
export const PAPERS: Map<string, Paper> = new Map();
// User id => User settings
export const USER_SETTINGS: Map<string, UserSettings> = new Map();
// User id => List of papers of the reading list of the user with the id
export const READING_LISTS: Map<string, Paper[]> = new Map();
// Project id => List of project members of this project
export const MEMBERS: Map<string, Project_Member[]> = new Map();
// Project id => Progress of the current stage in range [0,1]
export const PROGRESS: Map<string, number> = new Map();
// Project id => Ids of criteria
export const PROJECT_CRITERIA: Map<string, string[]> = new Map();
// Criterion id => Criterion
export const CRITERIA: Map<string, Criterion> = new Map();
// Review id => Review
export const REVIEWS: Map<string, Review> = new Map();
// Project Paper id => Ids of reviews for this project paper
export const PAPER_REVIEWS: Map<string, string[]> = new Map();
// Paper Id => PDF Blob
export const PAPER_PDFS: Map<string, Uint8Array> = new Map();

export interface ExampleData {
    availableFetchers?: string[];
    criteria?: Criterion[];
    papers?: Paper[];
    users?: User[];
    invitations?: Map<User, Project[]>;
    userSettings?: Map<User, UserSettings>;
    readingLists?: Map<User, Paper[]>;
    projects?: Project[];
    projectMembers?: { projectId: string; members: Project_Member[] }[];
    reviews?: Review[];
    projectPapers?: Project_Paper[];
}

/**
 * Processes the loaded example data, i.e. (eventually) initializing the maps (= "database")
 * containing all the data of the mock backend.
 *
 * @param data the loaded example data
 */
function processExampleData(data: ExampleData) {
    AVAILABLE_FETCHERS = data.availableFetchers ?? [""];
    data.criteria?.forEach((criterion) => CRITERIA.set(criterion.id, criterion));
    data.papers?.forEach((paper) => PAPERS.set(paper.id, paper));
    data.reviews?.forEach((review) => REVIEWS.set(review.id, review));
    data.users?.forEach((user) => {
        USERS.set(
            user.email,
            toServerUser(user, `user${user.id}`, { accessToken: "", refreshToken: "" }),
        );
        READING_LISTS.set(user.email, data.readingLists?.get(user) ?? []);
        USER_SETTINGS.set(user.email, <UserSettings>data.userSettings?.get(user) ?? []);
        INVITATIONS.set(
            user.email,
            (data.invitations?.get(user) ?? []).map((project) => project.id),
        );
    });
    data.projects?.forEach((project) => {
        PROJECTS.set(project.id, project);
        PROJECT_PROJECT_PAPERS.set(project.id, []);

        // create project criteria
        PROJECT_CRITERIA.set(project.id, getRandomItems(CRITERIA.keys(), 5, 10));

        // create a set of project papers
        getRandomItems(data.projectPapers ?? [], 25, 40)
            .filter((paper) => paper.stage <= project.maxStage)
            .map((paper) => ({ ...paper, id: `${project.id}-${paper.id}` }))
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
        const paperInStage = PROJECT_PROJECT_PAPERS.get(project.id)
            ?.map((id) => PROJECT_PAPERS.get(id))
            .filter((paper) => paper !== undefined && paper.stage === project.currentStage);
        const numberOfReviewedPaperInStage =
            paperInStage?.filter((paper) => paper?.decision !== PaperDecision.UNDECIDED).length ??
            0;
        const totalNumberOfPaperInStage = paperInStage?.length ?? Infinity;
        PROGRESS.set(project.id, numberOfReviewedPaperInStage / totalNumberOfPaperInStage);
    });
    data.projectMembers?.forEach(({ projectId, members }) => MEMBERS.set(projectId, members));
}

/**
 * Imports example data from another (typescript) file and initialize mock backend with all given
 * data.
 *
 *
 * @param filename the name of the file containing the example data
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
        .catch((error) => {
            LOG.error(
                `Failed to load example data from file "${filename}". Falling back to default settings, so starting server with no initial data...\nError: ${error}`,
            );
        });
}
