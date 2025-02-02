import { Body, Get, JsonController, Param, Post, Put } from "routing-controllers";
import { papers } from "./Data";
import { PaperSpec } from "./Models";

@JsonController("/papers")
export class PaperController {
    @Get("/")
    getAll() {
        return papers;
    }

    @Post("/")
    create(@Body() spec: PaperSpec) {
        papers.push({
            id: papers.length,
            ...spec,
        });
        return papers.at(-1)!;
    }

    @Get("/:id")
    getOne(@Param("id") id: number) {
        return papers.at(id);
    }

    @Put("/:id")
    update(@Param("id") id: number, newSpec: PaperSpec) {
        if (papers.length <= id) return;

        papers[id] = {
            ...papers[id],
            ...newSpec,
        };

        return papers[id];
    }

    @Get("/:id/forward-refs")
    getForwardRefs(@Param("id") id: number) {
        return papers
            .at(id)
            ?.forwardReferencedPaperIds?.filter((x) => papers.length <= x)
            ?.map((x) => papers[x]);
    }

    @Get("/:id/backward-refs")
    getBackwardRefs(@Param("id") id: number) {
        return papers
            .at(id)
            ?.backwardReferencedPaperIds?.filter((x) => papers.length <= x)
            ?.map((x) => papers[x]);
    }
}
