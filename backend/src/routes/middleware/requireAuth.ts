import { type NextFunction, type Request, type Response} from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction): void{
    if(!req.session.userId){
        res.status(401).json({
            error: {
                code: "UNAUTHORIZED",
                message: "You must be logged in."
            }
        })
        return;
    }
    next();
}