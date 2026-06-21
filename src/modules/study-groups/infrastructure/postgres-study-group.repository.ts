import { v7 as uuidv7 } from "uuid";
import type { BoThucThiTruyVan } from "../../../shared/database/database.js";
import type {
  DuLieuTaoNhomHocTap,
  DuLieuTaoThongBaoNhomHocTap,
  KhoNhomHocTap,
  PhamViMonHocNhomHocTap
} from "../application/ports/study-group.repository.js";
import type { NhomHocTap, ThanhVienNhomHocTap, VaiTroNhomHocTap } from "../domain/study-group.js";

type DongNhomHocTap = {
  maNhom: string;
  nguoiTao: string;
  tenNhom: string;
  maMon: string | null;
  maTruong: number | null;
  maThamGia: string;
  linkNhomChat: string;
  createdAt: Date;
  updatedAt: Date;
};

type DongThanhVienNhom = {
  maNhom: string;
  maNguoiDung: string;
  vaiTroTrongNhom: VaiTroNhomHocTap;
  thoiGianThamGia: Date;
  hoTen: string;
  email: string;
};

const anhXaNhom = (row: DongNhomHocTap): NhomHocTap => ({
  maNhom: row.maNhom,
  nguoiTao: row.nguoiTao,
  tenNhom: row.tenNhom,
  maMon: row.maMon,
  maTruong: row.maTruong,
  maThamGia: row.maThamGia,
  linkNhomChat: row.linkNhomChat,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt
});

const anhXaThanhVien = (row: DongThanhVienNhom): ThanhVienNhomHocTap => ({
  maNhom: row.maNhom,
  maNguoiDung: row.maNguoiDung,
  vaiTroTrongNhom: row.vaiTroTrongNhom,
  thoiGianThamGia: row.thoiGianThamGia,
  hoTen: row.hoTen,
  email: row.email
});

const cauTruyVanNhomCoSo = `
  SELECT
    nht.ma_nhom AS "maNhom",
    nht.nguoi_tao AS "nguoiTao",
    nht.ten_nhom AS "tenNhom",
    nht.ma_mon AS "maMon",
    nht.ma_truong AS "maTruong",
    nht.ma_tham_gia AS "maThamGia",
    nht.link_nhom_chat AS "linkNhomChat",
    nht.thoi_gian_tao AS "createdAt",
    nht.thoi_gian_cap_nhat AS "updatedAt"
  FROM nhom_hoc_tap nht
`;

const cauTruyVanThanhVienCoSo = `
  SELECT
    tvn.ma_nhom AS "maNhom",
    tvn.ma_nguoi_dung AS "maNguoiDung",
    tvn.vai_tro_trong_nhom AS "vaiTroTrongNhom",
    tvn.thoi_gian_tham_gia AS "thoiGianThamGia",
    nd.ho_ten AS "hoTen",
    nd.email AS "email"
  FROM thanh_vien_nhom tvn
  INNER JOIN nguoi_dung nd ON nd.ma_nguoi_dung = tvn.ma_nguoi_dung
`;

export class KhoNhomHocTapPostgres implements KhoNhomHocTap {
  constructor(private readonly coSoDuLieu: BoThucThiTruyVan) {}

  async timTheoMa(maNhom: string, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan<DongNhomHocTap>(
      `
        ${cauTruyVanNhomCoSo}
        WHERE nht.ma_nhom = $1
        LIMIT 1
      `,
      [maNhom]
    );

    return ketQua.rows[0] ? anhXaNhom(ketQua.rows[0]) : null;
  }

  async timTheoMaThamGia(maThamGia: string, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan<DongNhomHocTap>(
      `
        ${cauTruyVanNhomCoSo}
        WHERE UPPER(nht.ma_tham_gia) = UPPER($1)
        LIMIT 1
      `,
      [maThamGia]
    );

    return ketQua.rows[0] ? anhXaNhom(ketQua.rows[0]) : null;
  }

