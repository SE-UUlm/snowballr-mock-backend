import { Get, JsonController, Param } from "routing-controllers";
import { projects } from "./Data";

@JsonController("/users/:id")
export class UserController {
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
