import { useRef } from "react";
import { useReactToPrint } from "react-to-print";

// Letter size; stack the sidebar above the calendar instead of

// {username} {semester} {year}
// list of courses
// actual calendar

// used AI for PDF export, format and layout

const PRINT_PAGE_STYLE = `
  @page {
    size: letter portrait;
    margin: 0.5in;
  }
  @media print {
    .no-print {
      display: none !important;
    }
    .print-only {
      display: block !important;
    }
    .schedule-print-shell {
      display: flex !important;
      flex-direction: column !important;
      height: auto !important;
    }
    .schedule-calendar {
      height: 7.5in !important;
    }
  }
`;

export function useSchedulePdfExport(documentTitle: string) {
    const printRef = useRef<HTMLDivElement>(null);

    const exportToPdf = useReactToPrint({
        contentRef: printRef,
        documentTitle,
        pageStyle: PRINT_PAGE_STYLE,
    });

    return { printRef, exportToPdf };
}