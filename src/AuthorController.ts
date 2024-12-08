import { Body, Get, JsonController, Param, Post, Put } from "routing-controllers";
import { authors } from "./Data";
import { AuthorSpec } from "./Models";

@JsonController("/authors")
export class AuthorController {
  @Get("/")
  getAll() {
    return authors;
  }

  @Get("/:id")
  getOne(@Param("id") id: number) {
    return authors.at(id);
  }

  @Post("/")
  create(@Body() spec: AuthorSpec) {
    authors.push({
        id: authors.length,
        ...spec,
    });
    return authors.at(-1)!;
  }

  @Put("/:id")
  update(@Param("id") id: number, newSpec: AuthorSpec) {
    if (authors.length <= id)
      return;

    authors[id] = {
      ...authors[id],
      ...newSpec,
    };

    return authors[id];
  }
}
