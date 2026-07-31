// limits mirror the column widths in schema.sql. if these get out of sync the db raises
// 22001 (value too long) and the controller turns that into a 500, so keep them matched.
const USERNAME_MIN = 3;
const USERNAME_MAX = 50;   // users.username VARCHAR(50)
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 72;   // bcrypt silently ignores anything past 72 bytes
const CONTACT_INFO_MAX = 100; // users.contact_info VARCHAR(100)

// letters, numbers, underscore, hyphen, period. keeps usernames readable in urls and
// stops leading/trailing whitespace from making two accounts look identical.
const USERNAME_PATTERN = /^[A-Za-z0-9._-]+$/;

export type ValidationFailure = { field: string; message: string };

export const authValidation = {
    USERNAME_MIN,
    USERNAME_MAX,
    PASSWORD_MIN,
    PASSWORD_MAX,
    CONTACT_INFO_MAX,

    // bcrypt works on bytes, not characters, so a password of emoji hits the cap much
    // sooner than its .length suggests.
    passwordByteLength: (password: string): number => Buffer.byteLength(password, "utf8"),

    validateUsername: (username: unknown): ValidationFailure | null => {
        if (typeof username !== "string" || username.trim().length === 0) {
            return { field: "username", message: "Username is required." };
        }
        const trimmed = username.trim();
        if (trimmed.length < USERNAME_MIN || trimmed.length > USERNAME_MAX) {
            return {
                field: "username",
                message: `Username must be between ${USERNAME_MIN} and ${USERNAME_MAX} characters.`,
            };
        }
        if (!USERNAME_PATTERN.test(trimmed)) {
            return {
                field: "username",
                message: "Username may only contain letters, numbers, and . _ -",
            };
        }
        return null;
    },

    validatePassword: (password: unknown): ValidationFailure | null => {
        if (typeof password !== "string" || password.length === 0) {
            return { field: "password", message: "Password is required." };
        }
        if (password.length < PASSWORD_MIN) {
            return {
                field: "password",
                message: `Password must be at least ${PASSWORD_MIN} characters long.`,
            };
        }
        if (Buffer.byteLength(password, "utf8") > PASSWORD_MAX) {
            return {
                field: "password",
                message: `Password must be at most ${PASSWORD_MAX} bytes.`,
            };
        }
        return null;
    },

    // optional field, so undefined/null are fine. anything else must be a sane string.
    validateContactInfo: (contactInfo: unknown): ValidationFailure | null => {
        if (contactInfo === undefined || contactInfo === null) {
            return null;
        }
        if (typeof contactInfo !== "string") {
            return { field: "contactInfo", message: "Contact info must be a string." };
        }
        if (contactInfo.trim().length > CONTACT_INFO_MAX) {
            return {
                field: "contactInfo",
                message: `Contact info must be at most ${CONTACT_INFO_MAX} characters.`,
            };
        }
        return null;
    },

    // express.json() leaves req.body undefined when the request has no json content-type,
    // so every handler has to check this before destructuring or it throws a TypeError.
    isObjectBody: (body: unknown): body is Record<string, unknown> => {
        return typeof body === "object" && body !== null && !Array.isArray(body);
    },

    rejectUnknownKeys: (
        body: Record<string, unknown>,
        allowed: string[],
    ): ValidationFailure | null => {
        const unknown = Object.keys(body).filter((key) => !allowed.includes(key));
        if (unknown.length > 0) {
            return {
                field: unknown[0] as string,
                message: `Unexpected field(s): ${unknown.join(", ")}.`,
            };
        }
        return null;
    },
};
