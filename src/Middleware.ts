import { ExpressMiddlewareInterface, Middleware } from "routing-controllers";

@Middleware({ type: "before" })
export class CorsMiddleware implements ExpressMiddlewareInterface {
    use(req: any, res: any, next: (err?: any) => any): void {
        res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
        res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        next();
    }
}
