import { isRole, type Role } from "../../types/User.js";

export const adminValidation = {
    // route params always arrive as strings, so "abc" -> NaN and "1.5" -> 1.5 both have to
    // fail here rather than reaching the query.
    isValidUserId: (user_id: number): boolean => {
        return Number.isInteger(user_id) && user_id > 0;
    },

    isValidRole: (role: unknown): role is Role => {
        return isRole(role);
    },
};
