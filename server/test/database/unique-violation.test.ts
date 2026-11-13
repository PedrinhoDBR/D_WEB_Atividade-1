import { isUniqueViolation } from "../../src/database/unique-violation";

describe("isUniqueViolation", () => {
  test("reconhece o código PostgreSQL de violação de unicidade", () => {
    expect(isUniqueViolation({ code: "23505" })).toBe(true);
  });

  test.each([null, undefined, "23505", 23503, {}, { code: "outro" }])(
    "não reconhece %s como violação de unicidade",
    (error) => {
      expect(isUniqueViolation(error)).toBe(false);
    },
  );
});
