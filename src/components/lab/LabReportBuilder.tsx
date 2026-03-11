import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronDown, ChevronRight, Plus, Trash2, FlaskConical, X, User } from 'lucide-react';
import {
    TEST_PANELS, CUSTOM_PANEL,
    interpretValue, getRefRangeText, STATUS_COLORS,
    type TestPanel, type TestField, type LabTestPanelData, type LabTestValue
} from '@/data/labTestPanels';

interface LabReportBuilderProps {
    patientName?: string;
    patientAge?: number | null;
    patientId?: string;
    patientGender: 'Male' | 'Female' | 'Other';
    labName?: string;
    doctorName?: string;
    panels: LabTestPanelData[];
    setPanels: (panels: LabTestPanelData[]) => void;
    notes: string;
    setNotes: (v: string) => void;
}

interface CustomField {
    key: string;
    label: string;
    unit: string;
}

export default function LabReportBuilder({
    patientName, patientAge, patientId, patientGender, labName, doctorName, panels, setPanels, notes, setNotes,
}: LabReportBuilderProps) {
    const [expandedPanels, setExpandedPanels] = useState<Set<string>>(new Set());
    const [showPanelPicker, setShowPanelPicker] = useState(false);
    const [customFields, setCustomFields] = useState<Record<string, CustomField[]>>({});
    const [newCustomField, setNewCustomField] = useState({ label: '', unit: '' });

    const toggleExpand = (panelId: string) => {
        setExpandedPanels(prev => {
            const next = new Set(prev);
            next.has(panelId) ? next.delete(panelId) : next.add(panelId);
            return next;
        });
    };

    const addPanel = (panel: TestPanel) => {
        const panelInstanceId = panel.id === 'custom' ? `custom_${Date.now()}` : panel.id;
        if (panel.id !== 'custom' && panels.some(p => p.panelId === panel.id)) return;
        setPanels([...panels, { panelId: panelInstanceId, values: {} }]);
        setExpandedPanels(prev => new Set(prev).add(panelInstanceId));
        setShowPanelPicker(false);
    };

    const removePanel = (panelId: string) => {
        setPanels(panels.filter(p => p.panelId !== panelId));
        setCustomFields(prev => { const n = { ...prev }; delete n[panelId]; return n; });
    };

    const updateValue = (panelId: string, fieldKey: string, value: string) => {
        setPanels(panels.map(p => {
            if (p.panelId !== panelId) return p;
            const panel = getPanelDef(panelId);
            const field = panel?.fields.find(f => f.key === fieldKey) ||
                customFields[panelId]?.find(f => f.key === fieldKey) as TestField | undefined;
            const status = field ? interpretValue(value, field as TestField, patientGender, patientAge) : undefined;
            return { ...p, values: { ...p.values, [fieldKey]: { value, status } } };
        }));
    };

    const getPanelDef = (panelId: string): TestPanel | undefined => {
        if (panelId.startsWith('custom_')) return { ...CUSTOM_PANEL, id: panelId };
        return TEST_PANELS.find(p => p.id === panelId);
    };

    const addCustomFieldToPanel = (panelId: string) => {
        if (!newCustomField.label) return;
        const key = `custom_${Date.now()}`;
        const field: CustomField = { key, label: newCustomField.label, unit: newCustomField.unit };
        setCustomFields(prev => ({ ...prev, [panelId]: [...(prev[panelId] || []), field] }));
        setNewCustomField({ label: '', unit: '' });
    };

    const removeCustomField = (panelId: string, key: string) => {
        setCustomFields(prev => ({
            ...prev,
            [panelId]: (prev[panelId] || []).filter(f => f.key !== key),
        }));
        setPanels(panels.map(p => {
            if (p.panelId !== panelId) return p;
            const newValues = { ...p.values };
            delete newValues[key];
            return { ...p, values: newValues };
        }));
    };

    const addedPanelIds = new Set(panels.map(p => p.panelId.startsWith('custom_') ? 'custom' : p.panelId));

    return (
        <div className="space-y-5">
            {/* Patient Info Banner */}
            <div className="border rounded-xl p-4 bg-primary/5 space-y-3">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                        <User className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-foreground">{patientName || 'Patient'}</h3>
                            {patientId && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-mono">{patientId}</span>}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-sm text-muted-foreground">
                            {patientAge != null && <span>{patientAge} yrs</span>}
                            <span>{patientGender}</span>
                        </div>
                    </div>
                    <FlaskConical className="w-5 h-5 text-primary" />
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                    {labName && <div><span className="text-xs text-muted-foreground">Lab</span><p className="font-medium text-foreground">{labName}</p></div>}
                    {doctorName && <div><span className="text-xs text-muted-foreground">Doctor</span><p className="font-medium text-foreground">{doctorName}</p></div>}
                </div>
                <div>
                    <Label className="text-xs">Notes / Observations</Label>
                    <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any additional notes..." className="h-9 mt-1" />
                </div>
            </div>

            {/* Added Test Panels */}
            {panels.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-foreground">Test Panels Added</h4>
                    {panels.map(panelData => {
                        const def = getPanelDef(panelData.panelId);
                        if (!def) return null;
                        const isCustom = panelData.panelId.startsWith('custom_');
                        const isExpanded = expandedPanels.has(panelData.panelId);

                        const filled = Object.values(panelData.values).filter(v => v.value).length;
                        const abnormal = Object.values(panelData.values).filter(v => v.status === 'abnormal').length;

                        return (
                            <div key={panelData.panelId} className="border rounded-xl overflow-hidden bg-card">
                                {/* Accordion Header */}
                                <div
                                    className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                                    onClick={() => toggleExpand(panelData.panelId)}
                                >
                                    <div className="flex items-center gap-2">
                                        {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                                        <span className="font-medium text-foreground text-sm">{isCustom ? 'Custom Test Panel' : def.name}</span>
                                        {filled > 0 && (
                                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{filled} filled</span>
                                        )}
                                        {abnormal > 0 && (
                                            <span className="text-xs bg-red-500/10 text-red-600 px-2 py-0.5 rounded-full">{abnormal} abnormal</span>
                                        )}
                                    </div>
                                    <Button type="button" variant="ghost" size="sm"
                                        className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={e => { e.stopPropagation(); removePanel(panelData.panelId); }}>
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>

                                {/* Accordion Body */}
                                {isExpanded && (
                                    <div className="border-t px-3 pb-3">
                                        <div className="grid grid-cols-12 gap-2 py-2 text-xs font-medium text-muted-foreground border-b">
                                            <div className="col-span-4">Test</div>
                                            <div className="col-span-3">Value</div>
                                            <div className="col-span-2">Unit</div>
                                            <div className="col-span-2">Ref. Range</div>
                                            <div className="col-span-1">Status</div>
                                        </div>

                                        {def.fields.map(field => {
                                            const val = panelData.values[field.key];
                                            const status = val?.status;
                                            const colors = status ? STATUS_COLORS[status] : null;
                                            return (
                                                <div key={field.key} className={`grid grid-cols-12 gap-2 py-1.5 items-center ${colors ? colors.bg : ''} rounded px-1 my-0.5`}>
                                                    <div className="col-span-4 text-sm text-foreground">{field.label}</div>
                                                    <div className="col-span-3">
                                                        <Input
                                                            value={val?.value || ''}
                                                            onChange={e => updateValue(panelData.panelId, field.key, e.target.value)}
                                                            className="h-7 text-sm"
                                                            placeholder="—"
                                                        />
                                                    </div>
                                                    <div className="col-span-2 text-xs text-muted-foreground">{field.unit}</div>
                                                    <div className="col-span-2 text-xs text-muted-foreground">{getRefRangeText(field, patientGender, patientAge)}</div>
                                                    <div className="col-span-1 flex justify-center">
                                                        {status && <div className={`w-2.5 h-2.5 rounded-full ${colors!.dot}`} title={status} />}
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {(customFields[panelData.panelId] || []).map(cf => {
                                            const val = panelData.values[cf.key];
                                            return (
                                                <div key={cf.key} className="grid grid-cols-12 gap-2 py-1.5 items-center px-1 my-0.5">
                                                    <div className="col-span-4 text-sm text-foreground flex items-center gap-1">
                                                        {cf.label}
                                                        <button type="button" onClick={() => removeCustomField(panelData.panelId, cf.key)} className="text-muted-foreground hover:text-destructive">
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                    <div className="col-span-3">
                                                        <Input value={val?.value || ''} onChange={e => updateValue(panelData.panelId, cf.key, e.target.value)} className="h-7 text-sm" placeholder="—" />
                                                    </div>
                                                    <div className="col-span-2 text-xs text-muted-foreground">{cf.unit}</div>
                                                    <div className="col-span-2 text-xs text-muted-foreground">—</div>
                                                    <div className="col-span-1" />
                                                </div>
                                            );
                                        })}

                                        {isCustom && (
                                            <div className="grid grid-cols-12 gap-2 pt-2 mt-2 border-t items-end">
                                                <div className="col-span-4">
                                                    <Input value={newCustomField.label} onChange={e => setNewCustomField({ ...newCustomField, label: e.target.value })}
                                                        placeholder="Test Name" className="h-7 text-sm" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomFieldToPanel(panelData.panelId); } }} />
                                                </div>
                                                <div className="col-span-3">
                                                    <Input value={newCustomField.unit} onChange={e => setNewCustomField({ ...newCustomField, unit: e.target.value })}
                                                        placeholder="Unit" className="h-7 text-sm" />
                                                </div>
                                                <div className="col-span-5">
                                                    <Button type="button" size="sm" variant="secondary" className="h-7 text-xs" onClick={() => addCustomFieldToPanel(panelData.panelId)} disabled={!newCustomField.label}>
                                                        <Plus className="w-3 h-3 mr-1" /> Add Row
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add Test Panel button */}
            <div className="relative">
                <Button type="button" variant="outline" className="w-full border-dashed h-10 gap-2" onClick={() => setShowPanelPicker(!showPanelPicker)}>
                    <Plus className="w-4 h-4" /> Add Test Panel
                </Button>

                {showPanelPicker && (
                    <div className="absolute z-50 left-0 right-0 mt-1 bg-card border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                        {TEST_PANELS.map(panel => {
                            const added = addedPanelIds.has(panel.id);
                            return (
                                <button key={panel.id} type="button" disabled={added}
                                    className={`w-full text-left px-4 py-2.5 hover:bg-muted/50 transition-colors border-b last:border-0 flex justify-between items-center ${added ? 'opacity-40' : ''}`}
                                    onClick={() => addPanel(panel)}
                                >
                                    <div>
                                        <span className="text-sm font-medium text-foreground">{panel.name}</span>
                                        <span className="text-xs text-muted-foreground ml-2">({panel.fields.length} tests)</span>
                                    </div>
                                    {added && <span className="text-xs text-muted-foreground">Added</span>}
                                </button>
                            );
                        })}
                        <button type="button"
                            className="w-full text-left px-4 py-2.5 hover:bg-muted/50 transition-colors border-t"
                            onClick={() => addPanel(CUSTOM_PANEL)}>
                            <span className="text-sm font-medium text-foreground">Custom Test Panel</span>
                            <span className="text-xs text-muted-foreground ml-2">(add your own tests)</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
