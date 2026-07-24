import Form from 'react-bootstrap/Form';
import { useSemestersContext } from "../schedule-builder/SFUCoursesAPISurface/semestersContext";


type SelectSemProps = {
    semester: string,
    setSemester: React.Dispatch<React.SetStateAction<string>>;
};

function SelectSem({semester, setSemester} : SelectSemProps) {
    const data = useSemestersContext();
    
    const renderOptions = ()=>{
        const { data : semesters, isloading } = data;
        if(!isloading)
          <option/>
          
        if(!Array.isArray(semesters))
          return <option/>;

        const updated_semesters : string[] = ["None", ...semesters];
        return(
        updated_semesters.map((sem, index)=>{
            return(
            <option key = {index} value = {sem}>{sem}</option>
            )
        }))
  };

  return (
    <Form.Select aria-label="Default select example" value={semester} onChange={(e)=>setSemester(e.target.value)}>
      {renderOptions()}
    </Form.Select>
  );
}

export default SelectSem;