import React, { useEffect, useState } from "react";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container"
import Form from 'react-bootstrap/Form';
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
        if(searchDropdown.length == 0)
            fetchFriendships();
    },[searchDropdown]);

    const fetchFriendships = async () => {
        const response = await fetch(`http://localhost:3001/api/friendships`, {
        method: "GET",
        credentials: "include",
        });
    
        const data = await response.json();
    
        if (!response.ok) {
            throw new Error(data.error || "Failed to load friendships.");
        }

        if(!Array.isArray(data.currentFriends))
            return;

        const friends = data.currentFriends as FriendshipUser[];
        const friends_mapped : Friend[] = friends.map((friend)=>{
            return({
                user_id: friend.user_id,
                username: friend.username
            })
        });
        setSearchDropdown(friends_mapped);
    };

    const removeMember = (member: Friend)=>{
        setChosenMembers(
            chosenMembers.filter((friend) =>
                member.user_id != friend.user_id
            )
        )
        // setSearchDropdown([...searchDropdown, member])
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
            console.error("Group name is required.");
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
            console.error("Failed to create pack: ", error);
        }
    }

    return(
        <Container className = "create-pack">
            <h2>Create new Pack</h2>
            <Form.Control type="text" placeholder= "Enter group name" value = {groupName} onChange={(e)=>setGroupName(e.target.value)}/>
            <div className = "friend-adder">
                <SearchBar search={search} selected={selected} setSelected={setSelected} setSearch={setSearch} setShowDropdown={setShowDropdown} searchDropdown={searchDropdown} showDropdown={showDropdown}/>
                <Button style={{backgroundColor: "#7B3F00", borderColor: "white"}} 
                    onClick = {()=>{
                        if(selected.user_id == -1 )
                            return;
                        if(!chosenMembers.includes(selected))
                            setChosenMembers([...chosenMembers, selected])
                        setSearch("");

                    }}>
                    Add member
                </Button>
            </div> 
            <SelectSem semester={semester} setSemester={setSemester}/>
            <SelectYear year={year} setYear={setYear}/>
            <div className = "chosen-friends"><h3>Pack:</h3> {renderChosenMembers()}</div>
            <Button style={{backgroundColor: "green", borderColor: "white"}} variant="primary" onClick = {handleSubmit}>Create Pack</Button>
        </Container>
    )
};
