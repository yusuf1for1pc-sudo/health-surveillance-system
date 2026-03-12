import React, { useMemo } from 'react';
import { analyzePatient, CDSSInsights } from '@/lib/cdssEngine';
import { Patient, MedicalRecord } from '@/lib/types';
import { Brain, AlertTriangle, Stethoscope, TestTube, Lightbulb } from 'lucide-react';

interface CDSSPanelProps {
  patient: Patient | null;
  records: MedicalRecord[];
}

const CDSSPanel: React.FC<CDSSPanelProps> = ({ patient, records }) => {
  const insights: CDSSInsights = useMemo(() => analyzePatient(patient, records), [patient, records]);

  const hasInsights = insights.warnings.length > 0 || insights.possibleDiagnoses.length > 0 || insights.recommendedTests.length > 0;

  if (!hasInsights) {
    return (
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-900/20 rounded-xl p-5 border border-indigo-100 dark:border-indigo-800/50 card-shadow relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl"></div>
        
        <div className="flex items-center gap-3 mb-2 relative z-10">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
            <Brain className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="font-semibold text-indigo-900 dark:text-indigo-100 flex items-center gap-2">
            AI Clinical Assistant <span className="text-[10px] bg-indigo-200 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Active</span>
          </h3>
        </div>
        <p className="text-sm text-indigo-700/80 dark:text-indigo-300/80 mt-2 relative z-10 flex items-start gap-2">
           <Lightbulb className="w-4 h-4 mt-0.5 shrink-0" />
           Monitoring patient data for potential insights. No immediate clinical recommendations found based on recent records.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800/50 card-shadow overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-indigo-100 dark:border-indigo-800/50 flex items-center justify-between bg-white/50 dark:bg-black/20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
            <Brain className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="font-semibold text-indigo-900 dark:text-indigo-100">AI Clinical Assistant</h3>
        </div>
        <span className="text-[10px] bg-indigo-600 text-white px-2 py-1 rounded-full font-bold uppercase tracking-wide">
          Insights Generated
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* Warnings Section */}
        {insights.warnings.length > 0 && (
          <div className="space-y-2">
             <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-medium text-sm">
                <AlertTriangle className="w-4 h-4" />
                <h4>Early Warnings</h4>
             </div>
             <ul className="space-y-1.5">
               {insights.warnings.map((warning, i) => (
                 <li key={i} className="text-sm bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 px-3 py-2 rounded-md border border-rose-100 dark:border-rose-500/20 list-disc list-inside">
                   {warning}
                 </li>
               ))}
             </ul>
          </div>
        )}

        {/* Diagnoses Section */}
        {insights.possibleDiagnoses.length > 0 && (
          <div className="space-y-2">
             <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 font-medium text-sm">
                <Stethoscope className="w-4 h-4" />
                <h4>Possible Diagnoses (Based on Symptoms)</h4>
             </div>
             <div className="flex flex-wrap gap-2">
               {insights.possibleDiagnoses.map((dx, i) => (
                 <span key={i} className="text-sm bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-500/30">
                   {dx}
                 </span>
               ))}
             </div>
          </div>
        )}

        {/* Tests Section */}
        {insights.recommendedTests.length > 0 && (
          <div className="space-y-2">
             <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium text-sm">
                <TestTube className="w-4 h-4" />
                <h4>Recommended Diagnostic Tests</h4>
             </div>
             <div className="flex flex-wrap gap-2">
               {insights.recommendedTests.map((test, i) => (
                 <span key={i} className="text-sm bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-500/30">
                   {test}
                 </span>
               ))}
             </div>
          </div>
        )}
      </div>

      <div className="px-5 py-3 bg-indigo-50/50 dark:bg-indigo-900/10 border-t border-indigo-100 dark:border-indigo-800/50 text-[11px] text-indigo-500/80 dark:text-indigo-400/60 text-center">
        Disclaimer: This is an AI assistant tool. Final medical decisions must be made by a qualified healthcare professional.
      </div>
    </div>
  );
};

export default CDSSPanel;
