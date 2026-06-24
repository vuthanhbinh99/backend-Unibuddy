import { v7 as uuidv7 } from "uuid";
import type { BoThucThiTruyVan } from "../../../shared/database/database.js";
import type {
  DuLieuCapNhatCongViecKanban,
  DuLieuCapNhatTrangThaiKanban,
  DuLieuTaoBinhLuanKanban,
  DuLieuTaoCongViecKanban,
  DuLieuTaoThongBaoKanban,
  DuLieuXoaThongBaoCongViecKanban,
  KhoKanban
} from "../application/ports/kanban.repository.js";
import type {
  BinhLuanCongViecKanban,
  CongViecKanban,
  NguoiThamGiaKanban,
  NhomKanban,
  TrangThaiCongViecKanban
} from "../domain/kanban.js";

type DongCongViec = {
  maCongViec: string;
  maNhom: string;
  nguoiDuocGiao: string | null;
  nguoiDuocGiaoHoTen: string | null;
  nguoiDuocGiaoEmail: string | null;
  tieuDe: string;
  moTa: string | null;
  trangThai: TrangThaiCongViecKanban;
  hanHoanThanh: Date | null;
  viTri: string | number | null;
  soBinhLuan: string | number;
  createdAt: Date;
  updatedAt: Date;
};

type DongNhom = {
  maNhom: string;
  tenNhom: string;
  linkNhomChat: string;
};

type DongThanhVien = {
  maNguoiDung: string;
  hoTen: string;
  email: string;
  vaiTroTrongNhom: "TRUONG_NHOM" | "THANH_VIEN";
};

type DongBinhLuan = {
  maBinhLuan: string;
  maCongViec: string;
  maNguoiDung: string;
  hoTen: string;
  email: string;
  noiDung: string;
  createdAt: Date;
};

const anhXaCongViec = (row: DongCongViec): CongViecKanban => ({
  maCongViec: row.maCongViec,
  maNhom: row.maNhom,
  nguoiDuocGiao: row.nguoiDuocGiao,
  nguoiDuocGiaoHoTen: row.nguoiDuocGiaoHoTen,
  nguoiDuocGiaoEmail: row.nguoiDuocGiaoEmail,
  tieuDe: row.tieuDe,
  moTa: row.moTa,
  trangThai: row.trangThai,
  hanHoanThanh: row.hanHoanThanh,
  viTri: Number(row.viTri ?? 0),
  soBinhLuan: Number(row.soBinhLuan ?? 0),
  createdAt: row.createdAt,
  updatedAt: row.updatedAt
});

const anhXaNhom = (row: DongNhom): NhomKanban => ({
  maNhom: row.maNhom,
  tenNhom: row.tenNhom,
  linkNhomChat: row.linkNhomChat
});

const anhXaThanhVien = (row: DongThanhVien): NguoiThamGiaKanban => ({
  maNguoiDung: row.maNguoiDung,
  hoTen: row.hoTen,
  email: row.email,
  vaiTroTrongNhom: row.vaiTroTrongNhom
});

const anhXaBinhLuan = (row: DongBinhLuan): BinhLuanCongViecKanban => ({
  maBinhLuan: row.maBinhLuan,
  maCongViec: row.maCongViec,
  maNguoiDung: row.maNguoiDung,
  hoTen: row.hoTen,
  email: row.email,
  noiDung: row.noiDung,
  createdAt: row.createdAt
});

export class KhoKanbanPostgres implements KhoKanban {
  private hoTroViTriCongViec?: boolean;
  private hoTroThongBaoGanCongViec?: boolean;
  private hoTroTaiLieuGanCongViec?: boolean;

  constructor(private readonly coSoDuLieu: BoThucThiTruyVan) {}

  async coHoTroViTriCongViec(boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    if (this.hoTroViTriCongViec !== undefined) {
      return this.hoTroViTriCongViec;
    }

    const ketQua = await boThucThi.truyVan<{ exists: boolean }>(
      `
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = current_schema()
            AND table_name = 'cong_viec_nhom'
            AND column_name = 'vi_tri'
        ) AS "exists"
      `
    );

    this.hoTroViTriCongViec = ketQua.rows[0]?.exists ?? false;
    return this.hoTroViTriCongViec;
  }

