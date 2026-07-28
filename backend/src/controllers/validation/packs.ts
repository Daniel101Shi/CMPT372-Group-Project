import { type PackID, type Pack } from "../../types/Pack.js";

const isValidUserId = async (user_id: number): Promise<boolean> => {
    if (!Number.isInteger(user_id) || user_id <= 0) {
        return false;
    }
    return true;
}

export const packValidation = {
    isValidUserId: async (user_id: number): Promise<boolean> => {
        if (!Number.isInteger(user_id) || user_id <= 0) {
            return false;
        }
        return true;
    },

    areValidUserIds: async (users: number[]): Promise<boolean> => {
        for (const user of users) {
            if (!isValidUserId(user))
                return false;
        }
        return true;
    },

 isValidPackId: async (pack_id: PackID): Promise<boolean> => {
        if (!Number.isInteger(pack_id) || pack_id <= 0) {
            return false;
        }
        return true;
    },


 validateCreatePackInput: async (new_pack: Pack): Promise<boolean> => {
        const owner_id = new_pack.owner_id as number;
        const group_name = new_pack.group_name as string;
        const semester = new_pack.semester as string;
        const year = new_pack.year as number;

        if (
            !isValidUserId(owner_id)
            || group_name.trim() === ""
            || semester === ""
            || year === 0
        ) {
            return false;
        }
        return true;
    }
}