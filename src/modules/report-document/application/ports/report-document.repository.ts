import type { BoThucThiTruyVan } from "../../../../shared/database/database.js";
import type {
	ReportDocumentDetail,
	ReportDocumentListItem,
	TrangThaiBaoCaoTaiLieu
} from "../../domain/report-document.js";

export type DuLieuDuyetBaoCaoTaiLieu = {
	nguoiKiemDuyet: string;
	ketQuaKiemDuyet: string;
};

export interface KhoBaoCaoTaiLieu {
	lietKe(
		trangThai?: TrangThaiBaoCaoTaiLieu,
		boThucThi?: BoThucThiTruyVan
	): Promise<ReportDocumentListItem[]>;
	timTheoMa(maBaoCao: string, boThucThi?: BoThucThiTruyVan): Promise<ReportDocumentDetail | null>;
	duyetBaoCao(
		maBaoCao: string,
		duLieu: DuLieuDuyetBaoCaoTaiLieu,
		boThucThi?: BoThucThiTruyVan
	): Promise<ReportDocumentDetail | null>;
	tuChoiBaoCao(
		maBaoCao: string,
		duLieu: DuLieuDuyetBaoCaoTaiLieu,
		boThucThi?: BoThucThiTruyVan
	): Promise<ReportDocumentDetail | null>;
}