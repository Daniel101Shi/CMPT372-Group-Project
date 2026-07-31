export interface UserInfo{
    user_id: number,
    username: string,
    contact_info: string,
    campus_schedule: string,
    created_at: Date
};

// must match the chk_valid_role constraint on users.role in schema.sql
export type Role = "user" | "admin";

export const ROLES: Role[] = ["user", "admin"];

export const isRole = (value: unknown): value is Role =>
    typeof value === "string" && (ROLES as string[]).includes(value);