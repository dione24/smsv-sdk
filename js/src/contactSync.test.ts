import { describe, expect, it } from "vitest";
import {
  buildImportPayload,
  diffContactsByPhone,
  normalizeContactPhone,
  smsvContactsToCrmExport,
} from "./contactSync";

describe("normalizeContactPhone", () => {
  it("keeps + prefix and strips separators", () => {
    expect(normalizeContactPhone("+223 70 00 00 01")).toBe("+22370000001");
  });

  it("prefixes short local numbers with default country", () => {
    expect(normalizeContactPhone("70000001")).toBe("+22370000001");
  });
});

describe("diffContactsByPhone", () => {
  it("splits onlyInCrm, onlyInSmsv, inBoth", () => {
    const crm = [{ phone: "+22370000001", name: "A" }, { phone: "+22370000002", name: "B" }];
    const smsv = [
      { id: "1", phone: "22370000001" },
      { id: "2", phone: "+22379999999" },
    ];
    const d = diffContactsByPhone(crm, smsv);
    expect(d.inBoth).toHaveLength(1);
    expect(d.inBoth[0].crm.name).toBe("A");
    expect(d.onlyInCrm.map((c) => c.name)).toEqual(["B"]);
    expect(d.onlyInSmsv.map((c) => c.id)).toEqual(["2"]);
  });
});

describe("buildImportPayload", () => {
  it("adds metadata and normalizes phone", () => {
    const p = buildImportPayload([{ phone: "70000001", name: "X", externalId: "crm-1" }]);
    expect(p[0].phone).toBe("+22370000001");
    expect(p[0].metadata).toMatchObject({ externalId: "crm-1", source: "crm" });
  });
});

describe("smsvContactsToCrmExport", () => {
  it("reads externalId from metadata", () => {
    const out = smsvContactsToCrmExport([
      { id: "z", phone: "+22370000001", name: "N", metadata: { externalId: "e1" } },
    ]);
    expect(out[0]).toMatchObject({ externalId: "e1", name: "N" });
  });
});
