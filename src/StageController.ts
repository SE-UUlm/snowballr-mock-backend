import { Body, Get, JsonController, Param, Post } from "routing-controllers";
import { papers, projects } from "./Data";
import { PaperDecision } from "./Models";

@JsonController("/projects/:projectId/stages/:stageId")
export class StageController {
  @Get("/papers")
  getAll(@Param("projectId") projectId: number, @Param("stageId") stageId: number) {
    return projects
      .at(projectId)
      ?.papers
      ?.filter(paper => paper.stage == stageId)
  }

  @Post("/papers")
  addPaper(@Param("projectId") projectId: number, @Param("stageId") stageId: number, @Body() paperId: number) {
    projects.at(projectId)?.papers.push({
        stage: stageId,
        paper: papers[paperId],
        status: "",
        decision: PaperDecision.Included,
    })
  }
}
