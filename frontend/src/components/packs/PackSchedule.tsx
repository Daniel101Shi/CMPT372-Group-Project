import React from "react";
import { type Pack } from "../../types/Pack";
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { mockPackMembers } from "../../mockData/mockPacks";
import "./packs.css";

// type PackScheduleProps = {
//     pack: Pack;
// };

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const timeSlots = Array.from({length: 48}, (_, index) =>{
    const totalMinutes = index*30;
    const hours = Math.floor(totalMinutes/60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
});


const defaultSchedule = Array.from(
    { length: 48 },
    ()=> Array(7).fill(2)
)


export function PackSchedule({}){
    const getCellAvailability = (cell: number) : string =>{
        if(cell == 2) return "blank";
        return(cell == 1 ? "available" : "unavailable")
    }
    const renderCells = (row, rowIndex)=>{
        return(
            row.map((cell, colIndex)=>{
                return(
                    <div key = {`${rowIndex}-${colIndex}`} className = {`heatmap-cell ${getCellAvailability(cell)}`}>
                    </div>
                )
            })
        )
    }
    
    const renderCellRows = () : React.JSX.Element =>{
        return(
            <React.Fragment>
                {days.map((day, index)=>(<div key = {index} className = "day-heading">{day}</div>))}
                {defaultSchedule.map((row, rowIndex)=>{
                    return(
                    <React.Fragment key = {rowIndex}>
                        <div className = "time-label">{timeSlots[rowIndex]}</div>
                        {renderCells(row, rowIndex)}
                    </React.Fragment>
                    )
                })}
            </React.Fragment>
        )
    }
    const renderPackMembers = ()=>{
        return(
            mockPackMembers.map((member)=>{
                return(
                    <div>{member.username}</div>
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
                {renderCellRows()}
            </div>
            {<div className="pack-members">Pack Members: {renderPackMembers()}</div>}
        </div>
    )
}