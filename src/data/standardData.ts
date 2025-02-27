import { User, UserRole, UserStatus } from "../grpc-gen/user";
import { ExampleData } from "../model";
import {
    MemberRole,
    PaperDecision,
    Project,
    Project_Member,
    Project_Settings,
    ProjectStatus,
    ReviewDecisionMatrix,
    ReviewDecisionMatrix_Pattern,
    SnowballingType,
} from "../grpc-gen/project";
import { ReviewDecision } from "../grpc-gen/review";
import { Criterion, CriterionCategory } from "../grpc-gen/criterion";

function getRandomItems<T>(list: T[], minNumberOfItems = 1, maxNumberOfItems = 1): T[] {
    const shuffledList = [...list].sort(() => Math.random() - 0.5);
    return shuffledList.slice(
        0,
        Math.floor(Math.random() * (maxNumberOfItems - minNumberOfItems)) + minNumberOfItems,
    );
}

const USERS: User[] = [
    {
        id: "1",
        email: "alice.smith@example.com",
        firstName: "Alice",
        lastName: "Smith",
        role: UserRole.DEFAULT,
        status: UserStatus.ACTIVE,
    },
    {
        id: "2",
        email: "bob.jones@example.com",
        firstName: "Bob",
        lastName: "Jones",
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
    },
    {
        id: "3",
        email: "charlie.davis@example.com",
        firstName: "Charlie",
        lastName: "Davis",
        role: UserRole.DEFAULT,
        status: UserStatus.ACTIVE,
    },
    {
        id: "4",
        email: "diana.martin@example.com",
        firstName: "Diana",
        lastName: "Martin",
        role: UserRole.DEFAULT,
        status: UserStatus.DELETED,
    },
    {
        id: "5",
        email: "edward.miller@example.com",
        firstName: "Edward",
        lastName: "Miller",
        role: UserRole.DEFAULT,
        status: UserStatus.ACTIVE,
    },
    {
        id: "6",
        email: "fiona.wilson@example.com",
        firstName: "Fiona",
        lastName: "Wilson",
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
    },
    {
        id: "7",
        email: "george.anderson@example.com",
        firstName: "George",
        lastName: "Anderson",
        role: UserRole.DEFAULT,
        status: UserStatus.ACTIVE,
    },
    {
        id: "8",
        email: "hannah.taylor@example.com",
        firstName: "Hannah",
        lastName: "Taylor",
        role: UserRole.ADMIN,
        status: UserStatus.DELETED,
    },
    {
        id: "9",
        email: "ian.thomas@example.com",
        firstName: "Ian",
        lastName: "Thomas",
        role: UserRole.DEFAULT,
        status: UserStatus.ACTIVE,
    },
    {
        id: "10",
        email: "julia.clark@example.com",
        firstName: "Julia",
        lastName: "Clark",
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
    },
    {
        id: "11",
        email: "kevin.roberts@example.com",
        firstName: "Kevin",
        lastName: "Roberts",
        role: UserRole.DEFAULT,
        status: UserStatus.ACTIVE,
    },
    {
        id: "12",
        email: "laura.harris@example.com",
        firstName: "Laura",
        lastName: "Harris",
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
    },
    {
        id: "13",
        email: "michael.clarkson@example.com",
        firstName: "Michael",
        lastName: "Clarkson",
        role: UserRole.DEFAULT,
        status: UserStatus.DELETED,
    },
    {
        id: "14",
        email: "nina.evans@example.com",
        firstName: "Nina",
        lastName: "Evans",
        role: UserRole.DEFAULT,
        status: UserStatus.ACTIVE,
    },
    {
        id: "15",
        email: "oliver.white@example.com",
        firstName: "Oliver",
        lastName: "White",
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
    },
    {
        id: "16",
        email: "paula.thompson@example.com",
        firstName: "Paula",
        lastName: "Thompson",
        role: UserRole.DEFAULT,
        status: UserStatus.ACTIVE,
    },
    {
        id: "17",
        email: "quentin.brown@example.com",
        firstName: "Quentin",
        lastName: "Brown",
        role: UserRole.ADMIN,
        status: UserStatus.DELETED,
    },
    {
        id: "18",
        email: "rachel.lee@example.com",
        firstName: "Rachel",
        lastName: "Lee",
        role: UserRole.DEFAULT,
        status: UserStatus.ACTIVE,
    },
    {
        id: "19",
        email: "steven.walker@example.com",
        firstName: "Steven",
        lastName: "Walker",
        role: UserRole.DEFAULT,
        status: UserStatus.ACTIVE,
    },
    {
        id: "20",
        email: "tina.adams@example.com",
        firstName: "Tina",
        lastName: "Adams",
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
    },
];

