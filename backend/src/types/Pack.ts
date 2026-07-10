
export type PackID = number;

//representation of a pack
export interface Pack{
    pack_id: number,
    owner_id: number, 
    group_name: string,
    semester: string,
    year: number
};

//representation of a user in a Pack, where we only care for their id, and username
export interface PackMember{
    user_id: number,
    username: string,
};