import { Body, Delete, Get, JsonController, Param, Post, Put } from "routing-controllers";
import { criteria } from "./Data";
import { CriterionSpec } from "./Models";

@JsonController("/projects/:projectId/criteria")
export class CriterionController {
    @Get("/")
    getAll(@Param("projectId") projectId: number) {
        return criteria.get(projectId) ?? [];
    }

    @Post("/")
    create(@Param("projectId") projectId: number, spec: CriterionSpec) {
        if (criteria.has(projectId)) {
            const existing = criteria.get(projectId)!;
            criteria.set(
                projectId,
                existing.concat({
                    id: existing.length,
                    ...spec,
                }),
            );
        } else {
            criteria.set(projectId, [
                {
                    id: 0,
                    ...spec,
                },
            ]);
        }

        return criteria.get(projectId)!;
    }

    @Delete("/:criterionId")
    delete(@Param("projectId") projectId: number, @Param("criterionId") criterionId: number) {
        if (!criteria.has(projectId)) return;

        criteria.set(
            projectId,
            criteria.get(projectId)!.filter((x) => x.id != criterionId),
        );
    }

    @Put("/:criterionId")
    update(
        @Param("projectId") projectId: number,
        @Param("criterionId") criterionId: number,
        @Body() newSpec: CriterionSpec,
    ) {
        if (!criteria.has(projectId) || criteria.get(projectId)!.length <= criterionId) return;

        criteria.get(projectId)![criterionId] = {
            ...criteria.get(projectId)![criterionId],
            ...newSpec,
        };

        return criteria.get(projectId)![criterionId];
    }
}
