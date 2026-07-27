import React, { useState, useEffect} from "react";
import { Link } from "react-router-dom";
import { type User, type Pack } from "../../types/Pack";
import { type UserInfo } from "../../types/User";
import { type ScheduleCell, type Schedule, type Cell} from "../../types/Schedule";
import AvailabilityModal from "./AvailabilityModal";
import { Button, Card } from "react-bootstrap";
import "./packs.css";



const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];


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

interface ModalData{
    members: User[],
    date: string
}

type PackScheduleProps = {
    pack: Pack;
    members: UserInfo[];
    clearChosenPack: ()=>void
};




export function PackSchedule({pack, members, clearChosenPack} : PackScheduleProps){
    
    const [schedule, setSchedule] = useState<ScheduleCell[][]>(defaultGrid);
    const [modal, setModal] = useState<ModalData>({
        members: [],
        date: ""
    });

    useEffect(() => {
        setModal({
            members: [],
            date: ""
        });
        createAggregateSchedule();
      }, [members]);

    const scheduleStringToGrid = (user : User, schedule_str: string) : Schedule =>{
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
            user: user,
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
        try{
            original.forEach((row, row_index) =>{
                for(const col_index in row){
                    const cell : Cell = original[row_index][col_index];
                    const sched_cell = new_sched.grid[row_index][col_index] as 0 | 1 | 2;
                    if(sched_cell == 1)
                        cell.users.push(new_sched.user);
                }
            })

        }catch(error){
            if (error instanceof Error) {
                console.error(error.message);
            } else {
                console.error("Unknown error occured");
            }
        }
    }

    const createAggregateSchedule = () : void => {
        const original : Cell[][] = getDefaultGrid();
        try{
            members.forEach((member)=>{
                const new_member : User = {
                    user_id: member.user_id,
                    username: member.username
                }
                const current_schedule : Schedule = scheduleStringToGrid(new_member, member.campus_schedule);
                mergeSchedules(original, current_schedule);
            });

            setSchedule(original);
        }catch(error){
            if (error instanceof Error) {
                console.error(error.message);
            } else {
                console.error("Unknown error occured");
            }
        }
    }


    const handleModal = (members: User[], date : string)=>{
        setModal({
            members: members,
            date: date
        })
    }


    const renderCells = (row : ScheduleCell[], rowIndex : number)=>{
        return(
            row.map((cell : ScheduleCell, colIndex : number)=>{
                const schedule_cell = cell as Cell;
                const free_users : User[] = schedule_cell.users;
                const availablity = free_users.length/members.length;
                const hue = availablity*120;

                const color : string = hue == 0 ? "grey" : `hsl(${hue}, 70%, 50%)`;
                const date : string = `${days[colIndex]} at ${timeSlots[rowIndex]}`;
                return(
                    <div 
                        key = {`${rowIndex}-${colIndex}`} 
                        onClick = {() => handleModal(free_users, date)}
                        className = "heatmap-cell"
                        style={{
                            backgroundColor: color,
                          }}
                        >
                    </div>
                )
            })
        )
    }

    const renderDefaultCells = (row : ScheduleCell[], rowIndex : number)=>{
        
        return(
            row.map((_ : ScheduleCell, colIndex : number)=>{
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

                    <div key={index}>
                        <Link 
                          className="text-decoration-none rounded-pill px-2 py-1 fw-semibold border shadow-sm"
                          to={`/userprofile/${member.user_id}`}
                        >
                            {member.username}
                        </Link>
                    </div>
                )
            })  
        )
    }

    //AI assistance was used below to help with bootstrap styling
    return (
        <Card className="position-relative h-100 border-0 rounded-4 shadow overflow-hidden">
          <Card.Header className="bg-white border-0 px-4 pt-4 pb-2">
            <div className="d-flex justify-content-between align-items-center gap-3">
              <div>
                <h2 className="fw-bold mb-1">
                  {pack.pack_id !== -1 ? pack.group_name : "Pack Schedule"}
                </h2>
      
                <p className="text-secondary mb-0">
                  {pack.pack_id !== -1
                    ? "Compare everyone’s availability."
                    : "Choose a pack to view its shared schedule."}
                </p>
              </div>
      
              {pack.pack_id !== -1 && (
                <Button 
                  variant="outline-danger"
                  size="sm"
                  className="text-nowrap"
                  onClick={clearChosenPack}
                >
                  Clear schedule
                </Button>
              )}
            </div>
          </Card.Header>
      
          <Card.Body
            className="d-flex flex-column gap-3 p-4 pt-3 bg-light"
            style={{ minHeight: 0 }}
          >
            <div
              className="schedule-heatmap-grid flex-grow-1 overflow-auto bg-white border rounded-4 p-3 shadow-sm"
              style={{
                minHeight: 0,
                gridTemplateColumns: `70px repeat(${days.length}, 1fr)`,
              }}
            >
              <div />
      
              {pack.pack_id === -1
                ? renderCellRows(defaultGrid)
                : renderCellRows(schedule)}
            </div>
      
            {pack.pack_id !== -1 && (
              <div className="bg-white border rounded-3 px-3 py-2 shadow-sm">
                <div className="d-flex flex-wrap align-items-center gap-2">
                  <span className="fw-semibold text-secondary">
                    Pack members:
                  </span>
      
                  <div className="d-flex flex-wrap gap-2">
                    {renderPackMembers()}
                  </div>
                </div>
              </div>
            )}
          </Card.Body>
      
          {modal.date.length !== 0 && (
            <AvailabilityModal
              members={modal.members}
              date={modal.date}
              setModal={setModal}
            />
          )}
        </Card>
      );
}