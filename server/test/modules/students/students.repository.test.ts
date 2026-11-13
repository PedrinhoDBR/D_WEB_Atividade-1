import type { Database } from "../../../src/database/connection";
import type { Student } from "../../../src/modules/students/students.repository";
import { PgStudentRepository } from "../../../src/modules/students/students.repository";

function normalizeSql(sql: string) {
  return sql.replace(/\s+/g, " ").trim();
}

describe("PgStudentRepository", () => {
  let query: jest.Mock;
  let repository: PgStudentRepository;

  beforeEach(() => {
    jest.resetAllMocks();
    query = jest.fn();
    repository = new PgStudentRepository({ query } as Database);
  });

  test("insere aluno com parâmetros e retorna a linha", async () => {
    const student: Student = { ra: 123, name: "Ana" };
    query.mockResolvedValue({ rows: [student] });

    await expect(repository.create(student)).resolves.toEqual(student);
    expect(query).toHaveBeenCalledTimes(1);
    const [sql, values] = query.mock.calls[0];
    expect(normalizeSql(sql)).toBe(
      "INSERT INTO students (ra, name) VALUES ($1, $2) RETURNING ra, name",
    );
    expect(values).toEqual([123, "Ana"]);
  });

  test("lista alunos ordenados por nome", async () => {
    const students: Student[] = [{ ra: 123, name: "Ana" }];
    query.mockResolvedValue({ rows: students });

    await expect(repository.findAll()).resolves.toEqual(students);
    expect(query).toHaveBeenCalledTimes(1);
    const [sql] = query.mock.calls[0];
    expect(normalizeSql(sql)).toBe(
      "SELECT ra, name FROM students ORDER BY name",
    );
    expect(query.mock.calls[0]).toHaveLength(1);
  });

  test("retorna lista vazia quando não há alunos", async () => {
    query.mockResolvedValue({ rows: [] });

    await expect(repository.findAll()).resolves.toEqual([]);
  });

  test("busca aluno por RA e retorna a primeira linha", async () => {
    const student: Student = { ra: 123, name: "Ana" };
    query.mockResolvedValue({ rows: [student] });

    await expect(repository.findOne(123)).resolves.toEqual(student);
    expect(query).toHaveBeenCalledTimes(1);
    const [sql, values] = query.mock.calls[0];
    expect(normalizeSql(sql)).toBe(
      "SELECT ra, name FROM students WHERE ra = $1",
    );
    expect(values).toEqual([123]);
  });

  test("retorna undefined quando o aluno não existe", async () => {
    query.mockResolvedValue({ rows: [] });

    await expect(repository.findOne(123)).resolves.toBeUndefined();
  });

  test.each(["create", "findAll", "findOne"] as const)(
    "propaga a mesma falha do banco em %s",
    async (method) => {
      const error = new Error("Falha no banco");
      query.mockRejectedValue(error);

      if (method === "create") {
        await expect(
          repository.create({ ra: 123, name: "Ana" }),
        ).rejects.toBe(error);
      } else if (method === "findAll") {
        await expect(repository.findAll()).rejects.toBe(error);
      } else {
        await expect(repository.findOne(123)).rejects.toBe(error);
      }
    },
  );
});
