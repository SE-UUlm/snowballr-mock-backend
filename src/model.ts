import { LoginSecret } from "./grpc-gen/authentication";
import { Criterion } from "./grpc-gen/criterion";
import { Paper } from "./grpc-gen/paper";
import { Project, Project_Member, Project_Paper } from "./grpc-gen/project";
import { Review } from "./grpc-gen/review";
import { User } from "./grpc-gen/user";
import { UserSettings } from "./grpc-gen/user_settings";

export type ServerUser = User & { password: string } & LoginSecret;

export const availableFetchers = ["fake", "mock"];
export const users: Map<string, ServerUser> = new Map();
export const projects: Map<string, Project> = new Map();
export const project_project_papers: Map<string, string[]> = new Map();
export const project_papers: Map<string, Project_Paper> = new Map();
export const papers: Map<string, Paper> = new Map();
export const user_settings: Map<string, UserSettings> = new Map();
export const reading_lists: Map<string, Paper[]> = new Map();
export const members: Map<string, Project_Member[]> = new Map();
export const progress: Map<string, number> = new Map();
export const project_criteria: Map<string, string[]> = new Map();
export const criteria: Map<string, Criterion> = new Map();
export const reviews: Map<string, Review> = new Map();
export const paper_reviews: Map<string, string[]> = new Map();
export const paper_pdfs: Map<string, Uint8Array> = new Map();
