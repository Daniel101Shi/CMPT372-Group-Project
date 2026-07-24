export type Cell = {
   users: number[]
};

export type ScheduleCell = Cell | 0 | 1 | 2;

export interface Schedule{
    user_id: number;
    grid: ScheduleCell[][];
};

