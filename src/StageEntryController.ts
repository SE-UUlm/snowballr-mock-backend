import { Delete, Get, JsonController, Param } from "routing-controllers";
import { projects } from "./Data";
import { StageEntry } from "./Models";

@JsonController("/projects/:projectId/stages/:stageId/papers/:paperId")
export class StageEntryController {
    @Get("/")
    get(
        @Param("projectId") projectId: number,
        @Param("stageId") stageId: number,
        @Param("paperId") paperId: number,
    ): StageEntry | undefined {
        const paper = projects
            .at(projectId)
            ?.papers?.find((x) => x.stage == stageId && x.paper.id == paperId);

        if (paper == undefined) return;

        return {
            paper: paper.paper,
            stage: paper.stage,
            status: "status",
            decision: undefined,
        };
    }

    @Delete("/")
    delete(
        @Param("projectId") projectId: number,
        @Param("stageId") stageId: number,
        @Param("paperId") paperId: number,
    ) {
        if (projects.length <= projectId) return;

        projects.at(projectId)!.papers = projects
            .at(projectId)!
            .papers.filter((x) => !(x.stage == stageId && x.paper.id == paperId));
    }
}