  async kiemTraTenNhomDaTonTai(
    tenNhom: string,
    phamVi: PhamViMonHocNhomHocTap,
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ) {
    const ketQua = await boThucThi.truyVan<{ exists: boolean }>(
      `
        SELECT EXISTS (
          SELECT 1
          FROM nhom_hoc_tap nht
          WHERE LOWER(TRIM(nht.ten_nhom)) = LOWER(TRIM($1))
            AND (($2::text IS NULL AND nht.ma_mon IS NULL) OR LOWER(TRIM(nht.ma_mon)) = LOWER(TRIM($2)))
            AND (($3::integer IS NULL AND nht.ma_truong IS NULL) OR nht.ma_truong = $3)
        ) AS "exists"
      `,
      [tenNhom, phamVi.maMon, phamVi.maTruong]
    );

    return ketQua.rows[0]?.exists ?? false;
  }

  async kiemTraMaThamGiaDaTonTai(maThamGia: string, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan<{ exists: boolean }>(
      `
        SELECT EXISTS (
          SELECT 1
          FROM nhom_hoc_tap nht
          WHERE UPPER(nht.ma_tham_gia) = UPPER($1)
        ) AS "exists"
      `,
      [maThamGia]
    );

    return ketQua.rows[0]?.exists ?? false;
  }

  async taoNhom(data: DuLieuTaoNhomHocTap, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan<DongNhomHocTap>(
      `
        INSERT INTO nhom_hoc_tap (
          nguoi_tao,
          ten_nhom,
          ma_mon,
          ma_truong,
          ma_tham_gia,
          link_nhom_chat,
          thoi_gian_tao,
          thoi_gian_cap_nhat
        )
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING
          ma_nhom AS "maNhom",
          nguoi_tao AS "nguoiTao",
          ten_nhom AS "tenNhom",
          ma_mon AS "maMon",
          ma_truong AS "maTruong",
          ma_tham_gia AS "maThamGia",
          link_nhom_chat AS "linkNhomChat",
          thoi_gian_tao AS "createdAt",
          thoi_gian_cap_nhat AS "updatedAt"
      `,
      [data.nguoiTao, data.tenNhom, data.maMon, data.maTruong, data.maThamGia, data.linkNhomChat]
    );

    const nhom = ketQua.rows[0];

    if (!nhom) {
      throw new Error("Tao nhom hoc tap that bai");
    }

    return anhXaNhom(nhom);
  }

  async themThanhVien(
    maNhom: string,
    maNguoiDung: string,
    vaiTro: VaiTroNhomHocTap,
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ) {
    const ketQua = await boThucThi.truyVan<DongThanhVienNhom>(
      `
        INSERT INTO thanh_vien_nhom (
          ma_nhom,
          ma_nguoi_dung,
          vai_tro_trong_nhom,
          thoi_gian_tham_gia
        )
        VALUES ($1, $2, $3, NOW())
        RETURNING
          ma_nhom AS "maNhom",
          ma_nguoi_dung AS "maNguoiDung",
          vai_tro_trong_nhom AS "vaiTroTrongNhom",
          thoi_gian_tham_gia AS "thoiGianThamGia",
          (SELECT ho_ten FROM nguoi_dung WHERE ma_nguoi_dung = $2) AS "hoTen",
          (SELECT email FROM nguoi_dung WHERE ma_nguoi_dung = $2) AS "email"
      `,
      [maNhom, maNguoiDung, vaiTro]
    );

    const thanhVien = ketQua.rows[0];

    if (!thanhVien) {
      throw new Error("Them thanh vien nhom hoc tap that bai");
    }

    return anhXaThanhVien(thanhVien);
  }

  async timThanhVien(
    maNhom: string,
    maNguoiDung: string,
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ) {
    const ketQua = await boThucThi.truyVan<DongThanhVienNhom>(
      `
        ${cauTruyVanThanhVienCoSo}
        WHERE tvn.ma_nhom = $1
          AND tvn.ma_nguoi_dung = $2
        LIMIT 1
      `,
      [maNhom, maNguoiDung]
    );

    return ketQua.rows[0] ? anhXaThanhVien(ketQua.rows[0]) : null;
  }

