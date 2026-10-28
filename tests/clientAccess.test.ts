import { describe, expect, it } from "vitest";
import type { Session } from "@/lib/auth";
import { assertClientAllowed, getClientScope } from "@/lib/clientAccess";
import type { PublicUser } from "@/lib/users";

const user = (ids: string[] | null) => ({ allowed_client_ids: ids }) as PublicUser;
const member = { userId: "u", role: "member" } as Session;
const admin = { userId: "a", role: "admin" } as Session;

describe("escopo de clientes", () => {
  it("admin nunca é restrito, mesmo com lista preenchida", () => {
    expect(getClientScope(admin, user(["x"]))).toBeNull();
  });
  it("membro sem lista vê todos; com lista, só a lista", () => {
    expect(getClientScope(member, user(null))).toBeNull();
    expect(getClientScope(member, user(["x"]))).toEqual(["x"]);
  });
  it("bloqueia cliente fora do escopo e libera sem restrição", () => {
    expect(() => assertClientAllowed(["x"], "y")).toThrow();
    expect(() => assertClientAllowed(["x"], "x")).not.toThrow();
    expect(() => assertClientAllowed(null, "y")).not.toThrow();
  });
});
