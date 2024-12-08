import { Author, Criterion, Paper, Project, Review, User } from "./Models";

export interface PaperWrapper {
  stage: number,
  reviews: Review[],
  paper: Paper,
}

export interface ProjectWrapper {
  stage: number,
  project: Project,
  archived: boolean,
  members: number[],
  papers: PaperWrapper[],
}

export let authors: Author[] = [{
    id: 0,
    firstName: "John",
    lastName: "Doe",
    orcid: "johndoe"
}]

export let papers: Paper[] = [{
  id: 0,
  doi: "test-doi",
  title: "Example Paper",
  abstrakt: "Example Paper Abstract",
  year: 1912,
  type: "paper",
  authors: [authors[0]],
  backwardReferencedPaperIds: [0],
  forwardReferencedPaperIds: [0]
}];

export let users: User[] = [{
    id: 0,
    status: "active",
    isAdmin: true,
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com"
}];
export let projects: ProjectWrapper[] = [{
    stage: 0,
    project: {
      id: 0,
      reviewDecisionMatrix: {
        numberOfReviewers: 2,
        patterns: new Map(),
      },
      name: "Test Project",
      similarityThreshold: 0.8,
      paperFetchApis: ["foobar"],
    },
    archived: false,
    members: [0],
    papers: [{
        stage: 0,
        reviews: [],
        paper: papers[0],
    }]
}];

export let criteria: Map<number, Criterion[]> = new Map();

