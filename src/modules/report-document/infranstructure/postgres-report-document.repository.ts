import type { BoThucThiTruyVan } from "../../../shared/database/database.js";
import type { KhoBaoCaoTaiLieu, DuLieuDuyetBaoCaoTaiLieu } from "../application/ports/report-document.repository.js";
import type {
	ReportDocumentDetail,
	ReportDocumentListItem,
	TrangThaiBaoCaoTaiLieu,
	TrangThaiTaiLieu
} from "../domain/report-document.js";

type DongBaoCaoTaiLieu = {
	maBaoCao: string;
	maTaiLieu: string;
	nguoiBaoCao: string;
	nguoiBaoCaoEmail: string | null;
	nguoiBaoCaoHoTen: string | null;
	lyDo: string;
	trangThai: TrangThaiBaoCaoTaiLieu;
	nguoiKiemDuyet: string | null;
	nguoiKiemDuyetEmail: string | null;
	nguoiKiemDuyetHoTen: string | null;
	ketQuaKiemDuyet: string | null;
	tenFile: string;
	trangThaiTaiLieu: TrangThaiTaiLieu;
	createdAt: Date;
	updatedAt: Date;
};

const mapBaoCaoTaiLieu = (row: DongBaoCaoTaiLieu): ReportDocumentDetail => ({
	maBaoCao: row.maBaoCao,
	maTaiLieu: row.maTaiLieu,
	nguoiBaoCao: row.nguoiBaoCao,
	nguoiBaoCaoEmail: row.nguoiBaoCaoEmail,
	nguoiBaoCaoHoTen: row.nguoiBaoCaoHoTen,
	lyDo: row.lyDo,
	trangThai: row.trangThai,
	nguoiKiemDuyet: row.nguoiKiemDuyet,
	nguoiKiemDuyetEmail: row.nguoiKiemDuyetEmail,
	nguoiKiemDuyetHoTen: row.nguoiKiemDuyetHoTen,
	ketQuaKiemDuyet: row.ketQuaKiemDuyet,
	tenFile: row.tenFile,
	trangThaiTaiLieu: row.trangThaiTaiLieu,
	createdAt: row.createdAt,
	updatedAt: row.updatedAt
});

const cauTruyVanCoSo = `
	SELECT
		bctl.ma_bao_cao AS "maBaoCao",
		bctl.ma_tai_lieu AS "maTaiLieu",
		bctl.nguoi_bao_cao AS "nguoiBaoCao",
		nbc.email AS "nguoiBaoCaoEmail",
		nbc.ho_ten AS "nguoiBaoCaoHoTen",
		bctl.ly_do AS "lyDo",
		bctl.trang_thai AS "trangThai",
		bctl.nguoi_kiem_duyet AS "nguoiKiemDuyet",
		nkd.email AS "nguoiKiemDuyetEmail",
		nkd.ho_ten AS "nguoiKiemDuyetHoTen",
		bctl.ket_qua_kiem_duyet AS "ketQuaKiemDuyet",
		tl.ten_file AS "tenFile",
		tl.trang_thai AS "trangThaiTaiLieu",
		bctl.thoi_gian_tao AS "createdAt",
		bctl.thoi_gian_cap_nhat AS "updatedAt"
	FROM bao_cao_tai_lieu bctl
	INNER JOIN tai_lieu tl ON tl.ma_tai_lieu = bctl.ma_tai_lieu
	INNER JOIN nguoi_dung nbc ON nbc.ma_nguoi_dung = bctl.nguoi_bao_cao
	LEFT JOIN nguoi_dung nkd ON nkd.ma_nguoi_dung = bctl.nguoi_kiem_duyet
`;

export class KhoBaoCaoTaiLieuPostgres implements KhoBaoCaoTaiLieu {
	constructor(private readonly coSoDuLieu: BoThucThiTruyVan) {}

	async lietKe(
		trangThai?: TrangThaiBaoCaoTaiLieu,
		boThucThi: BoThucThiTruyVan = this.coSoDuLieu
	): Promise<ReportDocumentListItem[]> {
		const ketQua = await boThucThi.truyVan<DongBaoCaoTaiLieu>(
			`${cauTruyVanCoSo}
			 ${trangThai ? "WHERE bctl.trang_thai = $1" : ""}
			 ORDER BY bctl.thoi_gian_tao DESC`,
			trangThai ? [trangThai] : undefined
		);

		return ketQua.rows.map(mapBaoCaoTaiLieu);
	}

