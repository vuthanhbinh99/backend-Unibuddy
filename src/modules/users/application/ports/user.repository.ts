import type { QueryExecutor } from "../../../../shared/database/database.js";
import type { User, UserStatus } from "../../domain/user.js";

export type CreateUserData = {
  email: string;
  passwordHash: string;
  fullName: string;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  status?: UserStatus;
  roleCode: string;
};

export interface UserRepository {
  findByEmail(email: string, executor?: QueryExecutor): Promise<User | null>;
  findById(id: string, executor?: QueryExecutor): Promise<User | null>;
  create(data: CreateUserData, executor?: QueryExecutor): Promise<User>;
}
