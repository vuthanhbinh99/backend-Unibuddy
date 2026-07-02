import { v7 as uuidv7 } from "uuid";
import type { BoThucThiTruyVan } from "../../../shared/database/database.js";
import type {
  DuLieuCapNhatAnhDaiDienNguoiDung,
  DuLieuCapNhatMatKhauNguoiDung,
  DuLieuCapNhatThongTinNguoiDung,
  DuLieuCapNhatTrangThaiNguoiDung,
  DuLieuCapNhatVaiTroNguoiDung,
  DuLieuTaoNguoiDung,
  KhoNguoiDung
} from "../application/ports/user.repository.js";
import type { NguoiDung, TrangThaiNguoiDung } from "../domain/user.js";

type DongNguoiDung = {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  phoneNumber: string | null;
  avatarUrl: string | null;
  status: TrangThaiNguoiDung;
  temporaryPasswordCreatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  roleId: number;
  roleCode: string;
  roleName: string;
};

const anhXaNguoiDung = (row: DongNguoiDung): NguoiDung => ({
  id: row.id,
  email: row.email,
  passwordHash: row.passwordHash,
  fullName: row.fullName,
  phoneNumber: row.phoneNumber,
  avatarUrl: row.avatarUrl,
  status: row.status,
  temporaryPasswordCreatedAt: row.temporaryPasswordCreatedAt,
  role: {
    id: row.roleId,
    code: row.roleCode,
    name: row.roleName
  },
  createdAt: row.createdAt,
  updatedAt: row.updatedAt
});

const cauTruyVanCoSoNguoiDung = `
  SELECT
    nd.ma_nguoi_dung AS "id",
    nd.email AS "email",
    nd.mat_khau AS "passwordHash",
    nd.ho_ten AS "fullName",
    nd.so_dien_thoai AS "phoneNumber",
    nd.anh_dai_dien AS "avatarUrl",
    nd.trang_thai AS "status",
    nd.thoi_gian_tao_mat_khau_tam AS "temporaryPasswordCreatedAt",
    nd.thoi_gian_tao AS "createdAt",
    nd.thoi_gian_cap_nhat AS "updatedAt",
    vt.ma_vai_tro AS "roleId",
    vt.ma_code AS "roleCode",
    vt.ten_vai_tro AS "roleName"
  FROM nguoi_dung nd
  INNER JOIN vai_tro vt ON vt.ma_vai_tro = nd.ma_vai_tro
`;

export class KhoNguoiDungPostgres implements KhoNguoiDung {
  constructor(private readonly coSoDuLieu: BoThucThiTruyVan) {}

  async lietKe(boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan<DongNguoiDung>(`
      ${cauTruyVanCoSoNguoiDung}
      ORDER BY nd.thoi_gian_tao DESC
    `);

    return ketQua.rows.map(anhXaNguoiDung);
  }

  async timTheoEmail(email: string, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan<DongNguoiDung>(
      `
        ${cauTruyVanCoSoNguoiDung}
        WHERE LOWER(nd.email) = LOWER($1)
        LIMIT 1
      `,
      [email]
    );

    return ketQua.rows[0] ? anhXaNguoiDung(ketQua.rows[0]) : null;
  }

  async timTheoMa(id: string, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan<DongNguoiDung>(
      `
        ${cauTruyVanCoSoNguoiDung}
        WHERE nd.ma_nguoi_dung = $1
        LIMIT 1
      `,
      [id]
    );

    return ketQua.rows[0] ? anhXaNguoiDung(ketQua.rows[0]) : null;
  }

