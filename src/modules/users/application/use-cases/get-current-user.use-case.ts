import { AppError } from "../../../../shared/errors/app-error.js";
import type { PublicUser } from "../../domain/user.js";
import { toPublicUser } from "../../domain/user.js";
import type { UserRepository } from "../ports/user.repository.js";

type Dependencies = {
  userRepository: UserRepository;
};

export class GetCurrentUserUseCase {
  constructor(private readonly deps: Dependencies) {}

  async execute(userId: string): Promise<PublicUser> {
    const user = await this.deps.userRepository.findById(userId);

    if (!user) {
      throw AppError.notFound("Không tìm thấy người dùng");
    }

    if (user.status === "BI_KHOA") {
      throw AppError.locked("Tài khoản đã bị khóa");
    }

    return toPublicUser(user);
  }
}
