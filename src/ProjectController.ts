import { Body, Delete, Get, JsonController, Param, Post, Put } from "routing-controllers";
import { Paper, Project, ProjectSpec, User } from "./Models";
import { projects, users } from "./Data";

@JsonController("/projects")
export class GlobalProjectController {
  @Get("/")
  getAll() {
    return projects
      .filter(x => !x.archived)
      .map(x => x.project);
  }
  
  @Get("/archived")
  getArchived() {
    return projects.filter(x => x.archived);
  }

  @Post("/")
  create(@Body() spec: ProjectSpec) {
    projects.push({
        stage: 0,
        members: [],
        archived: false,
        project: {
            id: projects.length,
            ...spec,
        },
        papers: []
    });
    
    return projects.at(-1)!.project;
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
    if (projects.length <= id)
      return
      
    projects[id] = {
      ...projects[id],
      project: {
        ...projects[id].project,
        ...newSpec,
      }
    };

    return projects[id];
  }

  @Post("/archive")
  archive(@Param("id") id: number) {
    if (projects.length <= id)
      return
      
    projects[id].archived = true
  }

  @Get("/stages")
  getStage(@Param("id") id: number) {
    return projects.at(id)?.stage; 
  }

  @Get("/members")
  getMembers(@Param("id") id: number) {
    return projects
      .at(id)
      ?.members.map(x => users[x]);
  }

  @Post("/invite")
  inviteUser(@Param("id") id: number, email: string) {
    if (projects.length <= id)
      return;

    users.push({
        id: users.length,
        status: "active",
        isAdmin: false,
        firstName: "John",
        lastName: `The ${users.length}`,
        email: email
    });
    projects[id].members.push(users.length - 1);
  }

  @Delete("/members/:userId")
  removeMember(@Param("id") id: number, @Param("userId") userId: number) {
    if (projects.length <= id)
      return;

    projects[id].members = projects[id].members
      .filter(x => x != userId);
  }
}

