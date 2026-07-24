import React, { useState, useEffect} from "react";
import { type Pack } from "../../types/Pack";
import { type UserInfo } from "../../types/User";
import { type ScheduleCell, type Schedule, type Cell} from "../../types/Schedule";
import "./packs.css";



const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const colors : string[] = ["green", "blue", "yellow", "cyan", ];

export const greens: string[] = [
    "#0B3D2E", // dark forest green
    "#146B3A", // deep green
    "#2E8B57", // sea green
    "#55A630", // vivid leaf green
    "#80B918", // yellow-green
    "#B7E4C7", // pale mint green
];

const timeSlots = Array.from({length: 48}, (_, index) =>{
    const totalMinutes = index*30;
    const hours = Math.floor(totalMinutes/60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
});


const defaultGrid = Array.from(
    { length: 48 },
    ()=>
        Array.from({length: 7 }, (): Cell => ({
            users: []
        }))
) as Cell[][]

type PackScheduleProps = {
    pack: Pack;
    members: UserInfo[];
};

export function PackSchedule({pack, members} : PackScheduleProps){
    
    const [schedule, setSchedule] = useState<ScheduleCell[][]>(defaultGrid);


    useEffect(() => {
        createAggregateSchedule();
      }, [members]);

    const scheduleStringToGrid = (user_id : number, schedule_str: string) : Schedule =>{
        if(schedule_str.length !== 336)
            throw new Error("Schedule must contain exactly 336 characters.");

        const rows = 48;
        const columns = 7;
        const scheduleGrid: ScheduleCell[][] = Array.from({length: rows}, (_, row) : ScheduleCell[] =>
            Array.from({length: columns}, (_, col)  : ScheduleCell => {
                const index = row*7 + col;
                const cell = Number(schedule_str[index]) as ScheduleCell;
                if(cell !== 0 && cell !== 1 && cell !== 2)
                    throw new Error(`Invalid schedule value at index ${index}.`);
                return cell;
            })
        )
        const new_schedule : Schedule = {
            user_id: user_id,
            grid: scheduleGrid
        }
        return new_schedule;
    }

    function getDefaultGrid() : Cell[][]{
        return(
            Array.from(
                { length: 48 },
                ()=>
                    Array.from({length: 7 }, (): Cell => ({
                        users: []
                    }))
            ) as Cell[][]
        );
    }

    function mergeSchedules(original: Cell[][], new_sched: Schedule){
        original.forEach((row, row_index) =>{
            row.forEach((col, col_index) =>{
                const cell : Cell = original[row_index][col_index];
                const sched_cell = new_sched.grid[row_index][col_index] as 0 | 1 | 2;
                if(sched_cell == 1)
                    cell.users.push(new_sched.user_id);
            })
        })
    }

    const createAggregateSchedule = () : void => {
        const original : Cell[][] = getDefaultGrid();

        members.forEach((member)=>{
            const current_schedule : Schedule = scheduleStringToGrid(member.user_id, member.campus_schedule);
            mergeSchedules(original, current_schedule);
        });

        setSchedule(original);
    }



    const getCellAvailability = (cell: number) : string =>{
        if(cell == 2) return "blank";
        return(cell == 1 ? "available" : "unavailable")
    }

    const renderCells = (row, rowIndex)=>{
        return(
            row.map((cell, colIndex)=>{
                const schedule_cell = cell as Cell;
                const free_users : number = schedule_cell.users.length;
                const availablity = free_users/members.length;
                const hue = availablity*120;
                return(
                    <div 
                        key = {`${rowIndex}-${colIndex}`} 
                        className = "heatmap-cell"
                        style={{
                            backgroundColor: `hsl(${hue}, 70%, 50%)`,
                          }}
                        >
                    </div>
                )
            })
        )
    }

    const renderDefaultCells = (row, rowIndex)=>{
        return(
            row.map((cell, colIndex)=>{
                return(
                    <div 
                        key = {`${rowIndex}-${colIndex}`} 
                        className = "heatmap-cell blank"
                        >
                    </div>
                )
            })
        )
    }
    
    const renderCellRows = (grid : ScheduleCell[][]) : React.JSX.Element =>{
        return(
            <React.Fragment>
                {days.map((day, index)=>(<div key = {index} className = "day-heading">{day}</div>))}
                {grid.map((row, rowIndex)=>{
                    return(
                    <React.Fragment key = {rowIndex}>
                        <div className = "time-label">{timeSlots[rowIndex]}</div>
                        {pack.pack_id == -1 ? renderDefaultCells(row, rowIndex) : renderCells(row, rowIndex)}
                    </React.Fragment>
                    )
                })}
            </React.Fragment>
        )
    }
    const renderPackMembers = ()=>{
        return(
            members.map((member, index)=>{
                return(
                    <div key={index}>{member.username}</div>
                )
            })  
        )
    }
    return(
        <div className = "PackSchedule">
            <div className = "schedule-heatmap-grid" style = {{
                gridTemplateColumns: `70px repeat(${days.length}, 1fr)`,
            }}>
                <div/>
                {pack.pack_id == -1 ? renderCellRows(defaultGrid) : renderCellRows(schedule)}
            </div>
            {<div className="pack-members">Pack Members: {renderPackMembers()}</div>}
        </div>
    )
}