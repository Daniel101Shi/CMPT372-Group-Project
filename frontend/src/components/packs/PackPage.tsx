import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { type Pack, type Friend, type PackID} from "../../types/Pack";
import { type UserInfo } from "../../types/User";
import { Row, Col, Container, Card, Button } from "react-bootstrap"
import { PackSchedule } from "./PackSchedule";
import { CreatePack } from "./CreatePack";
import { useAuth } from "../../context/AuthContext";
import { SemestersContextProvider } from "../schedule-builder/SFUCoursesAPISurface/semestersContext";
import { YearsContextProvider } from "../schedule-builder/SFUCoursesAPISurface/yearsContext";
import "./packs.css"
import EditPackInfo from "./EditPackInfo";

const defaultPack: Pack = {
    pack_id: -1,
    owner_id: -1,
    group_name: "",
    semester: "string",
    year: 0
};

interface CompletePack {
    pack: Pack,
    members: UserInfo[]
};

const defaultCPack: CompletePack = {
    pack: defaultPack,
    members: []
}

export function PackPage() {
    const [chosenEditPack, setChosenEditPack] = useState<Pack>(defaultPack);

    const [editPack, setEditPack] = useState<boolean>(false);

    const [semester, setSemester] = useState<string>("None");

    const [year, setYear] = useState<number>(0);

    const [packs, setPacks] = useState<Pack[]>([]);

    const [createPack, setCreatePack] = useState<Boolean>(false);

    //matters if createPack is false
    const [chosenPack, setChosenPack] = useState<CompletePack>(defaultCPack);


    const { user, loading } = useAuth();

    useEffect(() => {
        fetchPacks();
    }, [])

 




    const clearChosenPack = ()=>{
        setChosenPack(defaultCPack);
    }

    const createNewPack = async (group_name: string, members: Friend[]) => {
        try {
            if (group_name === "" || semester === "None" || year === 0){
                toast.error("Please fill out all required fields.");
                return;
            }
            if(members.length === 0){
                toast.error("At least one other pack member is necessary.");
            }
            if (loading)
                return;
            if (!user)
                return;
            const friends: number[] = members.map((member) => member.user_id);
            const new_pack: Pack = {
                pack_id: 0,
                owner_id: user.user_id,
                group_name: group_name,
                semester: semester,
                year: year
            };

            const response: Response = await fetch(`http://localhost:3001/api/packs/create-pack`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ new_pack, friends })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(`${data.message}`);
            }

            const data = await response.json();
            if (typeof data.pack !== "object" || data.pack === null) {
                throw new Error("Invalid: pack should be a non-null object");
            }

            const created_pack = data.pack as Pack;
            setPacks([...packs, created_pack]);
            setCreatePack(false);


        } catch (error) {
            if (error instanceof Error) {
                console.error(error.message);
            } else {
                console.error("Unknown error occured");
            }
        }
    }

    const fetchPackData = async (pack: Pack) => {
        try {
            if (loading)
                return;
            if (!user)
                return;
            const owner_id = user.user_id;
            const pack_id = pack.pack_id;

            if (pack_id == chosenPack.pack.pack_id) {
                return;
            }
            const response = await fetch(`http://localhost:3001/api/packs/get-pack-data/${owner_id}/${pack_id}`, {
                method: "GET"
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message);
            }
            const members: UserInfo[] = data.pack_data;
            const newCPack = {
                pack: pack,
                members: members
            };
            setChosenPack(newCPack);
        } catch (error) {
            if (error instanceof Error) {
                console.error(error.message);
            } else {
                console.error("Unknown error occured");
            }
        }
    }

    const fetchPacks = async () => {
        try {
            if (loading)
                return;
            if (!user)
                return;

            const owner_id = user.user_id;
            const response: Response = await fetch(`http://localhost:3001/api/packs/get-packs/${owner_id}`, {
                method: "GET"
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(`${data.message}`)
            }

            const data = await response.json();
            if (!Array.isArray(data.packs))
                throw new Error("Invalid response: packs isn't an array");

            setPacks(data.packs);

        } catch (error) {
            if (error instanceof Error) {
                console.error(error.message);
            } else {
                console.error("Unknown error occured");
            }
        }

    }


    const deletePack = async(pack_id : PackID)=>{
        try{
            setChosenPack(defaultCPack);
            setChosenEditPack(defaultPack);
            setEditPack(false);
            const response: Response = await fetch(`http://localhost:3001/api/packs/delete-pack`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ pack_id })
            });
            const data = await response.json();
            if(!response.ok){
                throw new Error(`${data.message}`)
            }
            setPacks(packs.filter((pack)=> pack.pack_id != pack_id));
        }catch(error){
            if (error instanceof Error) {
                console.error(error.message);
            } else {
                console.error("Unknown error occured");
            }
        }
    }

    const editPackInfo = async(pack : Pack)=>{
        try{
            setEditPack(false);
            setChosenEditPack(defaultPack);
            const response: Response = await fetch(`http://localhost:3001/api/packs/edit-pack`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ edited_pack: pack })
            });
            const data = await response.json();
            if(!response.ok){
                throw new Error(`${data.message}`)
            }
            const updated_pack = data.updated_pack as Pack;
            setPacks((currentPacks)=>
                currentPacks.map((pack)=>
                pack.pack_id === updated_pack.pack_id
                ? updated_pack : pack
            )
            );
        }catch(error){
            if (error instanceof Error) {
                console.error(error.message);
            } else {
                console.error("Unknown error occured");
            }
        }
    }

    const displayPack = (pack: Pack)=>{
        return(
            <Col key={pack.pack_id} xs={12} xl={6}>
                <Card className="h-100 border-0 rounded-3 shadow-sm">
                    <Card.Body className="d-flex flex-column p-3 position-relative">
                    <div className="d-flex justify-content-between align-items-start gap-2 mb-1">
                        <Card.Title className="fw-bold text-truncate mb-0">
                            {pack.group_name}
                        </Card.Title>
                        <Button
                            variant="danger"
                            size="sm"
                            className="flex-shrink-0"
                            onClick={() => deletePack(pack.pack_id)}
                        >
                            Delete
                        </Button>
                    </div>

                    <Card.Text className="text-muted small mb-3">
                        {pack.semester} {pack.year}
                    </Card.Text>
                    <Row className="g-2 flex-shrink-0" >
                        <Row className="g-2 flex-shrink-0" >
                            <Button
                                size="sm"
                                className="text-nowrap"
                                variant="secondary"
                                onClick={() => {
                                    setChosenEditPack(
                                        {
                                            pack_id: pack.pack_id,
                                            owner_id: pack.owner_id,
                                            group_name: pack.group_name,
                                            semester: pack.semester,
                                            year: pack.year
                                        }
                                    )
                                    setEditPack(true);
                                }}
                            >
                                Edit Pack Info
                            </Button>
                        </Row>
                    <Row className="g-2 flex-shrink-0" >
                        <Button
                            size="sm"
                            className="text-nowrap"
                            variant="primary"
                            onClick={() => { 
                                setEditPack(false);
                                fetchPackData(pack);
                            }}
                        >
                            View Schedule
                        </Button>
                    </Row>
                    </Row>
                    </Card.Body>
                </Card>
            </Col>
        )
    }


    const renderPacks = () => {
        return (
          <div className="h-100 border rounded-4 p-3 bg-light shadow-sm overflow-y-auto">
            {packs.length > 0 ? (
              <Row className="g-3">
                {packs.map((pack: Pack) => (
                  displayPack(pack)
                ))}
              </Row>
            ) : (
              <div className="h-100 d-flex flex-column justify-content-center align-items-center text-center">
                <h4 className="fw-bold mb-2">No packs yet</h4>
                <p className="text-muted mb-0">
                  Create a pack to compare schedules.
                </p>
              </div>
            )}
          </div>
        );
      };

      const navigate = useNavigate();
      
      //AI assistance was used below to help with bootstrap styling
      return (
        <YearsContextProvider>
          <SemestersContextProvider>
            <div className="PackPage">
              <Container fluid="xl" className="py-4">
              <div className="d-flex justify-content-start mb-3">
                <Button
                    size="sm"
                    variant="outline-primary"
                    onClick={() => navigate("/userprofile")}
                    >
                    Go back to profile
                    </Button>
                </div>
                <Row className="g-4 align-items-stretch" style={{height: "60vh"}}>
                  <Col
                    xs={12}
                    lg={5}
                    xl={5}
                    className="d-flex flex-column gap-3"
                  >
                    <div className="flex-grow-1">
                      {createPack || packs.length === 0 ? (
                        <CreatePack
                          semester={semester}
                          year={year}
                          setSemester={setSemester}
                          setYear={setYear}
                          createNewPack={createNewPack}
                        />
                      ) : (
                        renderPacks()
                      )}
                    </div>
      
                    {packs.length > 0 && (
                      <Button
                        variant="outline-secondary"
                        className="align-self-center px-4"
                        onClick={() => {
                            setChosenPack(defaultCPack);
                            setCreatePack((current) => !current);
                        }}
                      >
                        {createPack ? "View Packs" : "Create Pack"}
                      </Button>
                    )}
                   
                  </Col>
      
                  <Col xs={12} lg={7} xl={7}>
                   { editPack ? <EditPackInfo pack={chosenEditPack} setEditPack={setEditPack} editPackInfo={editPackInfo}/> : <PackSchedule
                      clearChosenPack={clearChosenPack}
                      pack={chosenPack.pack}
                      members={chosenPack.members}
                    />}
                  </Col>
                </Row>
              </Container>
            </div>
          </SemestersContextProvider>
        </YearsContextProvider>
      );

}