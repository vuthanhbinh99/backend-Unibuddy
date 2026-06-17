import { v7 as uuidv7 } from "uuid";
import type { QueryExecutor } from "../../../shared/database/database.js";
import type {
  CreateUserData,
  UserRepository
} from "../application/ports/user.repository.js";
import type { User, UserStatus } from "../domain/user.js";

type UserRow = {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  phoneNumber: string | null;
  avatarUrl: string | null;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
  roleId: number;
  roleCode: string;
  roleName: string;
};

const mapUser = (row: UserRow): User => ({
  id: row.id,
  email: row.email,
  passwordHash: row.passwordHash,
  fullName: row.fullName,
  phoneNumber: row.phoneNumber,
  avatarUrl: row.avatarUrl,
  status: row.status,
  role: {
    id: row.roleId,
    code: row.roleCode,
    name: row.roleName
  },
  createdAt: row.createdAt,
  updatedAt: row.updatedAt
});

const baseUserSelect = `
  SELECT
    nd.ma_nguoi_dung AS "id",
    nd.email AS "email",
    nd.mat_khau AS "passwordHash",
    nd.ho_ten AS "fullName",
    nd.so_dien_thoai AS "phoneNumber",
    nd.anh_dai_dien AS "avatarUrl",
    nd.trang_thai AS "status",
    nd.thoi_gian_tao AS "createdAt",
    nd.thoi_gian_cap_nhat AS "updatedAt",
    vt.ma_vai_tro AS "roleId",
    vt.ma_code AS "roleCode",
    vt.ten_vai_tro AS "roleName"
  FROM nguoi_dung nd
  INNER JOIN vai_tro vt ON vt.ma_vai_tro = nd.ma_vai_tro
`;

export class PostgresUserRepository implements UserRepository {
  constructor(private readonly db: QueryExecutor) {}

  async findByEmail(email: string, executor: QueryExecutor = this.db) {
    const result = await executor.query<UserRow>(
      `
        ${baseUserSelect}
        WHERE LOWER(nd.email) = LOWER($1)
        LIMIT 1
      `,
      [email]
    );

    return result.rows[0] ? mapUser(result.rows[0]) : null;
  }

  async findById(id: string, executor: QueryExecutor = this.db) {
    const result = await executor.query<UserRow>(
      `
        ${baseUserSelect}
        WHERE nd.ma_nguoi_dung = $1
        LIMIT 1
      `,
      [id]
    );

    return result.rows[0] ? mapUser(result.rows[0]) : null;
  }

  async create(data: CreateUserData, executor: QueryExecutor = this.db) {
    const roleResult = await executor.query<{ roleId: number }>(
      `
        SELECT ma_vai_tro AS "roleId"
        FROM vai_tro
        WHERE ma_code = $1
        LIMIT 1
      `,
      [data.roleCode]
    );

    const roleId = roleResult.rows[0]?.roleId;

    if (!roleId) {
      throw new Error(`Role code ${data.roleCode} does not exist`);
    }

    const id = uuidv7();

    await executor.query(
      `
        INSERT INTO nguoi_dung (
          ma_nguoi_dung,
          email,
          mat_khau,
          ho_ten,
          so_dien_thoai,
          anh_dai_dien,
          trang_thai,
          ma_vai_tro,
          thoi_gian_tao,
          thoi_gian_cap_nhat
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      `,
      [
        id,
        data.email,
        data.passwordHash,
        data.fullName,
        data.phoneNumber ?? null,
        data.avatarUrl ?? null,
        data.status ?? "HOAT_DONG",
        roleId
      ]
    );

    const createdUser = await this.findById(id, executor);

    if (!createdUser) {
      throw new Error("Tạo tài khoản người dùng thất bại");
    }

    return createdUser;
  }
}
