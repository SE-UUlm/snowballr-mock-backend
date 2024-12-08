import { Body, Get, JsonController, Param, Post } from "routing-controllers";
import { papers, projects } from "./Data";

@JsonController("/projects/:projectId/stages/:stageId")
export class StageController {
  @Get("/")
  getAll(@Param("projectId") projectId: number, @Param("stageId") stageId: number) {
    return projects
      .at(projectId)
      ?.papers
      ?.filter(paper => paper.stage == stageId)
      ?.map(x => x.paper);
  }

  @Post("/")
  addPaper(@Param("projectId") projectId: number, @Param("stageId") stageId: number, @Body() paperId: number) {
    projects.at(projectId)?.papers.push({
        stage: stageId,
        paper: papers[paperId],
        reviews: [],
    })
  }
}
