import type { Student, StudentRepository } from "../../../src/modules/students/students.repository";
import { StudentsService } from "../../../src/modules/students/students.service";

describe("StudentsService", () => {
  let repository: jest.Mocked<StudentRepository>;
  let service: StudentsService;

  beforeEach(() => {
    jest.resetAllMocks();
    repository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
    };
    service = new StudentsService(repository);
  });

  test("cria um aluno válido e encaminha os dados", async () => {
    const input = { ra: 123, name: "Ana" };
    const student: Student = { ...input };
    repository.create.mockResolvedValue(student);

    await expect(service.create(input)).resolves.toBe(student);
    expect(repository.create).toHaveBeenCalledWith(input);
  });

  test("rejeita RA inválido com erro 400 sem criar aluno", async () => {
    await expect(service.create({ ra: 0, name: "Ana" })).rejects.toMatchObject({
      statusCode: 400,
    });
    expect(repository.create).not.toHaveBeenCalled();
  });

  test("converte conflito de RA em erro 409", async () => {
    repository.create.mockRejectedValue({ code: "23505" });

    await expect(service.create({ ra: 123, name: "Ana" })).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  test("lança erro 404 quando o aluno não existe", async () => {
    repository.findOne.mockResolvedValue(undefined);

    await expect(service.findOne(123)).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  test("propaga a mesma falha inesperada da criação", async () => {
    const error = new Error("Falha inesperada");
    repository.create.mockRejectedValue(error);

    await expect(service.create({ ra: 123, name: "Ana" })).rejects.toBe(error);
  });

  test("lista alunos sem argumentos", async () => {
    const students: Student[] = [{ ra: 123, name: "Ana" }];
    repository.findAll.mockResolvedValue(students);

    await expect(service.findAll()).resolves.toBe(students);
    expect(repository.findAll).toHaveBeenCalledTimes(1);
    expect(repository.findAll).toHaveBeenCalledWith();
  });

  test("retorna o aluno encontrado e consulta uma vez pelo RA", async () => {
    const student: Student = { ra: 123, name: "Ana" };
    repository.findOne.mockResolvedValue(student);

    await expect(service.findOne(123)).resolves.toBe(student);
    expect(repository.findOne).toHaveBeenCalledTimes(1);
    expect(repository.findOne).toHaveBeenCalledWith(123);
  });
});
