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
            members: [0],
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
    private getProjectWrapper(id: number) {
        return projects.at(id);
    }

    private getProject(id: number) {
        return this.getProjectWrapper(id)?.project;
    }

    @Get("/")
    getOne(@Param("id") id: number) {
        const project = this.getProject(id);

        if (project) {
            return project;
        } else {
            return { status: 404, message: "Project not found" };
        }
    }

    @Put("/")
    update(@Param("id") id: number, @Body() newSpec: ProjectSpec) {
        const projectWrapper = this.getProjectWrapper(id);

        if (!projectWrapper) {
            return { status: 404, message: "Project not found" };
        }

        projectWrapper.project = {
            ...projectWrapper.project,
            ...newSpec,
        };

        return projectWrapper.project;
    }

    @Post("/archive")
    archive(@Param("id") id: number) {
        const project = this.getProject(id);

        if (!project) {
            return { status: 404, message: "Project not found" };
        }

        project.archived = true;
    }

    @Get("/stages")
    getStage(@Param("id") id: number) {
        const projectWrapper = this.getProjectWrapper(id);

        if (!projectWrapper) {
            return { status: 404, message: "Project not found" };
        }

        return projectWrapper.stage;
    }

    @Get("/currentStage")
    getCurrentStage(@Param("id") id: number) {
        const projectWrapper = this.getProjectWrapper(id);

        if (!projectWrapper) {
            return { status: 404, message: "Project not found" };
        }

        return projectWrapper.stage;
    }

    @Get("/members")
    getMembers(@Param("id") id: number) {
        const projectWrapper = this.getProjectWrapper(id);

        if (!projectWrapper) {
            return { status: 404, message: "Project not found" };
        }

        const memberIds = projectWrapper.members ?? [];
        const members = memberIds
            .map((id) => users.find((user) => user.id === id))
            .filter((x) => x !== undefined);
        return members;
    }

    @Post("/invite")
    inviteUser(@Param("id") id: number, @Body() payload: { email: string }) {
        const { email } = payload;
        const projectWrapper = this.getProjectWrapper(id);

        if (!projectWrapper) {
            return { status: 404, message: "Project not found" };
        }

        let userId: number;
        const userWithEmail = users.find((x) => x.email === email);
        if (userWithEmail === undefined) {
            userId = users.length;
            users.push({
                id: id,
                status: "active",
                isAdmin: false,
                firstName: "John",
                lastName: `Doe the ${id}`,
                email: email,
            });
        } else {
            userId = userWithEmail.id;
        }

        projectWrapper.members.push(userId);

        return { status: 200, message: `Invited member with id ${userId}` };
    }

    @Post("/members/:userId/promote")
    promoteUser(@Param("id") id: number, @Param("userId") userId: number) {
        const projectWrapper = this.getProjectWrapper(id);

        if (!projectWrapper) {
            return { status: 404, message: "Project not found" };
        }

        const isInProject = projectWrapper.members.includes(userId);
        const user = users.find((user) => user.id === userId);
        if (isInProject && user) {
            user.isAdmin = true;
        } else {
            return { status: 404, message: "Member not found" };
        }

        return { status: 200, message: `Promoted member with id ${userId}` };
    }

    @Delete("/members/:userId")
    removeMember(@Param("id") id: number, @Param("userId") userId: number) {
        const projectWrapper = this.getProjectWrapper(id);

        if (!projectWrapper) {
            return { status: 404, message: "Project not found" };
        }

        if (projectWrapper.members.includes(userId)) {
            projectWrapper.members = projectWrapper.members.filter((x) => x !== userId);
        } else {
            return { status: 404, message: "Member not found" };
        }

        return { status: 200, message: `Removed member with id ${userId}` };
    }

    @Get("/papers")
    getPapers(@Param("id") id: number) {
        const projectWrapper = this.getProjectWrapper(id);

        if (!projectWrapper) {
            return { status: 404, message: "Project not found" };
        }

        return projectWrapper.papers;
    }
}
