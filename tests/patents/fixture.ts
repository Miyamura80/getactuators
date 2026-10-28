import type { FamilyRow } from "../../scripts/patents/aggregate";
import { aggregate } from "../../scripts/patents/aggregate";

// Synthetic family rows for tests only. They exercise the aggregation and
// the views; they are not patent data and never reach the committed
// snapshot.

function rows(): FamilyRow[] {
    const out: FamilyRow[] = [];
    let n = 0;
    const add = (
        year: number,
        assignee: string | null,
        country: string | null,
        technologies: string,
        count: number,
    ) => {
        for (let i = 0; i < count; i++) {
            n += 1;
            out.push({
                family_id: `fx-${n}`,
                priority_date: `${year}0${(i % 9) + 1}15`,
                publication: `XX-${n}-A1`,
                title: `Test family ${n}`,
                assignee,
                country,
                technologies,
            });
        }
    };
    add(2018, "HARMONIC DRIVE SYSTEMS INC", "JP", "strain-wave", 10);
    add(2021, "HARMONIC DRIVE LLC", "US", "strain-wave", 20);
    add(2021, "LEADERDRIVE CO LTD", "CN", "strain-wave,robot-joints", 5);
    add(2024, "ACME GEARS GMBH", "DE", "strain-wave", 3);
    add(2025, "ACME GEARS GMBH", "DE", "strain-wave", 2);
    add(2020, null, null, "ndfeb", 4);
    return out;
}

export const FIXTURE_ROWS = rows();
export const FIXTURE = aggregate(FIXTURE_ROWS, "2026-10-01");
