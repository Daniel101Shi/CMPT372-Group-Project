import { useState, useEffect } from 'react';
import { toast } from "sonner";
import { Card, Form, Button, Row, Col} from 'react-bootstrap';
import { type Pack} from '../../types/Pack';
import SelectSem from './SelectSem';
import SelectYear from './SelectYear';

type EditPackInfoProps = {
  pack: Pack;
  setEditPack: React.Dispatch<React.SetStateAction<boolean>>;
  editPackInfo: (pack : Pack)=>Promise<void>;
}

function EditPackInfo({setEditPack, editPackInfo, pack} : EditPackInfoProps) {
    const [groupName, setGroupName] = useState<string>("");
    const [semester, setSemester] = useState<string>("");
    const [year, setYear] = useState<number>(0);


    useEffect(()=>{
      setGroupName(pack.group_name);
      setSemester(pack.semester);
      setYear(pack.year);
    }, [pack]);

    const handleSubmit = ()=>{
      if(groupName === "" || semester === "None" || year === 0){
        toast.error("Please fill out all required fields.");
        return;
      }
      const editedPack: Pack = {
        ...pack,
        group_name: groupName,
        semester: semester,
        year: year,
      };
      editPackInfo(editedPack);
    } 

  return (
      <Card className="position-relative  border-0 rounded-4 shadow overflow-hidden">
        <Card.Header className="bg-white border-0 px-4 pt-4 pb-2">
            <div className="d-flex justify-content-between align-items-center gap-3">
                <h2 className="fw-bold mb-1">
                  Edit {pack.group_name}'s pack info
                </h2>
                <p className="text-secondary mb-0">Edit pack information</p>
            </div>
          </Card.Header>
        <Card.Body className = "bg-light border rounded-4 p-3 m-3 shadow-sm">
            <Form.Group className="flex-shrink-0">
                <Form.Label className="fw-semibold small mb-1">
                  Edit Pack Name
                </Form.Label>

                <Form.Control
                  size="sm"
                  type="text"
                  placeholder="Enter pack name"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
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
      
                <Col xs={6} md={6}>
                  <Form.Label className="fw-semibold small mb-1">
                    Year
                  </Form.Label>
      
                  <SelectYear
                    year={year}
                    setYear={setYear}
                  />
                </Col>
              </Row>
              <Row className="g-2 flex-shrink-0">
                <Col xs={12} className="d-flex justify-content-end gap-2">
                  <Button
                        size="sm"
                        className="text-nowrap m-2"
                        variant="danger"
                        onClick={() => setEditPack(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        size="sm"
                        className="text-nowrap m-2"
                        variant="primary"
                        onClick={() => handleSubmit()}
                    >
                        Edit
                    </Button>
                </Col>
              </Row>

        </Card.Body>
    </Card>
  );
}

export default EditPackInfo;