  private async coCotTrongBang(
    tenBang: string,
    tenCot: string,
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ) {
    const ketQua = await boThucThi.truyVan<{ exists: boolean }>(
      `
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = current_schema()
            AND table_name = $1
            AND column_name = $2
        ) AS "exists"
      `,
      [tenBang, tenCot]
    );

    return ketQua.rows[0]?.exists ?? false;
  }

  private async coHoTroThongBaoGanCongViecBangCot(boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    if (this.hoTroThongBaoGanCongViec !== undefined) {
      return this.hoTroThongBaoGanCongViec;
    }

    this.hoTroThongBaoGanCongViec = await this.coCotTrongBang("thong_bao", "ma_cong_viec", boThucThi);
    return this.hoTroThongBaoGanCongViec;
  }

  private async coHoTroTaiLieuGanCongViecBangCot(boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    if (this.hoTroTaiLieuGanCongViec !== undefined) {
      return this.hoTroTaiLieuGanCongViec;
    }

    this.hoTroTaiLieuGanCongViec = await this.coCotTrongBang("tai_lieu", "ma_cong_viec", boThucThi);
    return this.hoTroTaiLieuGanCongViec;
  }

  async timNhom(maNhom: string, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan<DongNhom>(
      `
        SELECT
          ma_nhom AS "maNhom",
          ten_nhom AS "tenNhom",
          link_nhom_chat AS "linkNhomChat"
        FROM nhom_hoc_tap
        WHERE ma_nhom = $1
        LIMIT 1
      `,
      [maNhom]
    );

    return ketQua.rows[0] ? anhXaNhom(ketQua.rows[0]) : null;
  }

  async timThanhVien(maNhom: string, maNguoiDung: string, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan<DongThanhVien>(
      `
        SELECT
          tvn.ma_nguoi_dung AS "maNguoiDung",
          nd.ho_ten AS "hoTen",
          nd.email AS "email",
          tvn.vai_tro_trong_nhom AS "vaiTroTrongNhom"
        FROM thanh_vien_nhom tvn
        INNER JOIN nguoi_dung nd ON nd.ma_nguoi_dung = tvn.ma_nguoi_dung
        WHERE tvn.ma_nhom = $1
          AND tvn.ma_nguoi_dung = $2
        LIMIT 1
      `,
      [maNhom, maNguoiDung]
    );

    return ketQua.rows[0] ? anhXaThanhVien(ketQua.rows[0]) : null;
  }

  async lietKeThanhVien(maNhom: string, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan<DongThanhVien>(
      `
        SELECT
          tvn.ma_nguoi_dung AS "maNguoiDung",
          nd.ho_ten AS "hoTen",
          nd.email AS "email",
          tvn.vai_tro_trong_nhom AS "vaiTroTrongNhom"
        FROM thanh_vien_nhom tvn
        INNER JOIN nguoi_dung nd ON nd.ma_nguoi_dung = tvn.ma_nguoi_dung
        WHERE tvn.ma_nhom = $1
        ORDER BY tvn.vai_tro_trong_nhom ASC, nd.ho_ten ASC
      `,
      [maNhom]
    );

    return ketQua.rows.map(anhXaThanhVien);
  }

  async lietKeTruongNhom(maNhom: string, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan<DongThanhVien>(
      `
        SELECT
          tvn.ma_nguoi_dung AS "maNguoiDung",
          nd.ho_ten AS "hoTen",
          nd.email AS "email",
          tvn.vai_tro_trong_nhom AS "vaiTroTrongNhom"
        FROM thanh_vien_nhom tvn
        INNER JOIN nguoi_dung nd ON nd.ma_nguoi_dung = tvn.ma_nguoi_dung
        WHERE tvn.ma_nhom = $1
          AND tvn.vai_tro_trong_nhom = 'TRUONG_NHOM'
        ORDER BY tvn.thoi_gian_tham_gia ASC
      `,
      [maNhom]
    );

    return ketQua.rows.map(anhXaThanhVien);
  }

