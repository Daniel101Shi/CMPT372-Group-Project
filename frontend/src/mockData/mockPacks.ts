import { type Pack, type PackMember } from "../types/Pack";

export const mockPackMembers: PackMember[] = [
    {
        user_id: 1,
        username: "Johny"
    },
    {
        user_id: 2,
        username: "Tim"
    },
    {
        user_id: 3,
        username: "Leah"
    },
    {
        user_id: 4,
        username: "Matthew"
    },
    {
        user_id: 5,
        username: "Don"
    }
];
export const mockPacks: Pack[] = [
    {
      pack_id: 1,
      owner_id: 101,
      group_name: "Fall Study Group",
      semester: "Fall",
      year: 2026,
    },
    {
      pack_id: 2,
      owner_id: 102,
      group_name: "CMPT 225 Crew",
      semester: "Spring",
      year: 2027,
    },
    {
      pack_id: 3,
      owner_id: 101,
      group_name: "Exam Prep Pack",
      semester: "Summer",
      year: 2026,
    },
    {
      pack_id: 4,
      owner_id: 103,
      group_name: "Software Project Team",
      semester: "Fall",
      year: 2026,
    },
    {
      pack_id: 5,
      owner_id: 104,
      group_name: "Database Study Group",
      semester: "Spring",
      year: 2027,
    },
  ];