import { Author, Criterion, Paper, PaperDecision, Project, Review, ReviewDecision, StageEntry, User } from "./Models";

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
  papers: StageEntry[],
}

export let authors: Author[] = [{
    id: 0,
    firstName: "John",
    lastName: "Doe",
    orcid: "johndoe"
}]

function createPaper(id: number): Paper {
  return {
    id: id,
    doi: "test-doi/" + id,
    title: "Example Paper" + id,
    abstrakt: "Example Paper Abstract " + id,
    year: Math.round(1980 + Math.random() * 40),
    type: "paper",
    authors: [authors[0]],
    backwardReferencedPaperIds: [0],
    forwardReferencedPaperIds: [0],
    reviewData: {
      finalDecision: Math.random() < 0.3 ? ReviewDecision.Maybe : (Math.random() < 0.5 ? ReviewDecision.No : ReviewDecision.Yes),
      reviews: [],
    }
  };
}

export let papers: Paper[] = Array.from({length: 30 }, (_, i) => createPaper(i));

export let users: User[] = [{
    id: 0,
    status: "active",
    isAdmin: true,
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com"
}, {
  id: 1,
  status: "active",
  isAdmin: false,
  firstName: "Jane",
  lastName: "Doe",
  email: "jane.doe@example.com"
}];

function createProject(id: number): ProjectWrapper {
  return {
    stage: 0,
    project: {
      id: id,
      reviewDecisionMatrix: {
        numberOfReviewers: 2,
        patterns: new Map(),
      },
      name: "Demo project " + id,
      similarityThreshold: 0.8,
      paperFetchApis: ["foobar"],
    },
    archived: false,
    members: Math.random() < 0.5 ? [0] : [0,1],
    papers: Array.from({length: (Math.random() * 10) + 2}, (_, i) => {
        let paper = {
          paper: papers[i],
          stage: 0,
          status:"",
          decision: PaperDecision.Excluded,
          };
        return paper;
      }
    ),
  }
}

export let projects: ProjectWrapper[] = Array.from({length: 7}, (_, i) => createProject(i));

export let criteria: Map<number, Criterion[]> = new Map();