  async lietKeCongViecTheoNhom(maNhom: string, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const coViTri = await this.coHoTroViTriCongViec(boThucThi);
    const ketQua = await boThucThi.truyVan<DongCongViec>(
      this.taoCauTruyVanCongViecCoSo(coViTri, "cvn.ma_nhom = $1", false),
      [maNhom]
    );

    return ketQua.rows.map(anhXaCongViec);
  }

  async timCongViec(maCongViec: string, boThucThi: BoThucThiTruyVan = this.coSoDuLieu, forUpdate = false) {
    const coViTri = await this.coHoTroViTriCongViec(boThucThi);
    const ketQua = await boThucThi.truyVan<DongCongViec>(
      this.taoCauTruyVanCongViecCoSo(coViTri, "cvn.ma_cong_viec = $1", forUpdate),
      [maCongViec]
    );

    return ketQua.rows[0] ? anhXaCongViec(ketQua.rows[0]) : null;
  }

  async taoCongViec(data: DuLieuTaoCongViecKanban, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const coViTri = await this.coHoTroViTriCongViec(boThucThi);
    const viTriMoi = await this.layViTriCuoiCot(data.maNhom, data.trangThai, boThucThi);
    const cotViTri = coViTri ? ", vi_tri" : "";
    const giaTriViTri = coViTri ? ", $7" : "";
    const thamSo = coViTri
      ? [data.maNhom, data.nguoiDuocGiao, data.tieuDe, data.moTa, data.trangThai, data.hanHoanThanh, viTriMoi]
      : [data.maNhom, data.nguoiDuocGiao, data.tieuDe, data.moTa, data.trangThai, data.hanHoanThanh];

    const ketQua = await boThucThi.truyVan<{ maCongViec: string }>(
      `
        INSERT INTO cong_viec_nhom (
          ma_nhom,
          nguoi_duoc_giao,
          tieu_de,
          mo_ta,
          trang_thai,
          han_hoan_thanh,
          thoi_gian_tao,
          thoi_gian_cap_nhat
          ${cotViTri}
        )
        VALUES ($1, $2, $3, $4, $5::enum_trang_thai_cong_viec, $6, NOW(), NOW() ${giaTriViTri})
        RETURNING ma_cong_viec AS "maCongViec"
      `,
      thamSo
    );

    const maCongViec = ketQua.rows[0]?.maCongViec;

    if (!maCongViec) {
      throw new Error("Tao cong viec Kanban that bai");
    }

    const congViec = await this.timCongViec(maCongViec, boThucThi);

    if (!congViec) {
      throw new Error("Khong doc duoc cong viec Kanban vua tao");
    }

    return congViec;
  }

  async capNhatThongTinCongViec(
    maCongViec: string,
    data: DuLieuCapNhatCongViecKanban,
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ) {
    const ketQua = await boThucThi.truyVan<{ maCongViec: string }>(
      `
        UPDATE cong_viec_nhom
        SET tieu_de = $2,
            mo_ta = $3,
            han_hoan_thanh = $4,
            thoi_gian_cap_nhat = NOW()
        WHERE ma_cong_viec = $1
        RETURNING ma_cong_viec AS "maCongViec"
      `,
      [maCongViec, data.tieuDe, data.moTa, data.hanHoanThanh]
    );

    return ketQua.rows[0] ? this.timCongViec(maCongViec, boThucThi) : null;
  }

  async capNhatNguoiDuocGiao(
    maCongViec: string,
    nguoiDuocGiao: string | null,
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ) {
    const ketQua = await boThucThi.truyVan<{ maCongViec: string }>(
      `
        UPDATE cong_viec_nhom
        SET nguoi_duoc_giao = $2,
            thoi_gian_cap_nhat = NOW()
        WHERE ma_cong_viec = $1
        RETURNING ma_cong_viec AS "maCongViec"
      `,
      [maCongViec, nguoiDuocGiao]
    );

    return ketQua.rows[0] ? this.timCongViec(maCongViec, boThucThi) : null;
  }

