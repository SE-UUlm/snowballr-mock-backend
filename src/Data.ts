import { LoremIpsum } from "lorem-ipsum";
import {
    Author,
    Criterion,
    CriterionCategory,
    Paper,
    PaperDecision,
    Project,
    Review,
    ReviewDecision,
    StageEntry,
    User,
} from "./Models";

const lorem = new LoremIpsum({
    sentencesPerParagraph: {
        max: 8,
        min: 4,
    },
    wordsPerSentence: {
        max: 16,
        min: 4,
    },
});

export interface PaperWrapper {
    stage: number;
    reviews: Review[];
    paper: Paper;
}

export interface ProjectWrapper {
    stage: number;
    project: Project;
    members: number[];
    papers: StageEntry[];
}

export const authors: Author[] = [
    {
        id: 0,
        firstName: "John",
        lastName: "Doe",
        orcid: "johndoe",
    },
];

export const publisherNames: string[] = [
    "Springer",
    "IEEE",
    "ACM",
    "Elsevier",
    "Wiley",
    "Taylor & Francis",
    "SAGE",
    "Oxford University Press",
    "Cambridge University Press",
    "Routledge",
    "Palgrave Macmillan",
    "Emerald",
    "De Gruyter",
    "Brill",
    "SAGE",
];

export const publicationTypes: string[] = [
    "journal",
    "conference",
    "workshop",
    "book",
    "book chapter",
    "report",
    "thesis",
    "patent",
    "preprint",
    "other",
];

export const publicationNames: string[] = [
    "Journal of Software Engineering",
    "IEEE Transactions on Software Engineering",
    "ACM Transactions on Software Engineering and Methodology",
    "Journal of Systems and Software",
    "Journal of Software: Evolution and Process",
    "Journal of Software Maintenance and Evolution: Research and Practice",
    "Journal of Software: Practice and Experience",
    "Journal of Software: Testing, Verification and Reliability",
    "Journal of Software: Evolution and Process",
];

function randomNumBetween(start: number, end: number) {
    return Math.floor(Math.random() * (end - start + 1) + start);
}

function randomValueOf<T>(list: T[]): T {
    return list[Math.floor(Math.random() * list.length)];
}

function createPaper(id: number): Paper {
    return {
        id: id,
        doi: "test-doi/" + id,
        title: "Example Paper" + id,
        abstrakt: lorem.generateWords(randomNumBetween(150, 250)),
        year: Math.round(randomNumBetween(1980, 2024)),
        publisherName: randomValueOf(publisherNames),
        publicationType: randomValueOf(publicationTypes),
        publicationName: randomValueOf(publicationNames),
        authors: [authors[0]],
        backwardReferencedPaperIds: [0],
        forwardReferencedPaperIds: [0],
        reviewData:
            Math.random() < 0.2
                ? undefined
                : {
                      finalDecision:
                          Math.random() < 0.3
                              ? ReviewDecision.Maybe
                              : Math.random() < 0.5
                                ? ReviewDecision.No
                                : ReviewDecision.Yes,
                      reviews: [],
                  },
    };
}

export const papers: Paper[] = Array.from({ length: 30 }, (_, i) => createPaper(i));

export const users: User[] = [
    {
        id: 0,
        status: "active",
        isAdmin: true,
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
    },
    {
        id: 1,
        status: "active",
        isAdmin: false,
        firstName: "Jane",
        lastName: "Doe",
        email: "jane.doe@example.com",
    },
];

function createProjectPaper(i: number): StageEntry {
    return {
        paper: papers[i],
        stage: 0,
        status: "",
        decision: PaperDecision.Excluded,
    };
}

function createProject(id: number): ProjectWrapper {
    return {
        stage: 0,
        project: {
            id: id,
            reviewDecisionMatrix: {
                numberOfReviewers: 2,
                patterns: new Map(),
            },
            name:
                Math.random() < 0.5
                    ? "Demo project [Use case] View project list " + id
                    : "Demo " + id,
            similarityThreshold: 0.8,
            paperFetchApis: ["foobar"],
            archived: Math.random() < 0.4 ? true : false,
        },
        members: Math.random() < 0.5 ? [0, 1, 0, 1, 0] : [0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
        papers: Array.from({ length: randomNumBetween(15, 25) }, (_, i) => createProjectPaper(i)),
    };
}

export const projects: ProjectWrapper[] = Array.from({ length: randomNumBetween(7, 15) }, (_, i) =>
    createProject(i),
);

export const criteria: Map<number, Criterion[]> = new Map([
    [
        0,
        [
            {
                id: 0,
                tag: "E5",
                name: "Not in English",
                description: "The paper is not in English",
                category: CriterionCategory.HardExclusion,
            },
            {
                id: 1,
                tag: "SE3",
                name: "Author's last name starts with 'D'",
                description: "This is a very funny exclusion criterion",
                category: CriterionCategory.Exclusion,
            },
        ],
    ],
]);
