import { HttpError } from "../src/errors";
import {
  parseId,
  positiveInteger,
  validateBody,
  validateName,
} from "../src/validation";

function expectBadRequest(action: () => unknown) {
  try {
    action();
    throw new Error("Era esperado um HttpError 400.");
  } catch (error) {
    expect(error).toBeInstanceOf(HttpError);
    expect((error as HttpError).statusCode).toBe(400);
  }
}

describe("positiveInteger", () => {
  test.each([1, 2147483647])("retorna o inteiro positivo %s", (value) => {
    expect(positiveInteger(value, "RA")).toBe(value);
  });

  test.each([
    0,
    -1,
    1.5,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    2147483648,
    "123",
    null,
    undefined,
  ])("rejeita a entrada inválida %s", (value) => {
    expectBadRequest(() => positiveInteger(value, "RA"));
  });
});

describe("parseId", () => {
  test.each([
    ["1", 1],
    ["2147483647", 2147483647],
  ])("converte o identificador %s", (value, expected) => {
    expect(parseId(value, "RA")).toBe(expected);
  });

  test.each(["1abc", "1.2", "1e2", "", "-1", "0", "2147483648", 123])(
    "rejeita o identificador inválido %s",
    (value) => {
      expectBadRequest(() => parseId(value, "RA"));
    },
  );
});

describe("validateName", () => {
  test.each(["Ana", "a".repeat(100)])("aceita o nome válido", (value) => {
    expect(validateName(value)).toBe(value);
  });

  test.each(["", "ab", "   ", " a ", "a".repeat(101), 123, null, undefined])(
    "rejeita o nome inválido %s",
    (value) => {
      expectBadRequest(() => validateName(value));
    },
  );
});

describe("validateBody", () => {
  test("retorna a mesma referência de um objeto congelado", () => {
    const body = Object.freeze({ name: "Ana" });

    expect(validateBody(body)).toBe(body);
    expect(body).toEqual({ name: "Ana" });
  });

  test.each([null, undefined, [], "Ana", 12])(
    "rejeita corpo que não é um objeto JSON: %s",
    (value) => {
      expectBadRequest(() => validateBody(value));
    },
  );

  test("aceita e não altera propriedades extras", () => {
    const body = { name: "Ana", extra: true };

    expect(validateBody(body)).toBe(body);
    expect(body).toEqual({ name: "Ana", extra: true });
  });
});
