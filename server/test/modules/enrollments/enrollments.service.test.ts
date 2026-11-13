import type {
  Enrollment,
  EnrollmentRepository,
} from "../../../src/modules/enrollments/enrollments.repository";
import { EnrollmentsService } from "../../../src/modules/enrollments/enrollments.service";

describe("EnrollmentsService", () => {
  let repository: jest.Mocked<EnrollmentRepository>;
  let service: EnrollmentsService;
  const enrolledAt = new Date("2026-01-01T00:00:00.000Z");
  const enrollment: Enrollment = {
    studentRa: 123,
    courseId: 1,
    enrolledAt,
  };

  beforeEach(() => {
    jest.resetAllMocks();
    repository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
    };
    service = new EnrollmentsService(repository);
  });

  test("cria matrícula e encaminha os identificadores na ordem correta", async () => {
    repository.create.mockResolvedValue(enrollment);

    await expect(
      service.create({ studentRa: 123, courseId: 1 }),
    ).resolves.toBe(enrollment);
    expect(repository.create).toHaveBeenCalledWith(123, 1);
  });

  test.each([
    { studentRa: 0, courseId: 1 },
    { studentRa: 123, courseId: 0 },
  ])("rejeita chave inválida %s sem chamar o repositório", async (input) => {
    await expect(service.create(input)).rejects.toMatchObject({
      statusCode: 400,
    });
    expect(repository.create).not.toHaveBeenCalled();
  });

  test("converte referência inexistente em erro 404", async () => {
    repository.create.mockRejectedValue({ code: "23503" });

    await expect(
      service.create({ studentRa: 123, courseId: 1 }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  test("converte matrícula duplicada em erro 409", async () => {
    repository.create.mockRejectedValue({ code: "23505" });

    await expect(
      service.create({ studentRa: 123, courseId: 1 }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  test("lança erro 404 e encaminha ambos os identificadores na busca", async () => {
    repository.findOne.mockResolvedValue(undefined);

    await expect(service.findOne(123, 1)).rejects.toMatchObject({
      statusCode: 404,
    });
    expect(repository.findOne).toHaveBeenCalledWith(123, 1);
  });

  test("propaga a mesma falha inesperada da criação", async () => {
    const error = new Error("Falha inesperada");
    repository.create.mockRejectedValue(error);

    await expect(
      service.create({ studentRa: 123, courseId: 1 }),
    ).rejects.toBe(error);
  });

  test("lista matrículas sem argumentos", async () => {
    const enrollments = [enrollment];
    repository.findAll.mockResolvedValue(enrollments);

    await expect(service.findAll()).resolves.toBe(enrollments);
    expect(repository.findAll).toHaveBeenCalledTimes(1);
    expect(repository.findAll).toHaveBeenCalledWith();
  });

  test("retorna matrícula existente e encaminha os dois identificadores", async () => {
    repository.findOne.mockResolvedValue(enrollment);

    await expect(service.findOne(123, 1)).resolves.toBe(enrollment);
    expect(repository.findOne).toHaveBeenCalledTimes(1);
    expect(repository.findOne).toHaveBeenCalledWith(123, 1);
  });
});
