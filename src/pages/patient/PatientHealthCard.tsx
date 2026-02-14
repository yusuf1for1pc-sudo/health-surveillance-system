import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { useMemo } from "react";

// Deterministic QR-like pattern from a seed string
const generateQrPattern = (seed: string) => {
  const grid: boolean[][] = [];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  for (let row = 0; row < 9; row++) {
    grid[row] = [];
    for (let col = 0; col < 9; col++) {
      // Corner anchors
      if ((row < 3 && col < 3) || (row < 3 && col > 5) || (row > 5 && col < 3)) {
        grid[row][col] = (row === 0 || row === 2 || col === 0 || col === 2 || col === 6 || col === 8 || row === 6 || row === 8)
          ? true
          : (row === 1 && col === 1) || (row === 1 && col === 7) || (row === 7 && col === 1);
      } else {
        hash = ((hash * 31) + row * 7 + col * 13) | 0;
        grid[row][col] = (hash & (1 << (col + row))) !== 0;
      }
    }
  }
  return grid;
};

const PatientHealthCard = () => {
  const patientId = "TMP-2026-0042";
  const qrGrid = useMemo(() => generateQrPattern(patientId), [patientId]);

  return (
    <DashboardLayout role="patient">
      <PageHeader title="Health Card" description="Your digital patient identification" />

      <div className="flex justify-center">
        <div className="w-full max-w-sm">
          <div className="bg-card rounded-2xl p-6 sm:p-8 card-shadow border text-center">
            {/* Logo */}
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4">
              <span className="text-primary-foreground font-bold">T</span>
            </div>

            {/* Patient info */}
            <h2 className="font-semibold text-foreground text-xl">John Doe</h2>
            <p className="text-sm text-muted-foreground mt-1">Patient ID: {patientId}</p>
            <div className="flex justify-center gap-4 mt-3 text-xs text-muted-foreground">
              <span>DOB: 1990-05-14</span>
              <span>Blood: O+</span>
            </div>

            {/* QR Code */}
            <div className="mt-6 mx-auto w-52 h-52 sm:w-56 sm:h-56 bg-background rounded-xl p-3 border flex items-center justify-center">
              <div className="grid grid-cols-9 gap-[3px] w-full h-full">
                {qrGrid.flat().map((filled, i) => (
                  <div
                    key={i}
                    className={`rounded-[2px] aspect-square ${filled ? "bg-foreground" : "bg-transparent"}`}
                  />
                ))}
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-4">Scan to verify patient identity</p>

            {/* Additional info */}
            <div className="mt-6 pt-4 border-t space-y-2 text-sm text-left">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone</span>
                <span className="text-foreground font-medium">+1 555-0142</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Emergency</span>
                <span className="text-foreground font-medium">+1 555-0199</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Allergies</span>
                <span className="text-foreground font-medium">Penicillin</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PatientHealthCard;
