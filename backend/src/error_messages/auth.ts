import type { Response } from "express";

import type { ValidationFailure } from "../controllers/validation/auth.js";

// same {error: {code, message}} shape used by packs.ts and requireAuth, so clients only
// ever have to parse one thing.
const authErrors = {
    // carries the offending field so the frontend can highlight the right input
    invalidInputResponse: (res: Response, failure: ValidationFailure): Response => {
        return res.status(400).json({
            error: {
                code: "INVALID_INPUT",
                message: failure.message,
                field: failure.field,
            },
        });
    },

    malformedBodyResponse: (res: Response): Response => {
        return res.status(400).json({
            error: {
                code: "MALFORMED_BODY",
                message: "Request body must be JSON. Did you set Content-Type: application/json?",
            },
        });
    },

    usernameTakenResponse: (res: Response): Response => {
        return res.status(409).json({
            error: {
                code: "USERNAME_TAKEN",
                message: "Username already exists.",
            },
        });
    },

    // deliberately identical for "no such user" and "wrong password". telling them apart
    // would let anyone enumerate which usernames exist.
    invalidCredentialsResponse: (res: Response): Response => {
        return res.status(401).json({
            error: {
                code: "INVALID_CREDENTIALS",
                message: "Invalid username or password.",
            },
        });
    },
    
    unauthorizedResponse: (res: Response): Response => {
        return res.status(401).json({
            error: {
                code: "UNAUTHORIZED",
                message: "You must be logged in.",
            },
        });
    },

    forbiddenResponse: (res: Response): Response => {
        return res.status(403).json({
            error: {
                code: "FORBIDDEN",
                message: "You do not have permission to perform this action.",
            },
        });
    },

    failedLogoutResponse: (res: Response): Response => {
        return res.status(500).json({
            error: {
                code: "FAILED_LOGOUT",
                message: "Failed to logout.",
            },
        });
    },

    internalErrorResponse: (res: Response): Response => {
        return res.status(500).json({
            error: {
                code: "INTERNAL_ERROR",
                message: "Internal server error.",
            },
        });
    },
};

export { authErrors };