  async lietKeThanhVien(maNhom: string, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan<DongThanhVienNhom>(
      `
        ${cauTruyVanThanhVienCoSo}
        WHERE tvn.ma_nhom = $1
        ORDER BY tvn.thoi_gian_tham_gia ASC
      `,
      [maNhom]
    );

    return ketQua.rows.map(anhXaThanhVien);
  }

  async lietKeTruongNhom(maNhom: string, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan<DongThanhVienNhom>(
      `
        ${cauTruyVanThanhVienCoSo}
        WHERE tvn.ma_nhom = $1
          AND tvn.vai_tro_trong_nhom = 'TRUONG_NHOM'
        ORDER BY tvn.thoi_gian_tham_gia ASC
      `,
      [maNhom]
    );

    return ketQua.rows.map(anhXaThanhVien);
  }

  async capNhatCongViecCuaThanhVienThanhChuaGan(
    maNhom: string,
    maNguoiDung: string,
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ) {
    const ketQua = await boThucThi.truyVan(
      `
        UPDATE cong_viec_nhom
        SET nguoi_duoc_giao = NULL,
            thoi_gian_cap_nhat = NOW()
        WHERE ma_nhom = $1
          AND nguoi_duoc_giao = $2
      `,
      [maNhom, maNguoiDung]
    );

    return ketQua.rowCount ?? 0;
  }

  async xoaThanhVien(
    maNhom: string,
    maNguoiDung: string,
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ) {
    const ketQua = await boThucThi.truyVan(
      `
        DELETE FROM thanh_vien_nhom
        WHERE ma_nhom = $1
          AND ma_nguoi_dung = $2
      `,
      [maNhom, maNguoiDung]
    );

    return (ketQua.rowCount ?? 0) > 0;
  }

  async xoaBinhLuanCongViecTheoNhom(maNhom: string, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan(
      `
        DELETE FROM binh_luan_cong_viec blcv
        USING cong_viec_nhom cvn
        WHERE blcv.ma_cong_viec = cvn.ma_cong_viec
          AND cvn.ma_nhom = $1
      `,
      [maNhom]
    );

    return ketQua.rowCount ?? 0;
  }

  async xoaCongViecTheoNhom(maNhom: string, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan("DELETE FROM cong_viec_nhom WHERE ma_nhom = $1", [maNhom]);

    return ketQua.rowCount ?? 0;
  }

  async xoaThanhVienTheoNhom(maNhom: string, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan("DELETE FROM thanh_vien_nhom WHERE ma_nhom = $1", [maNhom]);

    return ketQua.rowCount ?? 0;
  }

  async xoaNhom(maNhom: string, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan("DELETE FROM nhom_hoc_tap WHERE ma_nhom = $1", [maNhom]);

    return (ketQua.rowCount ?? 0) > 0;
  }

  async taoThongBaoNhieu(
    data: DuLieuTaoThongBaoNhomHocTap,
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ) {
    const nguoiNhanIds = [...new Set(data.nguoiNhanIds.filter(Boolean))];

    if (nguoiNhanIds.length === 0) {
      return;
    }

    const notificationIds = nguoiNhanIds.map(() => uuidv7());

    await boThucThi.truyVan(
      `
        INSERT INTO thong_bao (
          ma_thong_bao,
          ma_nguoi_nhan,
          nguoi_tao,
          tieu_de,
          noi_dung,
          loai_thong_bao,
          thoi_gian_da_gui,
          thoi_gian_tao
        )
        SELECT
          ids.ma_thong_bao,
          ids.ma_nguoi_nhan,
          $3::uuid,
          $4,
          $5,
          'NHOM_HOC_TAP',
          NOW(),
          NOW()
        FROM unnest($1::uuid[], $2::uuid[]) AS ids(ma_thong_bao, ma_nguoi_nhan)
      `,
      [notificationIds, nguoiNhanIds, data.actorId, data.tieuDe, data.noiDung]
    );
  }
}
