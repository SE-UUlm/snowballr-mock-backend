import "reflect-metadata";
import { createExpressServer } from "routing-controllers";
import { GlobalProjectController, ProjectController } from "./ProjectController";
import { AuthorController } from "./AuthorController";
import { CriterionController } from "./CriterionController";
import { StageController } from "./StageController";
import { StageEntryController } from "./StageEntryController";
import { PaperController } from "./PaperController";
import { GlobalUserController, UserController } from "./UserController";
import { CorsMiddleware } from "./Middleware";

const port = 3000;
const app = createExpressServer({
    controllers: [
        GlobalProjectController,
        ProjectController,
        AuthorController,
        CriterionController,
        GlobalProjectController,
        StageController,
        StageEntryController,
        PaperController,
        GlobalUserController,
        UserController,
    ],
    middlewares: [CorsMiddleware],
});

app.listen(port, () => {
    return console.log(`Express is listening at http://localhost:${port}`);
});
