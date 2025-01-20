import { Get, JsonController, Param } from "routing-controllers";
import { projects, users } from "./Data";

@JsonController("/users")
export class GlobalUserController {
    @Get("/")
    getAll() {
        return users;
    }
}

@JsonController("/users/:id")
export class UserController {
    @Get("/")
    getUser(@Param("id") id: number) {
        return users.filter((user) => user.id === id);
    }

    @Get("/projects")
    getUserProjects(@Param("id") id: number) {
        return projects
            .filter((x) => x.members.includes(id))
            .map((x) => x.project)
            .filter((x) => !x.archived);
    }

    @Get("/archivedProjects")
    getUserArchivedProjects(@Param("id") id: number) {
        return projects
            .filter((x) => x.members.includes(id))
            .map((x) => x.project)
            .filter((x) => x.archived);
    }
}
