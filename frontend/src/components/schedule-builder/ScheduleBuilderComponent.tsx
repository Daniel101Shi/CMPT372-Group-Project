import { ScheduleBuilder } from "./ScheduleBuilder/ScheduleBuilder";
import { CoursesContextProvider } from "./SFUCoursesAPISurface/coursesContext";
import { SemestersContextProvider } from "./SFUCoursesAPISurface/semestersContext";
import { YearsContextProvider } from "./SFUCoursesAPISurface/yearsContext";
import { SelectedContextProvider } from "./SFUCoursesAPISurface/selectedContext";
import { CurrentScheduleContextProvider } from "./meAPISurface/currentScheduleContext";

export function ScheduleBuilderComponent() {
  return (
    <YearsContextProvider>
      <SemestersContextProvider>
        <CoursesContextProvider>
          <SelectedContextProvider>
            <CurrentScheduleContextProvider>
              <ScheduleBuilder />
            </CurrentScheduleContextProvider>
          </SelectedContextProvider>
        </CoursesContextProvider>
      </SemestersContextProvider>
    </YearsContextProvider>
  )
}