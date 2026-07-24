import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {type Pack, type PackMember, type Friend} from "../../types/Pack";
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
}

export function PackPage(){
    const sem_data = useSemestersContext();
    const year_data = useYearsContext();
    const [semester, setSemester] = useState<string>("None");

    const [year, setYear] = useState<number>(0);

    const [packs, setPacks] = useState<Pack[]>([]);

    const [createPack, setCreatePack] = useState<Boolean>(false);

    //matters if createPack is false
    const [chosenPack, setChosenPack] = useState<Pack>(defaultPack);

    const { user, loading} = useAuth();

    useEffect(()=>{
        fetchPacks();
    },[])
    // useEffect(() => {
    //     if(!sem_data.isloading && sem_data.data.length > 0){
    //         console.log("setting semester to:", sem_data.data[0]);
    //         setSemester(sem_data.data[0]);
    //     }
    // }, [sem_data.isloading, sem_data.data]);

    // useEffect(() => {
    //     if(!year_data.isloading && year_data.data.length > 0){
    //         setYear(Number(year_data.data[0]));
    //     }
    // }, [year_data.isloading, year_data.data]);

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
                {packs?.map((pack : Pack, index)=>
                    <Card key={index} className = "PackCard" style={{ width: '18rem' }}>
                        <Card.Body>
                            <Card.Title>{pack.group_name}</Card.Title>
                            <Card.Text>
                                {pack.semester} {pack.year}
                            </Card.Text>
                            <Button variant="primary">Pack Schedule</Button>
                        </Card.Body>
                </Card>
                )}
            </div>
        )
    }

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
                            <Col xs={12} md={12} lg={8} xl={6}><PackSchedule/></Col>
                        </Row>
                    </Container>
                </div>
            </SemestersContextProvider>
        </YearsContextProvider>
    )
}