import type { Response } from "express";

import { ROLES } from "../types/User.js";

const adminErrors = {
    invalidUserIdResponse: (res: Response): Response => {
        return res.status(400).json({
            error: {
                code: "INVALID_USER_ID",
                message: "userId must be a positive integer.",
            },
        });
    },

    invalidRoleResponse: (res: Response): Response => {
        return res.status(400).json({
            error: {
                code: "INVALID_ROLE",
                message: `role must be one of: ${ROLES.join(", ")}.`,
            },
        });
    },

    userNotFoundResponse: (res: Response): Response => {
        return res.status(404).json({
            error: {
                code: "USER_NOT_FOUND",
                message: "No user was found with the provided userId.",
            },
        });
    },

    // demoting or deleting the only admin would leave nobody able to administer the system,
    // and no endpoint exists to promote someone back. 409 because the request is well formed,
    // it just conflicts with the current state of the data.
    lastAdminResponse: (res: Response): Response => {
        return res.status(409).json({
            error: {
                code: "LAST_ADMIN",
                message: "Cannot remove the last remaining admin.",
            },
        });
    },

    cannotDeleteSelfResponse: (res: Response): Response => {
        return res.status(409).json({
            error: {
                code: "CANNOT_DELETE_SELF",
                message: "Admins cannot delete their own account.",
            },
        });
    },

    failedListUsersResponse: (res: Response): Response => {
        return res.status(500).json({
            error: {
                code: "FAILED_LIST_USERS",
                message: "Failed to list users.",
            },
        });
    },

    failedUpdateRoleResponse: (res: Response): Response => {
        return res.status(500).json({
            error: {
                code: "FAILED_UPDATE_ROLE",
                message: "Failed to update user role.",
            },
        });
    },

    failedDeleteUserResponse: (res: Response): Response => {
        return res.status(500).json({
            error: {
                code: "FAILED_DELETE_USER",
                message: "Failed to delete user.",
            },
        });
    },
};

export { adminErrors };