  async capNhatTrangThaiVaViTri(
    data: DuLieuCapNhatTrangThaiKanban,
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ) {
    const coViTri = await this.coHoTroViTriCongViec(boThucThi);
    const viTriMoi = Math.max(1, Math.trunc(data.viTriMoi ?? data.viTriCu));

    if (coViTri) {
      if (data.trangThaiCu === data.trangThaiMoi) {
        if (viTriMoi < data.viTriCu) {
          await boThucThi.truyVan(
            `
              UPDATE cong_viec_nhom
              SET vi_tri = vi_tri + 1
              WHERE trang_thai = $1::enum_trang_thai_cong_viec
                AND ma_nhom = $2
                AND vi_tri >= $3
                AND vi_tri < $4
                AND ma_cong_viec <> $5
            `,
            [data.trangThaiMoi, data.maNhom, viTriMoi, data.viTriCu, data.maCongViec]
          );
        } else if (viTriMoi > data.viTriCu) {
          await boThucThi.truyVan(
            `
              UPDATE cong_viec_nhom
              SET vi_tri = vi_tri - 1
              WHERE trang_thai = $1::enum_trang_thai_cong_viec
                AND ma_nhom = $2
                AND vi_tri <= $3
                AND vi_tri > $4
                AND ma_cong_viec <> $5
            `,
            [data.trangThaiMoi, data.maNhom, viTriMoi, data.viTriCu, data.maCongViec]
          );
        }
      } else {
        await boThucThi.truyVan(
          `
            UPDATE cong_viec_nhom
            SET vi_tri = vi_tri - 1
            WHERE trang_thai = $1::enum_trang_thai_cong_viec
              AND ma_nhom = $2
              AND vi_tri > $3
          `,
          [data.trangThaiCu, data.maNhom, data.viTriCu]
        );
        await boThucThi.truyVan(
          `
            UPDATE cong_viec_nhom
            SET vi_tri = vi_tri + 1
            WHERE trang_thai = $1::enum_trang_thai_cong_viec
              AND ma_nhom = $2
              AND vi_tri >= $3
          `,
          [data.trangThaiMoi, data.maNhom, viTriMoi]
        );
      }
    }

    const ketQua = await boThucThi.truyVan<{ maCongViec: string }>(
      `
        UPDATE cong_viec_nhom
        SET trang_thai = $2::enum_trang_thai_cong_viec,
            thoi_gian_cap_nhat = NOW()
            ${coViTri ? ", vi_tri = $3" : ""}
        WHERE ma_cong_viec = $1
        RETURNING ma_cong_viec AS "maCongViec"
      `,
      coViTri ? [data.maCongViec, data.trangThaiMoi, viTriMoi] : [data.maCongViec, data.trangThaiMoi]
    );

    return ketQua.rows[0] ? this.timCongViec(data.maCongViec, boThucThi) : null;
  }

  async capNhatCongViecTreHanTheoNhom(maNhom: string, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan(
      `
        UPDATE cong_viec_nhom
        SET trang_thai = 'TRE_HAN',
            thoi_gian_cap_nhat = NOW()
        WHERE ma_nhom = $1
          AND han_hoan_thanh IS NOT NULL
          AND han_hoan_thanh < NOW()
          AND trang_thai <> 'HOAN_THANH'
          AND trang_thai <> 'TRE_HAN'
      `,
      [maNhom]
    );

    return ketQua.rowCount ?? 0;
  }

  async timBinhLuan(maBinhLuan: string, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan<DongBinhLuan>(
      `
        SELECT
          bl.ma_binh_luan AS "maBinhLuan",
          bl.ma_cong_viec AS "maCongViec",
          bl.ma_nguoi_dung AS "maNguoiDung",
          nd.ho_ten AS "hoTen",
          nd.email AS "email",
          bl.noi_dung AS "noiDung",
          bl.thoi_gian_tao AS "createdAt"
        FROM binh_luan_cong_viec bl
        INNER JOIN nguoi_dung nd ON nd.ma_nguoi_dung = bl.ma_nguoi_dung
        WHERE bl.ma_binh_luan = $1
        LIMIT 1
      `,
      [maBinhLuan]
    );

    return ketQua.rows[0] ? anhXaBinhLuan(ketQua.rows[0]) : null;
  }

