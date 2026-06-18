export type TrangThaiBaoCaoTaiLieu = "CHO_XU_LY" | "DA_DUYET" | "DA_TU_CHOI";

export type TrangThaiTaiLieu = "KHA_DUNG" | "DA_XOA" | "CHO_KIEM_DUYET";

export type ReportDocument = {
	maBaoCao: string;
	maTaiLieu: string;
	nguoiBaoCao: string;
	lyDo: string;
	trangThai: TrangThaiBaoCaoTaiLieu;
	nguoiKiemDuyet: string | null;
	ketQuaKiemDuyet: string | null;
	createdAt: Date;
	updatedAt: Date;
};

export type ReportDocumentDetail = ReportDocument & {
	tenFile: string;
	trangThaiTaiLieu: TrangThaiTaiLieu;
	nguoiBaoCaoEmail?: string | null;
	nguoiBaoCaoHoTen?: string | null;
	nguoiKiemDuyetEmail?: string | null;
	nguoiKiemDuyetHoTen?: string | null;
};

export type ReportDocumentListItem = ReportDocumentDetail;