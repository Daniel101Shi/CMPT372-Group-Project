import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {type Pack, type PackMember, type Friend} from "../../types/Pack";
import { type UserInfo } from "../../types/User";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container"
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { PackSchedule } from "./PackSchedule";
import { CreatePack } from "./CreatePack";
import { useAuth } from "../../context/AuthContext";
import { SemestersContextProvider } from "../schedule-builder/SFUCoursesAPISurface/semestersContext";
import { YearsContextProvider } from "../schedule-builder/SFUCoursesAPISurface/yearsContext";
import { useSemestersContext } from "../schedule-builder/SFUCoursesAPISurface/semestersContext";
import { useYearsContext } from "../schedule-builder/SFUCoursesAPISurface/yearsContext";
import "./packs.css"

type PackPageProps = {
    packs: Pack[];
};


const defaultPack : Pack = {
    pack_id: -1,
    owner_id: -1, 
    group_name: "",
    semester: "string",
    year: 0
};

interface CompletePack{
    pack: Pack,
    members: UserInfo[]
};

const defaultCPack : CompletePack = {
    pack: defaultPack,
    members: []
}

export function PackPage(){

    const [semester, setSemester] = useState<string>("None");

    const [year, setYear] = useState<number>(0);

    const [packs, setPacks] = useState<Pack[]>([]);

    const [createPack, setCreatePack] = useState<Boolean>(false);

    //matters if createPack is false
    const [chosenPack, setChosenPack] = useState<CompletePack>(defaultCPack);


    const { user, loading} = useAuth();

    useEffect(()=>{
        fetchPacks();
    },[])
    

    useEffect(() => {
        console.log("semester changed:", semester);
        console.log("year changed:", year);
      }, [semester, year]);

    const createNewPack = async(group_name : string, members : Friend[])=>{
        console.log("createNewPack called");
        try{
            if(group_name == "" || members.length == 0 || semester == "None" || year == 0)
                return;
            if(loading)
                return;
            if(!user)
                return;
            const friends : number[] = members.map((member)=> member.user_id);
            const new_pack : Pack = {
                pack_id: 0,
                owner_id: user.user_id, 
                group_name: group_name,
                semester: semester,
                year: year
            };

            console.log(new_pack);
            console.log(friends);

            const response : Response = await fetch(`http://localhost:3001/api/packs/create-pack`, {
                method: "POST",
                headers: {
                    "Content-Type" : "application/json",
                },
                body: JSON.stringify({new_pack, friends})
            });

            if(!response.ok){
                const data = await response.json();
                throw new Error(`${data.message}`);
            }

            const data = await response.json();
            if(typeof data.pack !== "object" || data.pack === null){
                throw new Error("Invalid: pack should be a non-null object");
            }
            
            const created_pack = data.pack as Pack;
            setPacks([...packs, created_pack]);
            setCreatePack(false);


        }catch(error){
            if(error instanceof Error){
                console.error(error.message);
            } else{
                console.error("Unknown error occured");
            }
        }
    }

    const fetchPackData = async(pack : Pack)=>{
        try{
            const owner_id = user.user_id;
            const pack_id = pack.pack_id;
            const response = await fetch(`http://localhost:3001/api/packs/get-pack-data/${owner_id}/${pack_id}`, {
                method: "GET"
            });

            const data = await response.json();

            if(!response.ok){
                throw new Error(data.message);
            }
            const members : UserInfo[] = data.pack_data; 
            const newCPack = {
                pack: pack,
                members: members
            };
            setChosenPack(newCPack);
            console.log(newCPack);
        }catch(error){
            if(error instanceof Error){
                console.error(error.message);
            } else{
                console.error("Unknown error occured");
            }
        }
    }
    
    const fetchPacks = async()=>{
        try{
            if(loading)
                return;
            if(!user)
                return;

            const owner_id = user.user_id;
            const response : Response = await fetch(`http://localhost:3001/api/packs/get-packs/${owner_id}`, {
                method: "GET"
            });
            if(!response.ok){
                const data = await response.json();
                throw new Error(`${data.message}`)
            }
        
            const data = await response.json();
            if(!Array.isArray(data.packs))
                throw new Error("Invalid response: packs isn't an array");

            setPacks(data.packs);  
            
        }catch(error){
            if(error instanceof Error){
                console.error(error.message);
            } else{
                console.error("Unknown error occured");
            }
        }
        
    }
    

    const renderPacks = ()=>{
        return(
            <div className = "PacksContainer">
                {packs?.map((pack : Pack, index)=>{
                    const isSelected = chosenPack?.pack?.pack_id === pack.pack_id;
                    return(
                        <Card key={index} className = "PackCard" style={{ width: '18rem' }}>
                            <Card.Body>
                                <Card.Title>{pack.group_name}</Card.Title>
                                <Card.Text>
                                    {pack.semester} {pack.year}
                                </Card.Text>
                                
                                <Button style={{
                                   boxShadow: isSelected ? "none" : "0 4px 0 #4a2600",                               
                                   transform: isSelected ? "translateY(4px)" : "translateY(0)",                             
                                   transition: "transform 0.05s, box-shadow 0.05s",
                                }} onClick={()=>{fetchPackData(pack)}} variant="primary">Pack Schedule</Button>
                            </Card.Body>
                    </Card>
                )})}
            </div>
        )
    }


    // function mergeSchedules(original: Cell[][], new_sched: Schedule){
    //     original.forEach((row, row_index) =>{
    //         row.forEach((col, col_index) =>{
    //             const cell : Cell = original[row_index][col_index];
    //             const sched_cell = new_sched.grid[row_index][col_index] as 0 | 1 | 2;
    //             if(sched_cell == 1)
    //                 cell.users.push(new_sched.user_id);
    //         })
    //     })
    // }

    // const createAggregateSchedule = () : void => {
    //     const schedules : Schedule[] = members.map((member)=>{
    //         return(scheduleStringToGrid(member.user_id, member.campus_schedule))
    //     })
    //     const original : Cell[][] = getDefaultGrid();

    //     members.forEach((member)=>{
    //         const current_schedule : Schedule = scheduleStringToGrid(member.user_id, member.campus_schedule);
    //         mergeSchedules(original, current_schedule);
    //     });

    //     setSchedule(original);
    // }

    return(
        <YearsContextProvider>
            <SemestersContextProvider>
                <div className = "PackPage">
                    <Container className="page-container">
                        <Row>
                            <Col className="d-flex flex-column" xs={12} md={12} lg={4} xl={6}>
                                    {createPack || packs.length == 0 ? <CreatePack semester={semester} year={year} setSemester={setSemester} setYear={setYear} createNewPack={createNewPack}/> : renderPacks()}
                                    {packs.length == 0 ? <div/> : <Button onClick={()=>setCreatePack(!createPack)} className="toggle-create-view-packs align-self-center" size="sm">{createPack ? "View packs" : "Create Pack"}</Button>}
                            </Col>
                            <Col xs={12} md={12} lg={8} xl={6}><PackSchedule pack={chosenPack.pack} members={chosenPack.members}/></Col>
                        </Row>
                    </Container>
                </div>
            </SemestersContextProvider>
        </YearsContextProvider>
    )
}