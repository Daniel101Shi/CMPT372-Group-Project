import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {type Pack, type PackMember} from "../../types/Pack";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container"
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { PackSchedule } from "./PackSchedule";
import { CreatePack } from "./CreatePack";
import "./packs.css"

type PackPageProps = {
    packs: Pack[];
};

export function PackPage({packs} : PackPageProps){

    const [createPack, setCreatePack] = useState<Boolean>(true);
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
        <div className = "PackPage">
            <Container className="page-container">
                <Row>
                    <Col className="d-flex flex-column" xs={12} md={12} lg={4} xl={6}>
                            {createPack ? <CreatePack/> : renderPacks()}
                    </Col>
                    <Col xs={12} md={12} lg={8} xl={6}><PackSchedule/></Col>
                </Row>
            </Container>
        </div>
    )
}