  async xoaBinhLuan(maBinhLuan: string, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan("DELETE FROM binh_luan_cong_viec WHERE ma_binh_luan = $1", [
      maBinhLuan
    ]);

    return (ketQua.rowCount ?? 0) > 0;
  }

  async xoaBinhLuanTheoCongViec(maCongViec: string, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan("DELETE FROM binh_luan_cong_viec WHERE ma_cong_viec = $1", [maCongViec]);
    return ketQua.rowCount ?? 0;
  }

  async danhDauXoaTaiLieuTheoCongViec(maCongViec: string, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const coCotMaCongViec = await this.coHoTroTaiLieuGanCongViecBangCot(boThucThi);

    if (!coCotMaCongViec) {
      return 0;
    }

    const ketQua = await boThucThi.truyVan(
      `
        UPDATE tai_lieu
        SET trang_thai = 'DA_XOA',
            ma_cong_viec = NULL,
            thoi_gian_cap_nhat = NOW()
        WHERE ma_cong_viec = $1
          AND trang_thai <> 'DA_XOA'
      `,
      [maCongViec]
    );

    return ketQua.rowCount ?? 0;
  }

  async xoaThongBaoTheoCongViec(
    data: DuLieuXoaThongBaoCongViecKanban,
    boThucThi: BoThucThiTruyVan = this.coSoDuLieu
  ) {
    const coCotMaCongViec = await this.coHoTroThongBaoGanCongViecBangCot(boThucThi);

    if (coCotMaCongViec) {
      const ketQua = await boThucThi.truyVan("DELETE FROM thong_bao WHERE ma_cong_viec = $1", [data.maCongViec]);
      return ketQua.rowCount ?? 0;
    }

    const thanhVien = await this.lietKeThanhVien(data.maNhom, boThucThi);
    const nguoiNhanIds = thanhVien.map((item) => item.maNguoiDung);

    if (nguoiNhanIds.length === 0) {
      return 0;
    }

    const mauTieuDe = `%${this.escapeLikePattern(data.tieuDeCongViec)}%`;
    const ketQua = await boThucThi.truyVan(
      `
        DELETE FROM thong_bao
        WHERE loai_thong_bao = 'NHOM_HOC_TAP'
          AND ma_nguoi_nhan = ANY($1::uuid[])
          AND noi_dung ILIKE $2 ESCAPE '\\'
      `,
      [nguoiNhanIds, mauTieuDe]
    );

    return ketQua.rowCount ?? 0;
  }

  async xoaCongViec(maCongViec: string, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan("DELETE FROM cong_viec_nhom WHERE ma_cong_viec = $1", [maCongViec]);
    return (ketQua.rowCount ?? 0) > 0;
  }

  async taoBinhLuan(data: DuLieuTaoBinhLuanKanban, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const ketQua = await boThucThi.truyVan<DongBinhLuan>(
      `
        INSERT INTO binh_luan_cong_viec (
          ma_cong_viec,
          ma_nguoi_dung,
          noi_dung,
          thoi_gian_tao
        )
        VALUES ($1, $2, $3, NOW())
        RETURNING
          ma_binh_luan AS "maBinhLuan",
          ma_cong_viec AS "maCongViec",
          ma_nguoi_dung AS "maNguoiDung",
          (SELECT ho_ten FROM nguoi_dung WHERE ma_nguoi_dung = $2) AS "hoTen",
          (SELECT email FROM nguoi_dung WHERE ma_nguoi_dung = $2) AS "email",
          noi_dung AS "noiDung",
          thoi_gian_tao AS "createdAt"
      `,
      [data.maCongViec, data.maNguoiDung, data.noiDung]
    );

    const binhLuan = ketQua.rows[0];

    if (!binhLuan) {
      throw new Error("Tao binh luan cong viec that bai");
    }

    return anhXaBinhLuan(binhLuan);
  }

