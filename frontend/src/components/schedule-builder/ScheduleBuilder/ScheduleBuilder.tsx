import { useState } from 'react'
import { Container, Col, Row, Form, FormControl, FormSelect, Table, Button, Card, FormLabel } from 'react-bootstrap'
import { useYearsContext } from '../SFUCoursesAPISurface/yearsContext'
import { useSemestersContext } from '../SFUCoursesAPISurface/semestersContext';
import { useCoursesContext } from '../SFUCoursesAPISurface/coursesContext';
import { useSelectedContext } from '../SFUCoursesAPISurface/selectedContext';
import { useCurrentScheduleContext } from '../meAPISurface/currentScheduleContext';
import { trivial_offering_selection } from '../helpers';
import { Link } from 'react-router-dom';
import '../bootstrap.min.css';
import '../bootstrap_extension.css'


function get_time_string_from_i(i: number) {
  return (
    String((i < 24 ? '0' : '') + Math.floor(i / 2) + ':' + ((i % 2) == 0 ? '00' : '30')) + '-' +
    String((i + 1 < 24 ? '0' : '') + Math.floor((i + 1) / 2) + ':' + ((i % 2) != 0 ? '00' : '30'))
  )
}

export function ScheduleBuilder() {
  let [search, search_setter] = useState("");
  let [free_time, free_time_setter] = useState(Array.from({ length: 48 * 7 }, () => '0'))
  let selected_interface = useSelectedContext();
  let year_interface = useYearsContext();
  let semesters_interface = useSemestersContext();
  let courses_interface = useCoursesContext();
  let current_interface = useCurrentScheduleContext();


  // the courses which contain the search string and are not already selected
  let filtered_courses = courses_interface.data.map(x => ({ department: x.department, courses: x.courses.filter(y => x.department.concat(y.course_number).concat(y.course_title).toLowerCase().replaceAll(' ', '').includes(search) && selected_interface.selected.findIndex(c => x.department == c.department && y.course_number == c.course_number) == -1) }));
  return (
    <div className='bootstrap-scope'>
      <Container><Row><Col xs={4} sm={4}>
        <Link to='/userprofile' className='bs-extended-router-link form-control mb-3'
        >Return To Home</Link>
      </Col></Row></Container>
      <Form>
        <Container>
          <Row>
            <h1>schedule creation</h1>
            <hr />
            <Col>
              <h2>select semester</h2>
              {year_interface.isloading ? <FormSelect className='mb-3' disabled><option>loading...</option></FormSelect> :
                <FormSelect className='mb-2' value={year_interface.selected.year} onChange={
                  // clear selected courses
                  // update year in state to selected year
                  // cascades to update semester then courses
                  x => { selected_interface.clear(); year_interface.selected_setter({ year: x.target.value }); }
                }>
                  {year_interface.data.map((x, y) => (<option value={x} key={y}>{x}</option>))}
                </FormSelect>}

              {semesters_interface.isloading ? <FormSelect className='mb-2' disabled><option>loading...</option></FormSelect> :
                <FormSelect className='mb-2' value={semesters_interface.selected.semester} onChange={
                  // clear selected courses
                  // update semester in state to selected semester
                  // cascades to update courses
                  (x) => { selected_interface.clear(); semesters_interface.selected_setter({ semester: x.target.value }) }
                }>
                  {semesters_interface.data.map((x, y) => (<option value={x} key={y}>{x}</option>))}
                </FormSelect>
              }
            </Col>
          </Row>
          <hr />
          <h2>open availability time on campus</h2>
          <Row>
            <Col>
              <h3>view current saved availability</h3>
              <details className='mb-3'>
                <Table bordered className='bs-extended-cell-hover'>
                  <tbody>
                    <tr>
                      <td>key</td>
                      <td className='bs-extended-on-cell'>o: available</td>
                      <td className='bs-extended-off-cell'>x: unavailable</td>
                    </tr>
                  </tbody>
                </Table>
                {current_interface.isloading ? 'loading...' : <Table bordered className='bs-extended-cell-hover'>
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
                        <td>{get_time_string_from_i(i)}</td>
                        {Array.from({ length: 7 }, (_, j) =>
                          <td key={j} className={current_interface.campus_schedule[i + (j * 48)] == '1' ? 'bs-extended-on-cell' : 'bs-extended-off-cell'}>{current_interface.campus_schedule[i + (j * 48)] == '1' ? 'o' : 'x'}</td>
                        )}
                      </tr>)}
                  </tbody>
                </Table>}
              </details>
              <h3>select new availability:</h3>
              <details className='mb-3'>
                <Table bordered className={'bs-extended-cell-hover'}>
                  <tbody>
                    <tr>
                      <td>key</td>
                      <td className='bs-extended-on-cell'>o: available</td>
                      <td className='bs-extended-off-cell'>x: unavailable</td>
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
                        <td>{get_time_string_from_i(i)}</td>
                        {Array.from({ length: 7 }, (_, j) =>
                          <td key={j} className={free_time[i + (j * 48)] == '1' ? 'bs-extended-on-cell' : 'bs-extended-off-cell'} onClick={() => { free_time_setter(prev => prev.map((x, k) => k == i + (j * 48) ? x == '0' ? '1' : '0' : x)) }}>{free_time[i + (j * 48)] == '1' ? 'o' : 'x'}</td>
                        )}
                      </tr>)}
                  </tbody>
                </Table>
              </details>
            </Col>
          </Row>
          <Row>
            <Col>
              <Button className='form-control mb-3 bs-extended-button' variant='success' disabled={selected_interface.loading || current_interface.isloading}
                onClick={() => {
                  current_interface.update_current_availability({
                    availability: free_time.join('')
                  })
                }}>overwrite campus availability with new campus availability</Button>
            </Col>
          </Row>
          <hr />
          <h2>
            courses:
          </h2>
          <Row>
            <Col>
              <h3>current saved schedule:</h3>
              {current_interface.isloading ? <Table><thead><tr><th>loading...</th></tr></thead></Table> :
                current_interface.taking.length == 0 ? <Table><thead><tr><th>none</th></tr></thead></Table> :
                  <Table striped bordered>
                    <thead>
                      <tr>
                        <th >courses</th>
                      </tr>
                    </thead>
                    <tbody>
                      {current_interface.taking.map((x, i) =>
                        <tr key={i}>
                          <td key={i}>{x.department.toUpperCase() + ': ' + x.course_number.toUpperCase() + ' ' + x.section.toUpperCase()}</td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
              }
            </Col>
          </Row>
          <Row>
            <Col>
              <h3>
                available:
              </h3>
              <FormControl className='mb-2' type='text' placeholder='Search courses...' onChange={
                // set search string
                (x) => { search_setter(x.target.value.toLowerCase().replaceAll(' ', '')) }
              }>
              </FormControl>
              {filtered_courses.length == 0 ? <Table><thead><tr><th>{courses_interface.isloading ? 'loading...' : 'no courses found'}</th></tr></thead></Table> :
                <div className='bs-extended-vertically-scrollable-container mb-3'>
                  <Table striped bordered >
                    <thead>
                      <tr>
                        <th>add</th>
                        <th>course</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered_courses.map(x => x.courses.map((y, i) =>
                        <tr key={i}>
                          <td><Button className='' variant='success' size='sm' disabled={selected_interface.loading} onClick={ // insert sorted into the selected list
                            () => selected_interface.add_course({ course_number: y.course_number, course_title: y.course_title, department: x.department })
                          }>(+)</Button></td>
                          <td colSpan={2}>{x.department.toUpperCase() + ': ' + y.course_number + ' ' + y.course_title}</td>
                        </tr>))}
                    </tbody>
                  </Table>
                </div>
              }
            </Col>
          </Row>
          <Row>
            <Col>
              <h3>
                selected:
              </h3>
              {selected_interface.selected.length == 0 ? <Table><thead><tr><th>empty</th></tr></thead></Table> :
                <Container>
                  <Row>
                    {selected_interface.selected.map((crs, crs_i) =>
                      <Col key={crs_i} xs={3} sm={3}>
                        <Card className='mb-3' key={crs_i}>
                          <Card.Header>{crs.department.toUpperCase() + ': ' + crs.course_number + ' ' + crs.course_title}</Card.Header>
                          <Card.Body>
                            {selected_interface.loading ? <p>loading...</p> :
                              selected_interface.offerings[crs_i].length == 0 ? <></> :
                                <>
                                  {selected_interface.selected_offerings[crs_i] == null ? <></> :
                                    <>
                                      <FormLabel>offering:</FormLabel>
                                      <FormSelect className='mb-2' onChange={(x) => { selected_interface.selected_offerings_setter(prev => prev.map((val, i) => i == crs_i ? trivial_offering_selection(crs_i, Number(x.target.value), selected_interface.offerings) : { ...val })) }}>
                                        {selected_interface.offerings[crs_i].map((_, associated) => (
                                          <option key={associated} value={associated}>{associated + 1}</option>)
                                        )}
                                      </FormSelect>
                                    </>}
                                  {selected_interface.selected_offerings[crs_i].lec == null ? <></> :
                                    <>
                                      <FormLabel>lec:</FormLabel>
                                      <FormSelect className='mb-2' onChange={(x) => { selected_interface.selected_offerings_setter(prev => prev.map((val, index) => crs_i == index ? { ...val, lec: x.target.value } : { ...val })) }}>
                                        {selected_interface.offerings[crs_i][selected_interface.selected_offerings[crs_i].associated ?? 0].classes.lecs.map((lec, acc) => (
                                          <option key={acc} value={lec}>{lec}</option>)
                                        )}
                                      </FormSelect>
                                    </>}
                                  {selected_interface.selected_offerings[crs_i].tut == null ? <></> :
                                    <>
                                      <FormLabel>tut:</FormLabel>
                                      <FormSelect className='mb-2' onChange={(x) => { selected_interface.selected_offerings_setter(prev => prev.map((val, index) => crs_i == index ? { ...val, tut: x.target.value } : { ...val })) }}>
                                        {selected_interface.offerings[crs_i][selected_interface.selected_offerings[crs_i].associated ?? 0].classes.tuts.map((tut, acc) => (
                                          <option key={acc} value={tut}>{tut}</option>)
                                        )}
                                      </FormSelect>
                                    </>}
                                  {selected_interface.selected_offerings[crs_i].lab == null ? <></> :
                                    <>
                                      <FormLabel>lab:</FormLabel>
                                      <FormSelect className='mb-2' onChange={(x) => { selected_interface.selected_offerings_setter(prev => prev.map((val, index) => crs_i == index ? { ...val, lab: x.target.value } : { ...val })) }}>
                                        {selected_interface.offerings[crs_i][selected_interface.selected_offerings[crs_i].associated ?? 0].classes.labs.map((lab, acc) => (
                                          <option key={acc} value={lab}>{lab}</option>)
                                        )}
                                      </FormSelect>
                                    </>}
                                  {selected_interface.selected_offerings[crs_i].sem == null ? <></> :
                                    <>
                                      <FormLabel>sem:</FormLabel>
                                      <FormSelect className='mb-2' onChange={(x) => { selected_interface.selected_offerings_setter(prev => prev.map((val, index) => crs_i == index ? { ...val, sem: x.target.value } : { ...val })) }}>
                                        {selected_interface.offerings[crs_i][selected_interface.selected_offerings[crs_i].associated ?? 0].classes.sems.map((sem, acc) => (
                                          <option key={acc} value={sem}>{sem}</option>)
                                        )}
                                      </FormSelect>
                                    </>}
                                </>
                            }
                          </Card.Body>
                          <Card.Footer>
                            <Button className='' variant='danger' size='sm' disabled={selected_interface.loading} onClick={ // remove a course from the selected list
                              () => selected_interface.remove_course(crs)}
                            >(-)</Button>
                          </Card.Footer>
                        </Card>
                      </Col>)}
                  </Row>
                </Container>}
            </Col>
          </Row>
          <Row>
            <Col>
              <Button className='form-control mb-3 bs-extended-button' variant='success' disabled={selected_interface.loading || current_interface.isloading}
                onClick={() => {
                  // save this courseload into db
                  current_interface.update_current_courses({
                    courses:
                      selected_interface.selected_offerings.flatMap((x, index) =>
                        (x.lec != null ? [{
                          department: selected_interface.selected[index].department,
                          course_number: selected_interface.selected[index].course_number,
                          section: x.lec
                        }] : []).concat(
                          x.tut != null ? [{
                            department: selected_interface.selected[index].department,
                            course_number: selected_interface.selected[index].course_number,
                            section: x.tut
                          }] : []).concat(
                            x.lab != null ? [{
                              department: selected_interface.selected[index].department,
                              course_number: selected_interface.selected[index].course_number,
                              section: x.lab
                            }] : []).concat(
                              x.sem != null ? [{
                                department: selected_interface.selected[index].department,
                                course_number: selected_interface.selected[index].course_number,
                                section: x.sem
                              }] : [])
                      )
                  })
                }}>overwrite saved course load with selected course load</Button>
            </Col>
          </Row>
        </Container>
      </Form>
      <footer className='m-3'>
      </footer>
    </div >
  )
}
