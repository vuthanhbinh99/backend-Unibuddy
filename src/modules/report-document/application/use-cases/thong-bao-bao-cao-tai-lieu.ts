import type { ReportDocumentDetail } from "../../domain/report-document.js";

type LoaiThongBao = "DUYET" | "TU_CHOI";

export const taoThongBaoEmailBaoCaoTaiLieu = (baoCao: ReportDocumentDetail, loaiThongBao: LoaiThongBao) => {
  const trangThaiXuLy = loaiThongBao === "DUYET" ? "đã được duyệt" : "đã bị từ chối";
  const tieuDe =
    loaiThongBao === "DUYET"
      ? "Báo cáo tài liệu của bạn đã được duyệt"
      : "Báo cáo tài liệu của bạn đã bị từ chối";

  return {
    subject: tieuDe,
    text: [
      `Xin chào ${baoCao.nguoiBaoCaoHoTen ?? "bạn"},`,
      "",
      `Báo cáo tài liệu của bạn cho tệp \"${baoCao.tenFile}\" ${trangThaiXuLy}.`,
      `Mã báo cáo: ${baoCao.maBaoCao}`,
      `Mã tài liệu: ${baoCao.maTaiLieu}`,
      `Lý do báo cáo: ${baoCao.lyDo}`,
      `Kết quả kiểm duyệt: ${baoCao.ketQuaKiemDuyet ?? "Không có ghi chú"}`,
      `Trạng thái tài liệu: ${baoCao.trangThaiTaiLieu}`,
      "",
      "Trân trọng,",
      "UniBuddy"
    ].join("\n")
  };
};