  async taoThongBaoNhieu(data: DuLieuTaoThongBaoKanban, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
    const nguoiNhanIds = [...new Set(data.nguoiNhanIds.filter((id) => id && id !== data.actorId))];

    if (nguoiNhanIds.length === 0) {
      return;
    }

    const notificationIds = nguoiNhanIds.map(() => uuidv7());
    const coCotMaCongViec = await this.coHoTroThongBaoGanCongViecBangCot(boThucThi);

    if (coCotMaCongViec) {
      await boThucThi.truyVan(
        `
          INSERT INTO thong_bao (
            ma_thong_bao,
            ma_nguoi_nhan,
            nguoi_tao,
            tieu_de,
            noi_dung,
            loai_thong_bao,
            ma_cong_viec,
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
            $6::uuid,
            NOW(),
            NOW()
          FROM unnest($1::uuid[], $2::uuid[]) AS ids(ma_thong_bao, ma_nguoi_nhan)
        `,
        [notificationIds, nguoiNhanIds, data.actorId, data.tieuDe, data.noiDung, data.maCongViec ?? null]
      );
      return;
    }

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

  private escapeLikePattern(value: string) {
    return value.replace(/[\\%_]/g, (match) => `\\${match}`);
  }

  private async layViTriCuoiCot(
    maNhom: string,
    trangThai: TrangThaiCongViecKanban,
    boThucThi: BoThucThiTruyVan
  ) {
    const coViTri = await this.coHoTroViTriCongViec(boThucThi);
    const ketQua = await boThucThi.truyVan<{ viTri: string | number }>(
      coViTri
        ? `
            SELECT COALESCE(MAX(vi_tri), 0) + 1 AS "viTri"
            FROM cong_viec_nhom
            WHERE ma_nhom = $1
              AND trang_thai = $2::enum_trang_thai_cong_viec
          `
        : `
            SELECT COUNT(*) + 1 AS "viTri"
            FROM cong_viec_nhom
            WHERE ma_nhom = $1
              AND trang_thai = $2::enum_trang_thai_cong_viec
          `,
      [maNhom, trangThai]
    );

    return Number(ketQua.rows[0]?.viTri ?? 1);
  }

  private taoCauTruyVanCongViecCoSo(coViTri: boolean, dieuKien: string, forUpdate: boolean) {
    const cotViTri = coViTri
      ? `cvn.vi_tri AS "viTri"`
      : `ROW_NUMBER() OVER (PARTITION BY cvn.trang_thai ORDER BY cvn.thoi_gian_tao ASC)::int AS "viTri"`;
    const sapXep = coViTri
      ? `cvn.trang_thai ASC, cvn.vi_tri ASC NULLS LAST, cvn.thoi_gian_tao ASC`
      : `cvn.trang_thai ASC, cvn.thoi_gian_tao ASC`;

    return `
      SELECT
        cvn.ma_cong_viec AS "maCongViec",
        cvn.ma_nhom AS "maNhom",
        cvn.nguoi_duoc_giao AS "nguoiDuocGiao",
        nd.ho_ten AS "nguoiDuocGiaoHoTen",
        nd.email AS "nguoiDuocGiaoEmail",
        cvn.tieu_de AS "tieuDe",
        cvn.mo_ta AS "moTa",
        cvn.trang_thai AS "trangThai",
        cvn.han_hoan_thanh AS "hanHoanThanh",
        ${cotViTri},
        COUNT(bl.ma_binh_luan)::int AS "soBinhLuan",
        cvn.thoi_gian_tao AS "createdAt",
        cvn.thoi_gian_cap_nhat AS "updatedAt"
      FROM cong_viec_nhom cvn
      LEFT JOIN nguoi_dung nd ON nd.ma_nguoi_dung = cvn.nguoi_duoc_giao
      LEFT JOIN binh_luan_cong_viec bl ON bl.ma_cong_viec = cvn.ma_cong_viec
      WHERE ${dieuKien}
      GROUP BY
        cvn.ma_cong_viec,
        cvn.ma_nhom,
        cvn.nguoi_duoc_giao,
        nd.ho_ten,
        nd.email,
        cvn.tieu_de,
        cvn.mo_ta,
        cvn.trang_thai,
        cvn.han_hoan_thanh,
        cvn.thoi_gian_tao,
        cvn.thoi_gian_cap_nhat
        ${coViTri ? ", cvn.vi_tri" : ""}
      ORDER BY ${sapXep}
    `;
  }
}
