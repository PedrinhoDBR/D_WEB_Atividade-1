import type { Database } from "../../../src/database/connection";
import type { Enrollment } from "../../../src/modules/enrollments/enrollments.repository";
import { PgEnrollmentRepository } from "../../../src/modules/enrollments/enrollments.repository";

function normalizeSql(sql: string) {
  return sql.replace(/\s+/g, " ").trim();
}

const enrollmentColumns =
  'student_ra AS "studentRa", course_id AS "courseId", enrolled_at AS "enrolledAt"';

describe("PgEnrollmentRepository", () => {
  let query: jest.Mock;
  let repository: PgEnrollmentRepository;
  const enrolledAt = new Date("2026-01-01T00:00:00.000Z");
  const enrollment: Enrollment = {
    studentRa: 123,
    courseId: 7,
    enrolledAt,
  };

  beforeEach(() => {
    jest.resetAllMocks();
    query = jest.fn();
    repository = new PgEnrollmentRepository({ query } as Database);
  });

  test("insere matrícula com aliases, parâmetros e data camelCase", async () => {
    query.mockResolvedValue({ rows: [enrollment] });

    await expect(repository.create(123, 7)).resolves.toEqual(enrollment);
    expect(query).toHaveBeenCalledTimes(1);
    const [sql, values] = query.mock.calls[0];
    expect(normalizeSql(sql)).toBe(
      `INSERT INTO enrollments (student_ra, course_id) VALUES ($1, $2) RETURNING ${enrollmentColumns}`,
    );
    expect(values).toEqual([123, 7]);
  });

  test("lista matrículas ordenadas pelas chaves e preserva os aliases", async () => {
    query.mockResolvedValue({ rows: [enrollment] });

    await expect(repository.findAll()).resolves.toEqual([enrollment]);
    expect(query).toHaveBeenCalledTimes(1);
    const [sql] = query.mock.calls[0];
    expect(normalizeSql(sql)).toBe(
      `SELECT ${enrollmentColumns} FROM enrollments ORDER BY student_ra, course_id`,
    );
    expect(query.mock.calls[0]).toHaveLength(1);
  });

  test("retorna lista vazia quando não há matrículas", async () => {
    query.mockResolvedValue({ rows: [] });

    await expect(repository.findAll()).resolves.toEqual([]);
  });

  test("busca matrícula pelas duas chaves e retorna a primeira linha", async () => {
    query.mockResolvedValue({ rows: [enrollment] });

    await expect(repository.findOne(123, 7)).resolves.toEqual(enrollment);
    expect(query).toHaveBeenCalledTimes(1);
    const [sql, values] = query.mock.calls[0];
    expect(normalizeSql(sql)).toBe(
      `SELECT ${enrollmentColumns} FROM enrollments WHERE student_ra = $1 AND course_id = $2`,
    );
    expect(values).toEqual([123, 7]);
  });

  test("retorna undefined quando a matrícula não existe", async () => {
    query.mockResolvedValue({ rows: [] });

    await expect(repository.findOne(123, 7)).resolves.toBeUndefined();
  });

  test.each(["create", "findAll", "findOne"] as const)(
    "propaga a mesma falha do banco em %s",
    async (method) => {
      const error = new Error("Falha no banco");
      query.mockRejectedValue(error);

      if (method === "create") {
        await expect(repository.create(123, 7)).rejects.toBe(error);
      } else if (method === "findAll") {
        await expect(repository.findAll()).rejects.toBe(error);
      } else {
        await expect(repository.findOne(123, 7)).rejects.toBe(error);
      }
    },
  );
});
