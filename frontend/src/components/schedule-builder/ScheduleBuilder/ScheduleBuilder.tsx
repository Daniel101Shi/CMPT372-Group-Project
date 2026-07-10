import { useState } from 'react'
import { Container, Col, Row, Form, FormControl, FormSelect, Table, Button } from 'react-bootstrap'
import { useYearsContext } from '../SFUCoursesAPISurface/yearsContext'
import { useSemestersContext } from '../SFUCoursesAPISurface/semestersContext';
import { useCoursesContext } from '../SFUCoursesAPISurface/coursesContext';

export function ScheduleBuilder() {
  let [search, search_setter] = useState("");
  let [selected_courses, selected_courses_setter] = useState<{ department: string, c_number: string, c_title: string }[]>([])
  let year_interface = useYearsContext();
  let semesters_interface = useSemestersContext();
  let courses_interface = useCoursesContext();

  // the courses which contain the search string and are not already selected
  let filtered_courses = courses_interface.data.map(x => ({ department: x.department, courses: x.courses.filter(y => x.department.concat(y.c_number).concat(y.c_title).toLowerCase().replaceAll(' ', '').includes(search) && selected_courses.findIndex(c => x.department == c.department && y.c_number == c.c_number) == -1) }));
  return (<>
    <Container>
      <Row>
      </Row>
      <Row>
        <h1>schedule creation</h1>
      </Row>
      <Row>
        <Col>
          <Form onSubmit={(x) => { 
            // send a post message with some json object
            // save this courseload into db
            x.preventDefault();
          }}>
            <Container>
              <Row>
                <Col>
                  {year_interface.isloading ? <FormSelect disabled><option>loading...</option></FormSelect> :
                    <FormSelect className='mb-2' value={year_interface.selected.year} onChange={
                      // clear selected courses
                      // update year in state to selected year
                      // cascades to update semester then courses
                      x => { selected_courses_setter([]); year_interface.selected_setter({ year: x.target.value }); }
                    }>
                      {year_interface.data.map((x, y) => (<option value={x} key={y}>{x}</option>))}
                    </FormSelect>}

                  {semesters_interface.isloading ? <FormSelect disabled><option>loading...</option></FormSelect> :
                    <FormSelect className='mb-2' value={semesters_interface.selected.semester} onChange={
                      // clear selected courses
                      // update semester in state to selected semester
                      // cascades to update courses
                      (x) => { selected_courses_setter([]); semesters_interface.selected_setter({ semester: x.target.value }) }
                    }>
                      {semesters_interface.data.map((x, y) => (<option value={x} key={y}>{x}</option>))}
                    </FormSelect>
                  }

                  <FormControl className='mb-2' type='text' placeholder='{search string}' onChange={
                    // set search string
                    (x) => { search_setter(x.target.value.toLowerCase().replaceAll(' ', '')) }
                  }>
                  </FormControl>
                </Col>
                <Col>
                  <Button className='form-control' variant='success' type='submit'>save selected</Button>
                </Col>
              </Row>
            </Container>
          </Form>

        </Col>
      </Row>
      <h2>
        courses:
      </h2>
      <Row>
        <Col>
          <h3>
            available:
          </h3>
          {filtered_courses.length == 0 ? <Table><thead><tr><th>{courses_interface.isloading ? 'loading' : 'no courses found'}</th></tr></thead></Table> :
            <Table striped bordered>
              <thead>
                <tr>
                  <th>add</th>
                  <th>course</th>
                </tr>
              </thead>
              <tbody>
                {filtered_courses.map(x => x.courses.map((y, i) =>
                  <tr key={i}>
                    <td><Button variant='link' onClick={ // insert sorted into the selected list
                      () => selected_courses_setter(prev => prev.concat([{ c_number: y.c_number, c_title: y.c_title, department: x.department }]).toSorted((a, b) => a.department.localeCompare(b.department) * 2 + parseInt(a.c_number) - parseInt(b.c_number)))
                    }>(+)</Button></td>
                    <td colSpan={2}>{x.department.toUpperCase() + ': ' + y.c_number + ' ' + y.c_title}</td>
                  </tr>))}
              </tbody>
            </Table>}
        </Col>
        <Col>
          <h3>
            selected:
          </h3>
          {selected_courses.length == 0 ? <Table><thead><tr><th>empty</th></tr></thead></Table> :
            <Table striped bordered>
              <thead>
                <tr>
                  <th>drop</th>
                  <th>course</th>
                </tr>
              </thead>
              <tbody>
                {selected_courses.map((x, i) =>
                  <tr key={i}>
                    <td><Button variant='link' onClick={ // remove a course from the selected list
                      () => selected_courses_setter(prev => prev.filter(c => c.c_number != x.c_number && c.c_number != x.department))
                    }>(x)</Button></td>
                    <td>{x.department.toUpperCase() + ': ' + x.c_number + ' ' + x.c_title}</td>
                  </tr>)}
              </tbody>
            </Table>}
        </Col>
      </Row>
    </Container>
  </>)
}
