import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import type { XuLyGuiThongBaoHeThong } from "../../../notifications/application/use-cases/send-system-notification.use-case.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { nhatKy } from "../../../../shared/logger/logger.js";
import type { KhoBaoCaoTaiLieu } from "../ports/report-document.repository.js";
import type { ReportDocumentDetail } from "../../domain/report-document.js";

export type LenhTaoBaoCaoTaiLieu = {
  maTaiLieu: string;
  nguoiBaoCao: string;
  lyDo: string;
};

type PhuThuoc = {
  khoBaoCaoTaiLieu: KhoBaoCaoTaiLieu;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  giaoDich: BoQuanLyGiaoDich;
  xuLyGuiThongBaoHeThong: XuLyGuiThongBaoHeThong;
};

const CAT_LY_DO = (lyDo: string) => (lyDo.length > 160 ? `${lyDo.slice(0, 157)}...` : lyDo);

export class XuLyTaoBaoCaoTaiLieu {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhTaoBaoCaoTaiLieu): Promise<ReportDocumentDetail> {
    const baoCao = await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
      const banGhi = await this.deps.khoBaoCaoTaiLieu.tao(
        {
          maTaiLieu: command.maTaiLieu,
          nguoiBaoCao: command.nguoiBaoCao,
          lyDo: command.lyDo
        },
        tx
      );

      if (!banGhi) {
        throw LoiUngDung.xungDot(
          "Không thể tạo báo cáo. Tài liệu không tồn tại, đã bị gỡ hoặc bạn đã báo cáo tài liệu này rồi"
        );
      }

      await this.deps.khoNhatKyHeThong.tao(
        {
          actorId: command.nguoiBaoCao,
          level: "INFO",
          action: "DOCUMENT_REPORT_CREATED",
          tableName: "bao_cao_tai_lieu",
          recordId: banGhi.maBaoCao,
          message: "Người dùng gửi báo cáo tài liệu",
          metadata: {
            maBaoCao: banGhi.maBaoCao,
            maTaiLieu: banGhi.maTaiLieu,
            lyDo: command.lyDo
          }
        },
        tx
      );

      return banGhi;
    });

    await this.guiThongBaoQuanTri(baoCao);

    return baoCao;
  }

  private async guiThongBaoQuanTri(baoCao: ReportDocumentDetail) {
    try {
      await this.deps.xuLyGuiThongBaoHeThong.thucThi({
        actorId: baoCao.nguoiBaoCao,
        title: "Báo cáo tài liệu mới",
        content: `Tài liệu "${baoCao.tenFile}" bị báo cáo: ${CAT_LY_DO(baoCao.lyDo)}`,
        target: { roleCodes: ["ADMIN", "QUAN_TRI_VIEN"] },
        data: {
          type: "BAO_CAO_TAI_LIEU",
          maBaoCao: baoCao.maBaoCao,
          maTaiLieu: baoCao.maTaiLieu
        }
      });
    } catch (error) {
      nhatKy.error("Không thể gửi thông báo báo cáo tài liệu cho quản trị viên", {
        maBaoCao: baoCao.maBaoCao,
        maTaiLieu: baoCao.maTaiLieu,
        error
      });
    }
  }
}
