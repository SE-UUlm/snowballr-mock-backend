import "reflect-metadata";
import { Controller, createExpressServer, Get } from "routing-controllers";

@Controller()
export class MainController {
    @Get("/")
    get() {
        return "Hello World from Controllers!";
    }
}

const port = 3000;
const app = createExpressServer({
    controllers: [MainController],
});

app.listen(port, () => {
    return console.log(`Express is listening at http://localhost:${port}`);
});
