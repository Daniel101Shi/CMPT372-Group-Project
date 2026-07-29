import { ScheduleBuilder } from "./ScheduleBuilder/ScheduleBuilder";
import { CoursesContextProvider } from "./SFUCoursesAPISurface/coursesContext";
import { SemestersContextProvider } from "./SFUCoursesAPISurface/semestersContext";
import { YearsContextProvider } from "./SFUCoursesAPISurface/yearsContext";
import { SelectedContextProvider } from "./SFUCoursesAPISurface/selectedContext";

export function ScheduleBuilderComponent() {
    return (
        <YearsContextProvider>
            <SemestersContextProvider>
                <CoursesContextProvider>
                    <SelectedContextProvider>
                        <ScheduleBuilder />
                    </SelectedContextProvider>
                </CoursesContextProvider>
            </SemestersContextProvider>
        </YearsContextProvider>
    )
}