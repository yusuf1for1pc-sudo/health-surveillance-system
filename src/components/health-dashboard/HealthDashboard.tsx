
import React from 'react';
import StatsPanel from './StatsPanel';
import TrendPanel from './TrendPanel';
import HeatmapPanel from './HeatmapPanel';
import TopDiseasesPanel from './TopDiseasesPanel';
import LocationComparisonPanel from './LocationComparisonPanel';
import AgeDistributionPanel from './AgeDistributionPanel';
import { ShieldAlert } from 'lucide-react';

const DashboardLayout: React.FC = () => {
    return (
        <div className="min-h-screen bg-muted/50 p-6 font-sans">

            {/* Header */}
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-900 p-2 rounded-lg">
                        <ShieldAlert className="h-8 w-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Health Command Center</h1>
                        <p className="text-muted-foreground text-sm">Real-time Disease Surveillance & Analytics</p>
                    </div>
                </div>
                <div className="mt-4 md:mt-0 flex gap-3">
                    <select className="bg-card border border-foreground/30 rounded-md px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring">
                        <option>All Regions</option>
                        <option>Mumbai</option>
                        <option>Pune</option>
                        <option>Nashik</option>
                        <option>Nagpur</option>
                    </select>
                    <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm font-medium shadow-sm transition-colors">
                        Generate Report
                    </button>
                </div>
            </header>

            {/* Key Stats Row */}
            <StatsPanel />

            {/* Main Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

                {/* Left Column - Heatmap (Takes up 2 columns) */}
                <HeatmapPanel />

                {/* Right Column - Top Diseases & Age Dist */}
                <div className="space-y-6">
                    <TopDiseasesPanel />
                    <AgeDistributionPanel />
                </div>
            </div>

            {/* Bottom Row - Trends & Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-10">
                <TrendPanel />
                <LocationComparisonPanel />
            </div>

        </div>
    );
};

export default DashboardLayout;
