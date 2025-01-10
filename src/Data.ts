import { Author, Criterion, CriterionCategory, Paper, PaperDecision, Project, Review, ReviewDecision, StageEntry, User } from "./Models";

export interface PaperWrapper {
  stage: number,
  reviews: Review[],
  paper: Paper,
}

export interface ProjectWrapper {
  stage: number,
  project: Project,
  members: number[],
  papers: StageEntry[],
}

export let authors: Author[] = [{
    id: 0,
    firstName: "John",
    lastName: "Doe",
    orcid: "johndoe"
}]

export let publisherNames: string[] = [
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
]

export let publicationTypes: string[] = [
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
]

export let publicationNames: string[] = [
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

function createPaper(id: number): Paper {
  return {
    id: id,
    doi: "test-doi/" + id,
    title: "Example Paper" + id,
    abstrakt: "Example Paper Abstract " + id,
    year: Math.round(1980 + Math.random() * 40),
    publisherName: publisherNames[Math.floor(Math.random() * publisherNames.length)],
    publicationType: publicationTypes[Math.floor(Math.random() * publicationTypes.length)],
    publicationName: publicationNames[Math.floor(Math.random() * publicationNames.length)],
    authors: [authors[0]],
    backwardReferencedPaperIds: [0],
    forwardReferencedPaperIds: [0],
    reviewData: Math.random() < 0.2 ? undefined : {
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
      name: Math.random() < 0.5 ? "Demo project [Use case] View project list " + id : "Demo " + id,
      similarityThreshold: 0.8,
      paperFetchApis: ["foobar"],
      archived: Math.random() < 0.4 ? true : false,
    },
    members: Math.random() < 0.5 ? [0,1,0,1,0] : [0,1,0,1,0,1,0,1,0,1],
    papers: Array.from({length: (Math.random() * 10) + 15}, (_, i) => {
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

export let criteria: Map<number, Criterion[]> = new Map([
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
