import type { Course, CourseRepository } from "../../../src/modules/courses/courses.repository";
import { CoursesService } from "../../../src/modules/courses/courses.service";

describe("CoursesService", () => {
  let repository: jest.Mocked<CourseRepository>;
  let service: CoursesService;

  beforeEach(() => {
    jest.resetAllMocks();
    repository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
    };
    service = new CoursesService(repository);
  });

  test("cria uma disciplina válida e verifica a interação com o repositório", async () => {
    const input = { name: "Qualidade" };
    const created: Course = { id: 1, name: "Qualidade" };
    repository.create.mockResolvedValue(created);

    await expect(service.create(input)).resolves.toBe(created);
    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(repository.create).toHaveBeenCalledWith(input);
  });

  test.each([null, {}, { name: "A" }])(
    "rejeita a criação inválida %s sem consultar o repositório",
    async (input) => {
      await expect(service.create(input)).rejects.toMatchObject({
        statusCode: 400,
      });
      expect(repository.create).not.toHaveBeenCalled();
    },
  );

  test("converte conflito de unicidade em erro 409", async () => {
    repository.create.mockRejectedValue({ code: "23505" });

    await expect(service.create({ name: "Qualidade" })).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  test("lista disciplinas usando um stub de resposta predefinida", async () => {
    const courses: Course[] = [{ id: 1, name: "Qualidade" }];
    repository.findAll.mockResolvedValue(courses);

    await expect(service.findAll()).resolves.toBe(courses);
    expect(repository.findAll).toHaveBeenCalledTimes(1);
  });

  test("retorna a disciplina encontrada e encaminha seu identificador", async () => {
    const course: Course = { id: 123, name: "Qualidade" };
    repository.findOne.mockResolvedValue(course);

    await expect(service.findOne(123)).resolves.toBe(course);
    expect(repository.findOne).toHaveBeenCalledWith(123);
  });

  test("lança erro 404 quando a disciplina não existe", async () => {
    repository.findOne.mockResolvedValue(undefined);

    await expect(service.findOne(123)).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  test("rejeita identificador inválido sem consultar o repositório", async () => {
    await expect(service.findOne(0)).rejects.toMatchObject({ statusCode: 400 });
    expect(repository.findOne).not.toHaveBeenCalled();
  });

  test.each(["create", "findAll", "findOne"] as const)(
    "propaga a mesma falha inesperada de %s",
    async (method) => {
      const error = new Error("Falha inesperada");
      if (method === "create") {
        repository.create.mockRejectedValue(error);
        await expect(service.create({ name: "Qualidade" })).rejects.toBe(error);
      } else if (method === "findAll") {
        repository.findAll.mockRejectedValue(error);
        await expect(service.findAll()).rejects.toBe(error);
      } else {
        repository.findOne.mockRejectedValue(error);
        await expect(service.findOne(1)).rejects.toBe(error);
      }
    },
  );

  test("usa spy para observar findOne do repositório sem perder seu stub", async () => {
    const course: Course = { id: 1, name: "Qualidade" };
    repository.findOne.mockResolvedValue(course);
    const findOneSpy = jest.spyOn(repository, "findOne");

    await expect(service.findOne(1)).resolves.toBe(course);
    expect(findOneSpy).toHaveBeenCalledWith(1);
  });

  test("descarta campos extras antes de chamar o repositório", async () => {
    const course: Course = { id: 1, name: "Qualidade" };
    repository.create.mockResolvedValue(course);

    await service.create({ name: "Qualidade", extra: true });

    expect(repository.create).toHaveBeenCalledWith({ name: "Qualidade" });
  });
});
