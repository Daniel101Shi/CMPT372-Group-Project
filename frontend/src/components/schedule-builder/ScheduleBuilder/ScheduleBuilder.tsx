import { useState } from 'react'
import { Container, Col, Row, Form, FormControl, FormSelect, Table, Button } from 'react-bootstrap'
import { useYearsContext } from '../SFUCoursesAPISurface/yearsContext'
import { useSemestersContext } from '../SFUCoursesAPISurface/semestersContext';
import { useCoursesContext } from '../SFUCoursesAPISurface/coursesContext';
import '../bootstrap.min.css';
import '../bootstrap.extension.css'

function get_time_string_from_i(i: number) {
  return (
    String((i < 24 ? '0' : '') + Math.floor(i / 2) + ':' + ((i % 2) == 0 ? '00' : '30')) + '-' +
    String((i + 1 < 24 ? '0' : '') + Math.floor((i + 1) / 2) + ':' + ((i % 2) != 0 ? '00' : '30'))
  )
}

export function ScheduleBuilder() {
  let [search, search_setter] = useState("");
  let [selected_courses, selected_courses_setter] = useState<{ department: string, c_number: string, c_title: string }[]>([])
  let year_interface = useYearsContext();
  let semesters_interface = useSemestersContext();
  let courses_interface = useCoursesContext();
  let [free_time, free_time_setter] = useState(Array.from({ length: 48 * 7 }, () => '0'))
  let [current_courses, current_courses_setter] = useState<{ department: string, c_number: string, c_title: string }[]>([
    { department: "cmpt", c_number: "300", c_title: "computer stuff a" },
    { department: "cmpt", c_number: "301", c_title: "computer stuff b" },
    { department: "cmpt", c_number: "404", c_title: "computer stuff i cannot find" },
    { department: "macm", c_number: "101", c_title: "easy course" },
    { department: "cmpt", c_number: "200", c_title: "waow" }
  ]);

  // the courses which contain the search string and are not already selected
  let filtered_courses = courses_interface.data.map(x => ({ department: x.department, courses: x.courses.filter(y => x.department.concat(y.c_number).concat(y.c_title).toLowerCase().replaceAll(' ', '').includes(search) && selected_courses.findIndex(c => x.department == c.department && y.c_number == c.c_number) == -1) }));
  return (
    <div className='bootstrap-scope'>
      <Form onSubmit={(x) => {
        // send a post message with some json object
        // save this courseload into db
        x.preventDefault();
      }}>
        <Container>
          <Row>
            <h1>schedule creation</h1>
            <hr />
            <Col>
              <h2>select semester</h2>
              {year_interface.isloading ? <FormSelect className='mb-2' disabled><option>loading...</option></FormSelect> :
                <FormSelect className='mb-2' value={year_interface.selected.year} onChange={
                  // clear selected courses
                  // update year in state to selected year
                  // cascades to update semester then courses
                  x => { selected_courses_setter([]); year_interface.selected_setter({ year: x.target.value }); }
                }>
                  {year_interface.data.map((x, y) => (<option value={x} key={y}>{x}</option>))}
                </FormSelect>}

              {semesters_interface.isloading ? <FormSelect className='mb-2' disabled><option>loading...</option></FormSelect> :
                <FormSelect className='mb-2' value={semesters_interface.selected.semester} onChange={
                  // clear selected courses
                  // update semester in state to selected semester
                  // cascades to update courses
                  (x) => { selected_courses_setter([]); semesters_interface.selected_setter({ semester: x.target.value }) }
                }>
                  {semesters_interface.data.map((x, y) => (<option value={x} key={y}>{x}</option>))}
                </FormSelect>
              }

            </Col>
          </Row>
          <hr />
          <Row>
            <h3>
              current saved schedule:
            </h3>

            <Col>
              {current_courses.length == 0 ? <Table><thead><tr><th>none</th></tr></thead></Table> :
                <Table striped bordered>
                  <thead>
                    <tr>
                      <th colSpan={2}>courses</th>
                    </tr>
                  </thead>
                  <tbody>
                    {current_courses.map((x, i) =>
                      <tr key={i}>
                        <td key={i}>{x.department.toUpperCase() + ': ' + x.c_number + ' ' + x.c_title}</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              }
            </Col>

            <Col>
              <Button className='form-control' variant='success' type='submit'>overwrite with selected</Button>
            </Col>

          </Row>
          <hr />
          <h2>open availability time on campus</h2>
          <Row>

            <Col>
              <details>
                <Table bordered className={'bs-extended-cell-hover'}>
                  <tbody>
                    <tr>
                      <td>key</td>
                      <td className='bs-extended-on-cell'>available</td>
                      <td className='bs-extended-off-cell'>unavailable</td>
                    </tr>
                  </tbody>
                </Table>
                <Table bordered className={'bs-extended-cell-hover'}>
                  <thead>
                    <tr>
                      <th>@</th>
                      <th>monday</th>
                      <th>tuesday</th>
                      <th>wednesday</th>
                      <th>thursday</th>
                      <th>friday</th>
                      <th>saturday</th>
                      <th>sunday</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 48 }, (_, i) =>
                      <tr key={i}>
                        <td onClick={() => console.log(i)}>{get_time_string_from_i(i)}</td>
                        {Array.from({ length: 7 }, (_, j) =>
                          <td key={j} className={free_time[(i * 7) + j] == '1' ? 'bs-extended-on-cell' : 'bs-extended-off-cell'} onClick={() => { free_time_setter(prev => prev.map((x, k) => k == (i * 7) + j ? x == '0' ? '1' : '0' : x))}}>{free_time[i * 7 + j] == '1' ? 'o' : 'x'}</td>
                        )}
                      </tr>)}
                  </tbody>
                </Table>
              </details>
            </Col>

          </Row>
            <hr />
            <h2>
              courses:
            </h2>
          <Row>

            <Col>
              <h3>filter available courses:</h3>
              <FormControl className='mb-2' type='text' placeholder='{search string}' onChange={
                // set search string
                (x) => { search_setter(x.target.value.toLowerCase().replaceAll(' ', '')) }
              }>
              </FormControl>
            </Col>

          </Row>
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
      </Form>
    </div>
  )
}
