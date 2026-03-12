"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var supabase_js_1 = require("@supabase/supabase-js");
var crypto_1 = require("crypto");
var dotenv = require("dotenv");
var path_1 = require("path");
dotenv.config({ path: (0, path_1.resolve)(process.cwd(), '.env') });
var supabaseUrl = process.env.VITE_SUPABASE_URL;
var supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY; // USE SERVICE ROLE TO BYPASS RLS
if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase env vars");
}
var supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
function patchSyndromicData() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, oldCases, delCheckErr, idsToDelete, delErr, _b, nerulPatients, pError, now, susceptiblePts, ptsPool, newRecords, defaultOrgId, defaultStaffId, i, p, date, insErr;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    console.log("Connected as Service Role.");
                    return [4 /*yield*/, supabase
                            .from('medical_records')
                            .select('id')
                            .ilike('title', '%syndromic%')];
                case 1:
                    _a = _c.sent(), oldCases = _a.data, delCheckErr = _a.error;
                    if (delCheckErr) {
                        console.error("Error fetching old cases:", delCheckErr);
                        return [2 /*return*/];
                    }
                    if (!(oldCases && oldCases.length > 0)) return [3 /*break*/, 3];
                    idsToDelete = oldCases.map(function (c) { return c.id; });
                    return [4 /*yield*/, supabase.from('medical_records').delete().in('id', idsToDelete)];
                case 2:
                    delErr = (_c.sent()).error;
                    if (delErr) {
                        console.error("Error deleting old cases:", delErr);
                        return [2 /*return*/];
                    }
                    console.log("Deleted ".concat(idsToDelete.length, " old syndromic records."));
                    return [3 /*break*/, 4];
                case 3:
                    console.log("No old syndromic cases found to delete.");
                    _c.label = 4;
                case 4: return [4 /*yield*/, supabase
                        .from('patients')
                        .select('*')
                        .or('ward_name.eq.Nerul,city.eq.Navi Mumbai')];
                case 5:
                    _b = _c.sent(), nerulPatients = _b.data, pError = _b.error;
                    if (pError || !nerulPatients || nerulPatients.length === 0) {
                        console.error("Failed to find Nerul/Navi Mumbai patients for syndromic seeding.", pError);
                        return [2 /*return*/];
                    }
                    now = new Date();
                    susceptiblePts = nerulPatients.filter(function (p) {
                        if (!p.date_of_birth)
                            return true;
                        var dob = new Date(p.date_of_birth);
                        var age = now.getFullYear() - dob.getFullYear();
                        return (age >= 5 && age <= 15) || (age >= 20 && age <= 45);
                    });
                    ptsPool = susceptiblePts.length > 0 ? susceptiblePts : nerulPatients;
                    console.log("Found ".concat(ptsPool.length, " targetable susceptible patients."));
                    newRecords = [];
                    defaultOrgId = '057935f0-817b-4c40-862c-7b44ecfb1eaf';
                    defaultStaffId = 'a43f5996-e4bd-4147-b016-113cf95e9f77';
                    for (i = 0; i < 15; i++) {
                        p = ptsPool[Math.floor(Math.random() * ptsPool.length)];
                        date = new Date(2026, 2, Math.floor(Math.random() * 4) + 7);
                        newRecords.push({
                            id: (0, crypto_1.randomUUID)(),
                            patient_id: p.id,
                            record_type: 'Clinical Note',
                            title: 'Initial Evaluation (Syndromic)',
                            description: "Patient presents with acute high-grade fever (103\u00B0F), severe frontal headache, prominent retro-orbital pain (pain behind the eyes), and intense myalgia/arthralgia ('breakbone fever'). Mild petechial rash appearing on extremities. Suspected Dengue Fever; pending NS1 antigen and IgG/IgM lab confirmation.",
                            diagnosis: null,
                            icd_code: null,
                            icd_label: null,
                            created_by: p.created_by || defaultStaffId,
                            creator_name: 'Dr. Asha Pawar', // Assuming generic placeholder
                            organization_id: p.organization_id || defaultOrgId,
                            status: 'ACTIVE',
                            created_at: date.toISOString()
                        });
                    }
                    return [4 /*yield*/, supabase.from('medical_records').insert(newRecords)];
                case 6:
                    insErr = (_c.sent()).error;
                    if (insErr) {
                        console.error("Error inserting new records:", insErr);
                        return [2 /*return*/];
                    }
                    console.log("Successfully injected 15 Syndromic Dengue Cases into Navi Mumbai (Nerul)!!!");
                    return [2 /*return*/];
            }
        });
    });
}
patchSyndromicData().catch(function (e) { return console.error("Uncaught FATAL:", e); });
