import React, { useEffect, useState } from "react";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container"
import Form from 'react-bootstrap/Form';
import SearchBar from "./SearchBar";
import { type PackMember } from "../../types/Pack";
import "./packs.css"

export function CreatePack(){
    const [chosenFriends, setChosenFriends] = useState<PackMember[]>([]);
    return(
        <Container className = "create-pack">
            <h2>Create new Pack</h2>
            <Form.Control type="text" placeholder= "Enter group name" />
            <div className = "friend-adder">
                <SearchBar/>
                <Button style={{backgroundColor: "#7B3F00", borderColor: "white"}}>Add member</Button>
            </div>

            <Button style={{backgroundColor: "green", borderColor: "white"}} variant="primary">Create Pack</Button>
        </Container>
    )
};