  async tao(data: DuLieuTaoNguoiDung, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const roleResult = await boThucThi.truyVan<{ roleId: number }>(
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

    await boThucThi.truyVan(
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
          thoi_gian_tao_mat_khau_tam,
          thoi_gian_tao,
          thoi_gian_cap_nhat
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      `,
      [
        id,
        data.email,
        data.passwordHash,
        data.fullName,
        data.phoneNumber ?? null,
        data.avatarUrl ?? null,
        data.status ?? "HOAT_DONG",
        roleId,
        data.temporaryPasswordCreatedAt ?? null
      ]
    );

    const createdUser = await this.timTheoMa(id, boThucThi);

    if (!createdUser) {
      throw new Error("Tạo tài khoản người dùng thất bại");
    }

    return createdUser;
  }

  async capNhatMatKhau(
    data: DuLieuCapNhatMatKhauNguoiDung,
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ) {
    const ketQua = await boThucThi.truyVan<DongNguoiDung>(
      `
        UPDATE nguoi_dung
        SET mat_khau = $2,
            trang_thai = $3,
            thoi_gian_tao_mat_khau_tam = $4,
            thoi_gian_cap_nhat = NOW()
        WHERE ma_nguoi_dung = $1
        RETURNING
          ma_nguoi_dung AS "id",
          email AS "email",
          mat_khau AS "passwordHash",
          ho_ten AS "fullName",
          so_dien_thoai AS "phoneNumber",
          anh_dai_dien AS "avatarUrl",
          trang_thai AS "status",
          thoi_gian_tao_mat_khau_tam AS "temporaryPasswordCreatedAt",
          thoi_gian_tao AS "createdAt",
          thoi_gian_cap_nhat AS "updatedAt",
          ma_vai_tro AS "roleId",
          (SELECT ma_code FROM vai_tro WHERE ma_vai_tro = nguoi_dung.ma_vai_tro) AS "roleCode",
          (SELECT ten_vai_tro FROM vai_tro WHERE ma_vai_tro = nguoi_dung.ma_vai_tro) AS "roleName"
      `,
      [data.userId, data.passwordHash, data.status, data.temporaryPasswordCreatedAt ?? null]
    );

    return ketQua.rows[0] ? anhXaNguoiDung(ketQua.rows[0]) : null;
  }

  async capNhatVaiTro(
    data: DuLieuCapNhatVaiTroNguoiDung,
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ) {
    const roleResult = await boThucThi.truyVan<{ roleId: number }>(
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

    const ketQua = await boThucThi.truyVan<DongNguoiDung>(
      `
        UPDATE nguoi_dung
        SET ma_vai_tro = $2,
            thoi_gian_cap_nhat = NOW()
        WHERE ma_nguoi_dung = $1
        RETURNING
          ma_nguoi_dung AS "id",
          email AS "email",
          mat_khau AS "passwordHash",
          ho_ten AS "fullName",
          so_dien_thoai AS "phoneNumber",
          anh_dai_dien AS "avatarUrl",
          trang_thai AS "status",
          thoi_gian_tao_mat_khau_tam AS "temporaryPasswordCreatedAt",
          thoi_gian_tao AS "createdAt",
          thoi_gian_cap_nhat AS "updatedAt",
          ma_vai_tro AS "roleId",
          (SELECT ma_code FROM vai_tro WHERE ma_vai_tro = nguoi_dung.ma_vai_tro) AS "roleCode",
          (SELECT ten_vai_tro FROM vai_tro WHERE ma_vai_tro = nguoi_dung.ma_vai_tro) AS "roleName"
      `,
      [data.userId, roleId]
    );

    return ketQua.rows[0] ? anhXaNguoiDung(ketQua.rows[0]) : null;
  }

  async capNhatTrangThai(
    data: DuLieuCapNhatTrangThaiNguoiDung,
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ) {
    const ketQua = await boThucThi.truyVan<DongNguoiDung>(
      `
        UPDATE nguoi_dung
        SET trang_thai = $2,
            thoi_gian_tao_mat_khau_tam = $3,
            thoi_gian_cap_nhat = NOW()
        WHERE ma_nguoi_dung = $1
        RETURNING
          ma_nguoi_dung AS "id",
          email AS "email",
          mat_khau AS "passwordHash",
          ho_ten AS "fullName",
          so_dien_thoai AS "phoneNumber",
          anh_dai_dien AS "avatarUrl",
          trang_thai AS "status",
          thoi_gian_tao_mat_khau_tam AS "temporaryPasswordCreatedAt",
          thoi_gian_tao AS "createdAt",
          thoi_gian_cap_nhat AS "updatedAt",
          ma_vai_tro AS "roleId",
          (SELECT ma_code FROM vai_tro WHERE ma_vai_tro = nguoi_dung.ma_vai_tro) AS "roleCode",
          (SELECT ten_vai_tro FROM vai_tro WHERE ma_vai_tro = nguoi_dung.ma_vai_tro) AS "roleName"
      `,
      [data.userId, data.status, data.temporaryPasswordCreatedAt ?? null]
    );

    return ketQua.rows[0] ? anhXaNguoiDung(ketQua.rows[0]) : null;
  }

  async capNhatThongTin(
    data: DuLieuCapNhatThongTinNguoiDung,
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ) {
    const ketQua = await boThucThi.truyVan<DongNguoiDung>(
      `
        UPDATE nguoi_dung
        SET ho_ten = $2,
            so_dien_thoai = $3,
            thoi_gian_cap_nhat = NOW()
        WHERE ma_nguoi_dung = $1
        RETURNING
          ma_nguoi_dung AS "id",
          email AS "email",
          mat_khau AS "passwordHash",
          ho_ten AS "fullName",
          so_dien_thoai AS "phoneNumber",
          anh_dai_dien AS "avatarUrl",
          trang_thai AS "status",
          thoi_gian_tao_mat_khau_tam AS "temporaryPasswordCreatedAt",
          thoi_gian_tao AS "createdAt",
          thoi_gian_cap_nhat AS "updatedAt",
          ma_vai_tro AS "roleId",
          (SELECT ma_code FROM vai_tro WHERE ma_vai_tro = nguoi_dung.ma_vai_tro) AS "roleCode",
          (SELECT ten_vai_tro FROM vai_tro WHERE ma_vai_tro = nguoi_dung.ma_vai_tro) AS "roleName"
      `,
      [data.userId, data.fullName, data.phoneNumber ?? null]
    );

    return ketQua.rows[0] ? anhXaNguoiDung(ketQua.rows[0]) : null;
  }

  async capNhatAnhDaiDien(
    data: DuLieuCapNhatAnhDaiDienNguoiDung,
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ) {
    const ketQua = await boThucThi.truyVan<DongNguoiDung>(
      `
        UPDATE nguoi_dung
        SET anh_dai_dien = $2,
            thoi_gian_cap_nhat = NOW()
        WHERE ma_nguoi_dung = $1
        RETURNING
          ma_nguoi_dung AS "id",
          email AS "email",
          mat_khau AS "passwordHash",
          ho_ten AS "fullName",
          so_dien_thoai AS "phoneNumber",
          anh_dai_dien AS "avatarUrl",
          trang_thai AS "status",
          thoi_gian_tao_mat_khau_tam AS "temporaryPasswordCreatedAt",
          thoi_gian_tao AS "createdAt",
          thoi_gian_cap_nhat AS "updatedAt",
          ma_vai_tro AS "roleId",
          (SELECT ma_code FROM vai_tro WHERE ma_vai_tro = nguoi_dung.ma_vai_tro) AS "roleCode",
          (SELECT ten_vai_tro FROM vai_tro WHERE ma_vai_tro = nguoi_dung.ma_vai_tro) AS "roleName"
      `,
      [data.userId, data.avatarUrl]
    );

    return ketQua.rows[0] ? anhXaNguoiDung(ketQua.rows[0]) : null;
  }
}
