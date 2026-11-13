import type { Database } from "../../../src/database/connection";
import type { Course } from "../../../src/modules/courses/courses.repository";
import { PgCourseRepository } from "../../../src/modules/courses/courses.repository";

function normalizeSql(sql: string) {
  return sql.replace(/\s+/g, " ").trim();
}

describe("PgCourseRepository", () => {
  let query: jest.Mock;
  let repository: PgCourseRepository;

  beforeEach(() => {
    jest.resetAllMocks();
    query = jest.fn();
    repository = new PgCourseRepository({ query } as Database);
  });

  test("insere disciplina com parâmetros e retorna a linha", async () => {
    const course: Course = { id: 7, name: "Qualidade" };
    query.mockResolvedValue({ rows: [course] });

    await expect(repository.create({ name: "Qualidade" })).resolves.toEqual(
      course,
    );
    expect(query).toHaveBeenCalledTimes(1);
    const [sql, values] = query.mock.calls[0];
    expect(normalizeSql(sql)).toBe(
      "INSERT INTO courses (name) VALUES ($1) RETURNING id, name",
    );
    expect(values).toEqual(["Qualidade"]);
  });

  test("lista disciplinas ordenadas por id", async () => {
    const courses: Course[] = [{ id: 7, name: "Qualidade" }];
    query.mockResolvedValue({ rows: courses });

    await expect(repository.findAll()).resolves.toEqual(courses);
    expect(query).toHaveBeenCalledTimes(1);
    const [sql] = query.mock.calls[0];
    expect(normalizeSql(sql)).toBe(
      "SELECT id, name FROM courses ORDER BY id",
    );
    expect(query.mock.calls[0]).toHaveLength(1);
  });

  test("retorna lista vazia quando não há disciplinas", async () => {
    query.mockResolvedValue({ rows: [] });

    await expect(repository.findAll()).resolves.toEqual([]);
  });

  test("busca disciplina por id e retorna a primeira linha", async () => {
    const course: Course = { id: 7, name: "Qualidade" };
    query.mockResolvedValue({ rows: [course] });

    await expect(repository.findOne(7)).resolves.toEqual(course);
    expect(query).toHaveBeenCalledTimes(1);
    const [sql, values] = query.mock.calls[0];
    expect(normalizeSql(sql)).toBe(
      "SELECT id, name FROM courses WHERE id = $1",
    );
    expect(values).toEqual([7]);
  });

  test("retorna undefined quando a disciplina não existe", async () => {
    query.mockResolvedValue({ rows: [] });

    await expect(repository.findOne(7)).resolves.toBeUndefined();
  });

  test.each(["create", "findAll", "findOne"] as const)(
    "propaga a mesma falha do banco em %s",
    async (method) => {
      const error = new Error("Falha no banco");
      query.mockRejectedValue(error);

      if (method === "create") {
        await expect(repository.create({ name: "Qualidade" })).rejects.toBe(
          error,
        );
      } else if (method === "findAll") {
        await expect(repository.findAll()).rejects.toBe(error);
      } else {
        await expect(repository.findOne(7)).rejects.toBe(error);
      }
    },
  );
});
