import { describe, expect, it } from "vitest";
import { toLeads } from "@/lib/prospeccaoCsv";

const csv =
  '﻿title,phone,emails,website,category,address,review_rating,review_count,instagram,facebook\r\n' +
  'Clínica "A", B,(41) 1,a@x.com,http://x.com/,Dentista,"Rua 1, Centro",4.6,10,https://www.instagram.com/clinica_a?x=1,javascript:alert(1)\r\n' +
  'Sem Nada,,,,,,,,,\r\n';

describe("toLeads", () => {
  it("lê aspas e aceita só instagram/site válidos", () => {
    const [a, b] = toLeads(csv.replace('Clínica "A", B,(41) 1', '"Clínica ""A"", B",(41) 1'));
    expect(a.nome).toBe('Clínica "A", B');
    expect(a.endereco).toBe("Rua 1, Centro");
    expect(a.instagram).toEqual({ url: "https://www.instagram.com/clinica_a?x=1", usuario: "clinica_a" });
    expect(a.facebook).toBeNull();
    expect(a.site).toBe("http://x.com/");
    expect(b.instagram).toBeNull();
    expect(b.site).toBeNull();
  });
});