const AVAILABLE_FETCHERS: string[] = [
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

const PATTERN_2: ReviewDecisionMatrix_Pattern[] = [
    {
        reviews: [ReviewDecision.ACCEPTED, ReviewDecision.ACCEPTED],
        decision: PaperDecision.ACCEPTED,
    },
    {
        reviews: [ReviewDecision.DECLINED, ReviewDecision.DECLINED],
        decision: PaperDecision.DECLINED,
    },
    {
        reviews: [ReviewDecision.ACCEPTED, ReviewDecision.DECLINED],
        decision: PaperDecision.UNDECIDED,
    },
    { reviews: [ReviewDecision.ACCEPTED, ReviewDecision.MAYBE], decision: PaperDecision.UNDECIDED },
    { reviews: [ReviewDecision.DECLINED, ReviewDecision.MAYBE], decision: PaperDecision.DECLINED },
    { reviews: [ReviewDecision.MAYBE, ReviewDecision.MAYBE], decision: PaperDecision.UNDECIDED },
];

const PATTERN_3: ReviewDecisionMatrix_Pattern[] = [
    {
        reviews: [ReviewDecision.ACCEPTED, ReviewDecision.ACCEPTED, ReviewDecision.ACCEPTED],
        decision: PaperDecision.ACCEPTED,
    },
    {
        reviews: [ReviewDecision.ACCEPTED, ReviewDecision.ACCEPTED, ReviewDecision.DECLINED],
        decision: PaperDecision.ACCEPTED,
    },
    {
        reviews: [ReviewDecision.DECLINED, ReviewDecision.ACCEPTED, ReviewDecision.DECLINED],
        decision: PaperDecision.DECLINED,
    },
    {
        reviews: [ReviewDecision.DECLINED, ReviewDecision.MAYBE, ReviewDecision.ACCEPTED],
        decision: PaperDecision.UNDECIDED,
    },
    {
        reviews: [ReviewDecision.ACCEPTED, ReviewDecision.MAYBE, ReviewDecision.MAYBE],
        decision: PaperDecision.ACCEPTED,
    },
    {
        reviews: [ReviewDecision.DECLINED, ReviewDecision.MAYBE, ReviewDecision.MAYBE],
        decision: PaperDecision.DECLINED,
    },
];

const reviewDecisionMatrices: ReviewDecisionMatrix[] = [];
for (let i = 0; i < 7; i++) {
    reviewDecisionMatrices.push({
        numberOfReviewers: 2,
        patterns: getRandomItems(PATTERN_2, 2, 5),
    });
}
for (let i = 0; i < 3; i++) {
    reviewDecisionMatrices.push({
        numberOfReviewers: 3,
        patterns: getRandomItems(PATTERN_3, 2, 4),
    });
}

const projectSettings: Project_Settings[] = [];
for (let i = 0; i < 7; i++) {
    projectSettings.push({
        similarityThreshold: Math.random() * 0.2 + 0.5,
        decisionMatrix: getRandomItems(reviewDecisionMatrices)[0],
        fetcherApis: getRandomItems(AVAILABLE_FETCHERS, 2, 7),
        snowballingType:
            Math.random() < 0.7
                ? SnowballingType.BOTH
                : Math.random() < 0.5
                  ? SnowballingType.FORWARD
                  : SnowballingType.BACKWARD,
        reviewMaybeAllowed: Math.random() < 0.7,
    });
}

const projects: Project[] = [];
const PROJECT_NAMES: string[] = [
    "Innovative Survey for Education",
    "Systematic Study in Healthcare",
    "Comprehensive Review of Sustainability",
    "Dynamic Analysis for Automation",
    "Focused Protocol on AI",
    "Recent Investigation in Robotics",
    "Critical Framework on Climate Change",
    "Combinatorial Study for Education",
    "Global Survey of Sustainability",
    "Efficient Review on AI",
    "Innovative Methodology in Bioinformatics",
    "Comprehensive Framework for Automation",
    "Dynamic Assessment on Data Privacy",
    "Recent Approach in Robotics",
    "Systematic Investigation for Education",
    "Combinatorial Review on Climate Change",
    "Global Study for Bioinformatics",
    "Focused Protocol on Sustainability",
    "Critical Approach for Automation",
    "Efficient Review in Healthcare",
];
for (const [index, projectName] of PROJECT_NAMES.entries()) {
    const stage: number = Math.floor(Math.random() * 2);

    projects.push({
        id: "" + index,
        name: projectName,
        status:
            Math.random() < 0.7
                ? ProjectStatus.ACTIVE
                : Math.random() < 0.5
                  ? ProjectStatus.ARCHIVED
                  : ProjectStatus.DELETED,
        currentStage: BigInt(stage),
        maxStage: BigInt(Math.random() < 0.6 ? stage : stage + 1),
        settings: getRandomItems(projectSettings)[0],
    });
}
const projectMembers: { projectId: string; members: Project_Member[] }[] = [];
for (const project of projects) {
    const members = getRandomItems(USERS, 2, 6).map((user) => ({
        user: user,
        role: MemberRole.DEFAULT,
    }));
    members[0].role = MemberRole.ADMIN;

    projectMembers.push({
        projectId: project.id,
        members: members,
    });
}

const CRITERIA: Criterion[] = [
    {
        id: "1",
        tag: "I1",
        name: "Title Relevance",
        description:
            "The title of the paper must be relevant to the topic of the systematic review.",
        category: CriterionCategory.INCLUSION,
    },
    {
        id: "2",
        tag: "I2",
        name: "Abstract Relevance",
        description:
            "The abstract of the paper should align with the inclusion criteria and cover the main aspects of the research topic.",
        category: CriterionCategory.INCLUSION,
    },
    {
        id: "3",
        tag: "I3",
        name: "Publication Year",
        description:
            "The paper must have been published within the last 10 years to ensure the research is current.",
        category: CriterionCategory.INCLUSION,
    },
    {
        id: "4",
        tag: "I4",
        name: "Peer-Reviewed",
        description:
            "The paper must be peer-reviewed to ensure the quality and validity of the research.",
        category: CriterionCategory.INCLUSION,
    },
    {
        id: "5",
        tag: "I5",
        name: "Language",
        description:
            "The paper must be written in English or other predefined languages to be included.",
        category: CriterionCategory.INCLUSION,
    },
    {
        id: "6",
        tag: "I6",
        name: "Research Design",
        description:
            "The paper must present original research (e.g., experimental, observational, case study, etc.) rather than reviews or theoretical papers.",
        category: CriterionCategory.INCLUSION,
    },
    {
        id: "7",
        tag: "I7",
        name: "Study Population",
        description:
            "The paper must include a specific human, animal, or ecological population relevant to the systematic review's scope.",
        category: CriterionCategory.INCLUSION,
    },
    {
        id: "8",
        tag: "I8",
        name: "Intervention Type",
        description:
            "The paper must focus on a specific intervention or treatment type that matches the review's inclusion criteria.",
        category: CriterionCategory.INCLUSION,
    },
    {
        id: "9",
        tag: "HE9",
        name: "Non-English Language",
        description:
            "The paper is excluded if it is not written in English or other predefined languages.",
        category: CriterionCategory.HARD_EXCLUSION,
    },
    {
        id: "10",
        tag: "HE10",
        name: "Non-Peer-Reviewed",
        description:
            "The paper is excluded if it is not peer-reviewed, as it may not meet the required research quality.",
        category: CriterionCategory.HARD_EXCLUSION,
    },
    {
        id: "11",
        tag: "HE11",
        name: "Duplicate Publication",
        description:
            "The paper is excluded if it is a duplicate of another included paper or presents the same data from the same research study.",
        category: CriterionCategory.HARD_EXCLUSION,
    },
    {
        id: "12",
        tag: "E12",
        name: "Research Type Not Relevant",
        description:
            "The paper is excluded if it does not contain original research (e.g., reviews, theoretical papers, or opinion articles).",
        category: CriterionCategory.EXCLUSION,
    },
    {
        id: "13",
        tag: "E13",
        name: "Out of Scope",
        description:
            "The paper is excluded if it does not fit within the defined scope or objectives of the systematic review.",
        category: CriterionCategory.EXCLUSION,
    },
    {
        id: "14",
        tag: "E14",
        name: "Methodological Issues",
        description:
            "The paper is excluded if it contains significant methodological flaws that compromise the validity of the results.",
        category: CriterionCategory.EXCLUSION,
    },
    {
        id: "15",
        tag: "E15",
        name: "Non-Relevant Population",
        description:
            "The paper is excluded if the population studied is not relevant to the scope of the systematic review.",
        category: CriterionCategory.EXCLUSION,
    },
];
const projectCriteria: { projectId: string; criteriaIds: string[] }[] = [];
const CRITERIA_IDS: string[] = CRITERIA.map((criteria) => criteria.id);
for (const project of projects) {
    projectCriteria.push({
        projectId: project.id,
        criteriaIds: getRandomItems(CRITERIA_IDS, 10, 15).sort(),
    });
}

export const exampleData: ExampleData = {
    users: USERS,
    projects: projects,
    projectMembers: projectMembers,
    criteria: CRITERIA,
    projectCriteria: projectCriteria,
};
