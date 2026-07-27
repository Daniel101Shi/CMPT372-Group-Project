import { type User } from "./Pack";
export type Cell = {
   users: User[]
};

export type ScheduleCell = Cell | 0 | 1 | 2;

export interface Schedule{
    user: User;
    grid: ScheduleCell[][];
};