	async timTheoMa(maBaoCao: string, boThucThi: BoThucThiTruyVan = this.coSoDuLieu) {
		const ketQua = await boThucThi.truyVan<DongBaoCaoTaiLieu>(
			`${cauTruyVanCoSo}
			 WHERE bctl.ma_bao_cao = $1
			 LIMIT 1`,
			[maBaoCao]
		);

		return ketQua.rows[0] ? mapBaoCaoTaiLieu(ketQua.rows[0]) : null;
	}

	async duyetBaoCao(
		maBaoCao: string,
		duLieu: DuLieuDuyetBaoCaoTaiLieu,
		boThucThi: BoThucThiTruyVan = this.coSoDuLieu
	) {
		const capNhatBaoCao = await boThucThi.truyVan<DongBaoCaoTaiLieu>(
			`
				UPDATE bao_cao_tai_lieu
				SET
					trang_thai = 'DA_DUYET',
					nguoi_kiem_duyet = $2,
					ket_qua_kiem_duyet = $3,
					thoi_gian_cap_nhat = NOW(),
					thoi_gian_kiem_duyet = NOW()
				WHERE ma_bao_cao = $1
				RETURNING
					ma_bao_cao AS "maBaoCao",
					ma_tai_lieu AS "maTaiLieu",
					nguoi_bao_cao AS "nguoiBaoCao",
					NULL::text AS "nguoiBaoCaoEmail",
					NULL::text AS "nguoiBaoCaoHoTen",
					ly_do AS "lyDo",
					trang_thai AS "trangThai",
					nguoi_kiem_duyet AS "nguoiKiemDuyet",
					NULL::text AS "nguoiKiemDuyetEmail",
					NULL::text AS "nguoiKiemDuyetHoTen",
					ket_qua_kiem_duyet AS "ketQuaKiemDuyet",
					''::text AS "tenFile",
					'DA_XOA'::text AS "trangThaiTaiLieu",
					thoi_gian_tao AS "createdAt",
					thoi_gian_cap_nhat AS "updatedAt"
			`,
			[maBaoCao, duLieu.nguoiKiemDuyet, duLieu.ketQuaKiemDuyet]
		);

		if (!capNhatBaoCao.rows[0]) {
			return null;
		}

		await boThucThi.truyVan(
			`
				UPDATE tai_lieu
				SET trang_thai = 'DA_XOA', thoi_gian_cap_nhat = NOW()
				WHERE ma_tai_lieu = (SELECT ma_tai_lieu FROM bao_cao_tai_lieu WHERE ma_bao_cao = $1)
			`,
			[maBaoCao]
		);

		return this.timTheoMa(maBaoCao, boThucThi);
	}

	async tuChoiBaoCao(
		maBaoCao: string,
		duLieu: DuLieuDuyetBaoCaoTaiLieu,
		boThucThi: BoThucThiTruyVan = this.coSoDuLieu
	) {
		const capNhatBaoCao = await boThucThi.truyVan<DongBaoCaoTaiLieu>(
			`
				UPDATE bao_cao_tai_lieu
				SET
					trang_thai = 'DA_TU_CHOI',
					nguoi_kiem_duyet = $2,
					ket_qua_kiem_duyet = $3,
					thoi_gian_cap_nhat = NOW(),
					thoi_gian_kiem_duyet = NOW()
				WHERE ma_bao_cao = $1
				RETURNING
					ma_bao_cao AS "maBaoCao",
					ma_tai_lieu AS "maTaiLieu",
					nguoi_bao_cao AS "nguoiBaoCao",
					NULL::text AS "nguoiBaoCaoEmail",
					NULL::text AS "nguoiBaoCaoHoTen",
					ly_do AS "lyDo",
					trang_thai AS "trangThai",
					nguoi_kiem_duyet AS "nguoiKiemDuyet",
					NULL::text AS "nguoiKiemDuyetEmail",
					NULL::text AS "nguoiKiemDuyetHoTen",
					ket_qua_kiem_duyet AS "ketQuaKiemDuyet",
					''::text AS "tenFile",
					'KHA_DUNG'::text AS "trangThaiTaiLieu",
					thoi_gian_tao AS "createdAt",
					thoi_gian_cap_nhat AS "updatedAt"
			`,
			[maBaoCao, duLieu.nguoiKiemDuyet, duLieu.ketQuaKiemDuyet]
		);

		if (!capNhatBaoCao.rows[0]) {
			return null;
		}

		await boThucThi.truyVan(
			`
				UPDATE tai_lieu
				SET trang_thai = 'KHA_DUNG', thoi_gian_cap_nhat = NOW()
				WHERE ma_tai_lieu = (SELECT ma_tai_lieu FROM bao_cao_tai_lieu WHERE ma_bao_cao = $1)
			`,
			[maBaoCao]
		);

		return this.timTheoMa(maBaoCao, boThucThi);
	}
}