import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import {
    Button,
    Card,
    Col,
    Container,
    Form,
    Row,
  } from "react-bootstrap";
import SearchBar from "./SearchBar";
import SelectYear from "./SelectYear";
import SelectSem from "./SelectSem";

import { type Friend } from "../../types/Pack";

import { type FriendshipUser} from "../profile/UserProfilePage";
import "./packs.css"


type CreatePackProps = {
    semester: string,
    year: number,
    setYear: React.Dispatch<React.SetStateAction<number>>;
    setSemester: React.Dispatch<React.SetStateAction<string>>;
    createNewPack: (group_name: string, members: Friend[]) => Promise<void>;
};

const apiUrl = import.meta.env.VITE_API_URL || "";


export function CreatePack({createNewPack, semester, year, setSemester, setYear} : CreatePackProps){
    const [searchDropdown, setSearchDropdown] = useState<Friend[]>([]);
    const [groupName, setGroupName] = useState<string>("");
    const [chosenMembers, setChosenMembers] = useState<Friend[]>([]);
    const [search, setSearch] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    const [selected, setSelected] = useState<Friend>(
        {
            user_id: -1,
            username: ""
        }
    );
    

    useEffect(()=>{
      fetchFriendships();
    },[]);

    const fetchFriendships = async () => {
        try{
            const response = await fetch(`${apiUrl}/api/friendships`, {
            method: "GET",
            credentials: "include"
            });
        
            const data = await response.json();
        
            if (!response.ok) {
                throw new Error(data.error.message || "Failed to load friendships.");
            }

            if(!Array.isArray(data.currentFriends)){
                throw new Error("currentFriends isn't an array")
            }
            const friends = data.currentFriends as FriendshipUser[];
            const friends_mapped : Friend[] = friends.map((friend)=>{
                return({
                    user_id: friend.user_id,
                    username: friend.username
                })
            });
            setSearchDropdown(friends_mapped);
        }catch(error){
            if (error instanceof Error) {
                console.error(error.message);
            } else {
                console.error("Unknown error occured");
            }
        }
    };

    const removeMember = (member: Friend)=>{
        setChosenMembers(
            chosenMembers.filter((friend) =>
                member.user_id != friend.user_id
            )
        )
    }


    const renderChosenMembers = ()=>{
        return(
            chosenMembers.map((member, key)=>{
               return (
                    <div key={key}>
                        <button style = {{backgroundColor: "red", borderRadius: "10px"}} onClick={()=>removeMember(member)}>X</button>
                        {member.username}
                    </div>
                )
            })
        )
    }

    const handleSubmit = async(e : React.MouseEvent<HTMLButtonElement, MouseEvent>) : Promise<void> => {
        e.preventDefault();

        if(groupName.trim() === ""){
            toast.error("Please enter a pack name.");
            return;
        }
        try{
            await createNewPack(groupName.trim(), chosenMembers);
            setChosenMembers([]);
            setGroupName("");
            setSearch("");
            setSelected({
                user_id: -1,
                username: ""
            });

        }catch(error){
            if (error instanceof Error) {
                console.error(error.message);
            } else {
                console.error("Unknown error occured");
            }
        }
    }

    //AI assistance was used below to help with bootstrap styling
    return (
        <Container
          fluid
          className="h-100 p-0"
          style={{ minHeight: 0 }}
        >
          <Card className="h-100 border-0 rounded-4 shadow overflow-hidden">
            <Card.Body
              className="d-flex flex-column gap-3 p-3 overflow-y-auto"
              style={{ minHeight: 0 }}
            >
              <div className="flex-shrink-0">
                <h3 className="fw-bold mb-0">Create a new Pack</h3>
                <p className="text-secondary small mb-0">
                  Add your friends and choose a semester.
                </p>
              </div>
      
              <Form.Group className="flex-shrink-0">
                <Form.Label className="fw-semibold small mb-1">
                  Pack name
                </Form.Label>
      
                <Form.Control
                  size="sm"
                  type="text"
                  placeholder="Enter group name"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
              </Form.Group>
      
              <Form.Group className="flex-shrink-0">
                <Form.Label className="fw-semibold small mb-1">
                  Add members
                </Form.Label>
      
                <div className="d-flex gap-2 align-items-start">
                  <div className="flex-grow-1">
                    <SearchBar
                      search={search}
                      selected={selected}
                      setSelected={setSelected}
                      setSearch={setSearch}
                      setShowDropdown={setShowDropdown}
                      searchDropdown={searchDropdown}
                      showDropdown={showDropdown}
                    />
                  </div>
      
                  <Button
                    size="sm"
                    className="px-3 text-nowrap"
                    style={{
                      backgroundColor: "#7B3F00",
                      borderColor: "#7B3F00",
                    }}
                    onClick={() => {
                      if (selected.user_id === -1) 
                        return;
                      const alreadyChosen = chosenMembers.some(
                        (member) => member.user_id === selected.user_id
                      );
                      if (!alreadyChosen) {
                        setChosenMembers((current) => [...current, selected]);
                      }
      
                      setSearch("");
                    }}
                  >
                    Add member
                  </Button>
                </div>
              </Form.Group>
      
              <Row className="g-2 flex-shrink-0">
                <Col xs={12} md={6}>
                  <Form.Label className="fw-semibold small mb-1">
                    Semester
                  </Form.Label>
      
                  <SelectSem
                    semester={semester}
                    setSemester={setSemester}
                  />
                </Col>
      
                <Col xs={12} md={6}>
                  <Form.Label className="fw-semibold small mb-1">
                    Year
                  </Form.Label>
      
                  <SelectYear
                    year={year}
                    setYear={setYear}
                  />
                </Col>
              </Row>
      
              <div className="bg-light border rounded-3 p-2 flex-shrink-0">
                <h6 className="fw-semibold mb-2">Pack members</h6>
      
                {chosenMembers.length > 0 ? (
                  <div className="d-flex flex-wrap gap-1">
                    {renderChosenMembers()}
                  </div>
                ) : (
                  <p className="text-secondary small mb-0">
                    No members added yet.
                  </p>
                )}
              </div>
      
              <div className="mt-auto d-flex justify-content-end flex-shrink-0">
                <Button
                  size="sm"
                  className="px-4 fw-semibold"
                  variant="success"
                  onClick={handleSubmit}
                >
                  Create Pack
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Container>
      );
};
