import { isForeignKeyViolation } from "../../src/database/foreign-key-violation";

describe("isForeignKeyViolation", () => {
  test("reconhece o código PostgreSQL de violação de chave estrangeira", () => {
    expect(isForeignKeyViolation({ code: "23503" })).toBe(true);
  });

  test.each([null, undefined, "23505", 23503, {}, { code: "outro" }])(
    "não reconhece %s como violação de chave estrangeira",
    (error) => {
      expect(isForeignKeyViolation(error)).toBe(false);
    },
  );
});
