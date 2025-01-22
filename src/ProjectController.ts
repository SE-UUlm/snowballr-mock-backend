import { Body, Delete, Get, JsonController, Param, Post, Put } from "routing-controllers";
import { ProjectSpec } from "./Models";
import { projects, users } from "./Data";

@JsonController("/projects")
export class GlobalProjectController {
    @Get("/")
    getAll() {
        return projects.map((x) => x.project).filter((x) => !x.archived);
    }

    @Get("/archived")
    getArchived() {
        return projects.map((x) => x.project).filter((x) => x.archived);
    }

    @Post("/")
    async create(@Body() spec: ProjectSpec) {
        const newProject = {
            stage: 0,
            members: [],
            project: {
                id: projects.length,
                name: spec.name,
                reviewDecisionMatrix: { numberOfReviewers: 2, patterns: new Map() },
                similarityThreshold: 0,
                paperFetchApis: [],
                archived: false,
            },
            papers: [],
        };

        projects.push(newProject);
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(newProject.project);
            }, 1000);
        });
    }
}

@JsonController("/projects/:id")
export class ProjectController {
    @Get("/")
    getOne(@Param("id") id: number) {
        return projects.at(id)?.project;
    }

    @Put("/")
    update(@Param("id") id: number, @Body() newSpec: ProjectSpec) {
        if (projects.length <= id) return;

        projects[id] = {
            ...projects[id],
            project: {
                ...projects[id].project,
                ...newSpec,
            },
        };

        return projects[id];
    }

    @Post("/archive")
    archive(@Param("id") id: number) {
        if (projects.length <= id) return;

        projects[id].project.archived = true;
    }

    @Get("/stages")
    getStage(@Param("id") id: number) {
        return projects.at(id)?.stage;
    }

    @Get("/currentStage")
    getCurrentStage(@Param("id") id: number) {
        return projects.at(id)?.stage;
    }

    @Get("/members")
    getMembers(@Param("id") id: number) {
        const memberIds = projects.at(id)?.members ?? [];
        const members = memberIds.map((id) => users.find((user) => user.id === id)).filter((x) => x !== undefined);
        return members;
    }

    @Post("/invite")
    inviteUser(@Param("id") id: number, @Body() email: string) {
        if (projects.length <= id) return;

        users.push({
            id: users.length,
            status: "active",
            isAdmin: false,
            firstName: "John",
            lastName: `The ${users.length}`,
            email: email,
        });
        projects[id].members.push(users.length - 1);
    }

    @Delete("/members/:userId")
    removeMember(@Param("id") id: number, @Param("userId") userId: number) {
        console.log("Removing member", userId);
        if (projects.length <= id) {
            return { status: 400, message: "Project not found" };
        }

        if (projects[id].members.includes(userId)) {
            projects[id].members = projects[id].members.filter((x) => x !== userId);
        } else {
            return { status: 400, message: "Member not found" };
        }

        return { status: 200, message: `Removed member with id ${userId}` };
    }

    @Get("/papers")
    getPapers(@Param("id") id: number) {
        return projects.at(id)?.papers;
    }
}
