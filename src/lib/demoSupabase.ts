import { mockPatients, mockRecords, mockOrganizations, mockStaff, mockPrescriptions, mockLabReports } from '@/lib/mockData';
import { DEMO_ACCOUNTS, DEMO_PATIENT_AUTH_ID } from '@/lib/demoAccounts';

/**
 * Minimal in-memory stand-in for `supabase.from(table)` while a demo account is signed in.
 * Supports the chain used by the app: select / insert / update / delete, eq / neq / in / is /
 * gt / gte / lt / lte / ilike / not, order, limit, range, single / maybeSingle, and
 * `select(cols, { count: 'exact', head: true })`. Writes live in memory for the page session.
 */
type Row = Record<string, any>;

const tables: Record<string, Row[]> = {
    patients: mockPatients as unknown as Row[],
    medical_records: mockRecords as unknown as Row[],
    organizations: mockOrganizations as unknown as Row[],
    prescriptions: [...(mockPrescriptions as Row[])],
    lab_reports: [...(mockLabReports as Row[])],
    profiles: [
        ...(mockStaff as unknown as Row[]),
        ...DEMO_ACCOUNTS.map(a => ({ ...a.user, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' })),
    ],
};

const tableRows = (name: string): Row[] => (tables[name] ??= []);

const newId = () =>
    (typeof crypto !== 'undefined' && 'randomUUID' in crypto) ? crypto.randomUUID() : `demo-${Math.random().toString(36).slice(2)}`;

// Embedded relations used by `select('*, rel(cols)')`: parent table -> relation -> join keys
const RELATIONS: Record<string, Record<string, { table: string; local: string; foreign: string }>> = {
    prescriptions: { medical_records: { table: 'medical_records', local: 'record_id', foreign: 'id' } },
    lab_reports: { medical_records: { table: 'medical_records', local: 'record_id', foreign: 'id' } },
    medical_records: {
        profiles: { table: 'profiles', local: 'created_by', foreign: 'id' },
        patients: { table: 'patients', local: 'patient_id', foreign: 'id' },
    },
};

interface Embed { alias: string; rel: string; inner: boolean; hintCol?: string; cols: string }

/** Parses the embedded-resource parts of a select string, e.g. `a, medical_records!inner(x, profiles:created_by(y))`. */
const parseEmbeds = (cols?: string): Embed[] => {
    if (!cols || !cols.includes('(')) return [];
    const parts: string[] = [];
    let depth = 0, cur = '';
    for (const ch of cols) {
        if (ch === '(') depth++;
        if (ch === ')') depth--;
        if (ch === ',' && depth === 0) { parts.push(cur); cur = ''; } else cur += ch;
    }
    parts.push(cur);
    const out: Embed[] = [];
    for (const part of parts) {
        const m = part.trim().match(/^(?:(\w+):)?(\w+)(?:!(\w+))?\s*\(([\s\S]*)\)$/);
        if (!m) continue;
        const [, alias, rel, hint, inner] = m;
        // `profiles:created_by (...)` is alias:foreignKeyColumn; `rel!inner` is an inner join
        out.push({ alias: alias && rel !== alias ? rel : rel, rel: alias ? alias : rel, inner: hint === 'inner', hintCol: alias ? rel : undefined, cols: inner });
    }
    return out;
};

interface Result { data: any; error: any; count: number | null }

class DemoQuery implements PromiseLike<Result> {
    private op: 'select' | 'insert' | 'update' | 'delete' = 'select';
    private payload: Row | Row[] | null = null;
    private filters: ((r: Row) => boolean)[] = [];
    private head = false;
    private wantCount = false;
    private returning = false;
    private mode: 'many' | 'single' | 'maybe' = 'many';
    private orderBy: { col: string; asc: boolean } | null = null;
    private limitN: number | null = null;
    private from_ = 0;
    private cols = '';
    private embedEq: { rel: string; col: string; value: any }[] = [];

    constructor(private table: string) { }

    select(_cols?: string, opts?: { count?: string; head?: boolean }) {
        if (this.op === 'select') {
            this.cols = _cols || '';
            this.head = !!opts?.head;
            this.wantCount = !!opts?.count;
        } else {
            this.returning = true;
        }
        return this;
    }
    insert(values: Row | Row[]) { this.op = 'insert'; this.payload = values; return this; }
    update(values: Row) { this.op = 'update'; this.payload = values; return this; }
    upsert(values: Row | Row[]) { return this.insert(values); }
    delete() { this.op = 'delete'; return this; }

    eq(col: string, v: any) {
        if (col.includes('.')) {
            // filter on an embedded relation, e.g. eq('medical_records.patient_id', id)
            const [rel, c] = col.split('.');
            this.embedEq.push({ rel, col: c, value: v });
            return this;
        }
        this.filters.push(r => r[col] === v);
        return this;
    }
    neq(col: string, v: any) { this.filters.push(r => r[col] !== v); return this; }
    in(col: string, vs: any[]) { this.filters.push(r => vs.includes(r[col])); return this; }
    is(col: string, v: any) { this.filters.push(r => (r[col] ?? null) === v); return this; }
    gt(col: string, v: any) { this.filters.push(r => r[col] > v); return this; }
    gte(col: string, v: any) { this.filters.push(r => r[col] >= v); return this; }
    lt(col: string, v: any) { this.filters.push(r => r[col] < v); return this; }
    lte(col: string, v: any) { this.filters.push(r => r[col] <= v); return this; }
    ilike(col: string, pattern: string) {
        const needle = pattern.replace(/%/g, '').toLowerCase();
        this.filters.push(r => String(r[col] ?? '').toLowerCase().includes(needle));
        return this;
    }
    not(col: string, _op: string, v: any) { this.filters.push(r => r[col] !== v); return this; }
    or(_expr: string) { return this; } // not needed offline; keep chain valid
    order(col: string, opts?: { ascending?: boolean }) { this.orderBy = { col, asc: opts?.ascending !== false }; return this; }
    limit(n: number) { this.limitN = n; return this; }
    range(from: number, to: number) { this.from_ = from; this.limitN = to - from + 1; return this; }
    single() { this.mode = 'single'; return this; }
    maybeSingle() { this.mode = 'maybe'; return this; }

    private run(): Result {
        const rows = tableRows(this.table);
        const match = (r: Row) => this.filters.every(f => f(r));

        if (this.op === 'insert') {
            const list = (Array.isArray(this.payload) ? this.payload : [this.payload ?? {}]).map(v => ({
                id: newId(), created_at: new Date().toISOString(), ...v,
            }));
            rows.push(...list);
            return this.shape(this.returning ? list : null, list.length);
        }
        if (this.op === 'update') {
            const hit = rows.filter(match);
            hit.forEach(r => Object.assign(r, this.payload, { updated_at: new Date().toISOString() }));
            return this.shape(this.returning ? hit : null, hit.length);
        }
        if (this.op === 'delete') {
            const hit = rows.filter(match);
            hit.forEach(r => rows.splice(rows.indexOf(r), 1));
            return this.shape(this.returning ? hit : null, hit.length);
        }

        let out = rows.filter(match);
        out = this.withEmbeds(out);
        const total = out.length;
        if (this.orderBy) {
            const { col, asc } = this.orderBy;
            out = [...out].sort((a, b) => (a[col] > b[col] ? 1 : a[col] < b[col] ? -1 : 0) * (asc ? 1 : -1));
        }
        if (this.limitN !== null) out = out.slice(this.from_, this.from_ + this.limitN);
        return this.shape(this.head ? null : out, total);
    }

    /** Resolves embedded relations (as arrays, the shape the app reads) and inner-join filters. */
    private withEmbeds(parents: Row[]): Row[] {
        const embeds = parseEmbeds(this.cols);
        const needed = new Set([...embeds.map(e => e.rel), ...this.embedEq.map(f => f.rel)]);
        if (needed.size === 0) return parents;

        const resolve = (parent: Row, table: string, rel: string, hintCol?: string): Row[] => {
            const def = RELATIONS[table]?.[rel] ?? RELATIONS[table]?.[rel.replace(/s$/, '')];
            if (!def) return [];
            const key = hintCol ?? def.local;
            return tableRows(def.table).filter(c => c[def.foreign] === parent[key]);
        };

        const result: Row[] = [];
        for (const parent of parents) {
            const copy: Row = { ...parent };
            let keep = true;
            for (const e of embeds) {
                let related = resolve(parent, this.table, e.rel, e.hintCol);
                for (const f of this.embedEq.filter(x => x.rel === e.rel)) {
                    const wanted = f.col === 'patient_id' && f.value === DEMO_PATIENT_AUTH_ID ? 'pt-demo-swayam' : f.value;
                    related = related.filter(r => r[f.col] === wanted);
                }
                if (e.inner && related.length === 0) keep = false;
                // `profiles:created_by(...)` style embeds are single objects, the rest arrays
                copy[e.rel] = e.hintCol ? (related[0] ?? null) : related;
                // nested embeds one level down
                const nested = parseEmbeds(e.cols);
                if (nested.length) {
                    copy[e.rel] = (Array.isArray(copy[e.rel]) ? copy[e.rel] : [copy[e.rel]]).filter(Boolean).map((r: Row) => {
                        const rc: Row = { ...r };
                        for (const n of nested) {
                            const rel2 = resolve(r, e.rel, n.rel, n.hintCol);
                            rc[n.rel] = n.hintCol ? (rel2[0] ?? null) : rel2;
                        }
                        return rc;
                    });
                    if (e.hintCol) copy[e.rel] = copy[e.rel][0] ?? null;
                }
            }
            if (keep) result.push(copy);
        }
        return result;
    }

    private shape(data: Row[] | null, total: number): Result {
        const count = this.wantCount || this.head ? total : null;
        if (data === null) return { data: null, error: null, count };
        if (this.mode === 'many') return { data, error: null, count };
        if (data.length === 0) {
            return this.mode === 'maybe'
                ? { data: null, error: null, count }
                : { data: null, error: { message: 'No rows found (demo data)', code: 'PGRST116' }, count };
        }
        return { data: data[0], error: null, count };
    }

    then<T1 = Result, T2 = never>(
        onfulfilled?: ((value: Result) => T1 | PromiseLike<T1>) | null,
        onrejected?: ((reason: any) => T2 | PromiseLike<T2>) | null,
    ): PromiseLike<T1 | T2> {
        let result: Result;
        try { result = this.run(); } catch (e) { return Promise.reject(e).then(onfulfilled, onrejected); }
        return Promise.resolve(result).then(onfulfilled, onrejected);
    }
}

export const demoFrom = (table: string) => new DemoQuery(table);
export const demoRpc = async () => ({ data: null, error: { message: 'Not available in demo mode' } });
