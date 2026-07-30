import Form from 'react-bootstrap/Form';
import { useYearsContext } from "../schedule-builder/SFUCoursesAPISurface/yearsContext";


type SelectYearProps = {
  year: number,
  setYear: React.Dispatch<React.SetStateAction<number>>;
};
function SelectYear({ year, setYear } : SelectYearProps) {
  const data = useYearsContext();

  const renderOptions = ()=>{
    const { data : years, isloading } = data;
    if(!isloading)
      <option/>
      
    if(!Array.isArray(years))
      return <option/>;

    const reversed_years = [...years, "None"].reverse();
    
    return(
      reversed_years.map((r_year, index)=>{
        return(
          <option key = {index} value = {r_year}>{r_year}</option>
        )
      })
    )
  };

  return (
    <Form.Select aria-label="Default select example" value={`${year}`} onChange={(e)=>{
        if(e.target.value == "None")
          setYear(0);
        else
          setYear(Number(e.target.value))
      }}>
      {renderOptions()}
    </Form.Select>
  );
}

export default SelectYear;