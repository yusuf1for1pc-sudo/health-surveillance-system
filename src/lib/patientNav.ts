import type { RecordType } from "@/lib/types";

/** The three patient sections a medical record can live in. */
export type PatientSection = "history" | "prescriptions" | "reports";

export const SECTION_LABELS: Record<PatientSection, string> = {
  history: "History",
  prescriptions: "Prescriptions",
  reports: "Reports",
};

/** Each record type belongs to exactly one section; clinical notes stay in History. */
export const sectionFor = (type: RecordType | string): PatientSection =>
  type === "Prescription" ? "prescriptions" : type === "Lab Report" ? "reports" : "history";

/** The page that opens when a record is tapped: its own section, never History by default. */
export const recordPath = (r: { id: string; record_type: RecordType | string }) =>
  `/patient/${sectionFor(r.record_type)}/${r.id}`;

export const sectionFromPath = (pathname: string): PatientSection => {
  const seg = pathname.split("/")[2];
  return seg === "prescriptions" || seg === "reports" ? seg : "history";
};

/** Record-type tags are plain black/white (they follow the theme), distinguished by their label and icon. */
export const TYPE_STYLES: Record<string, string> = {
  Prescription: "border-foreground/30 text-foreground",
  "Lab Report": "border-foreground/30 text-foreground",
  "Clinical Note": "border-foreground/30 text-foreground",
};
