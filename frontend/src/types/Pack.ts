export type PackID = number;

//representation of a pack
export interface Pack{
    pack_id: number,
    owner_id: number, 
    group_name: string,
    semester: string,
    year: number
};

//representation of a user in a Pack, where we only care for their packid and userid
export interface PackMember{
    pack_id: number,
    user_id: number
};

export interface NamedPackMember{
    pack_id: number,
    user_id: number,
    username: string,
};

export interface Friend{
    user_id: number,
    username: string,
};

