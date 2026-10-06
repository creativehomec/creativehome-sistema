const listaDeTrechos = { type: "array", items: { type: "string" } };

export const schemaOrganizar = {
  name: "roteiro_organizado",
  strict: true,
  schema: {
    type: "object",
    properties: {
      videos: {
        type: "array",
        items: {
          type: "object",
          properties: {
            titulo: { type: "string" },
            cenas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  script: { type: "string" },
                  descricao: listaDeTrechos,
                  hooks_alternativos: listaDeTrechos,
                  ctas_alternativos: listaDeTrechos,
                },
                required: ["script", "descricao", "hooks_alternativos", "ctas_alternativos"],
                additionalProperties: false,
              },
            },
            notas_producao: listaDeTrechos,
          },
          required: ["titulo", "cenas", "notas_producao"],
          additionalProperties: false,
        },
      },
    },
    required: ["videos"],
    additionalProperties: false,
  },
};
