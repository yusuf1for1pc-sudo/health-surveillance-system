import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, AlertCircle, Sparkles, Check } from "lucide-react";

interface AllergyWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOverride: () => void;
  allergyData: {
    medicineName: string;
    allergen: string;
    description?: string;
    alternatives: string[];
  } | null;
}

const AllergyWarningModal: React.FC<AllergyWarningModalProps> = ({
  isOpen,
  onClose,
  onOverride,
  allergyData,
}) => {
  if (!allergyData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
        <div className="bg-white p-8">
          <DialogHeader className="flex flex-row items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center shrink-0">
               <X className="w-6 h-6 text-red-500" />
            </div>
            <div className="flex flex-col text-left">
              <DialogTitle className="text-2xl font-bold text-slate-900 leading-tight">
                Clinical Warning
              </DialogTitle>
              <DialogDescription className="text-slate-500 mt-1">
                Please review the following safety concerns.
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Main Risk Box */}
            <div className="bg-red-50/50 border border-red-100 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded tracking-wider">
                  HIGH RISK
                </span>
                <h4 className="font-bold text-slate-900">Allergy Detected</h4>
              </div>
              
              <p className="text-slate-600 text-sm leading-relaxed">
                Patient has a documented allergy to <span className="font-bold uppercase">{allergyData.allergen}</span>. 
                Prescribing <span className="font-semibold">{allergyData.medicineName}</span> is contraindicated.
              </p>

              {/* Alternatives Section */}
              <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-bold text-purple-600">Safe Medical Alternatives</span>
                </div>
                <ul className="space-y-2">
                  {allergyData.alternatives.map((alt, index) => (
                    <li key={index} className="flex items-center gap-2 text-slate-700 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                      {alt}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Medicine Chip */}
              <div className="pt-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                  {allergyData.medicineName}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button 
                variant="outline" 
                onClick={onClose}
                className="flex-1 h-12 rounded-xl text-slate-700 font-bold border-slate-200 hover:bg-slate-50 transition-all"
              >
                Cancel & Revise
              </Button>
              <Button 
                onClick={onOverride}
                className="flex-[1.5] h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-200 border-none transition-all"
              >
                Override & Add Medicine Anyway
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AllergyWarningModal;
