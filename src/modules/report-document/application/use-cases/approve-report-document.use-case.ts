import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { DichVuGuiEmail } from "../../../../shared/email/email.provider.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import { nhatKy } from "../../../../shared/logger/logger.js";
import type { KhoBaoCaoTaiLieu } from "../ports/report-document.repository.js";
import { taoThongBaoEmailBaoCaoTaiLieu } from "../use-cases/thong-bao-bao-cao-tai-lieu.js";

export type LenhDuyetBaoCaoTaiLieu = {
  actorId: string | null;
  maBaoCao: string;
};

type PhuThuoc = {
  khoBaoCaoTaiLieu: KhoBaoCaoTaiLieu;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  giaoDich: BoQuanLyGiaoDich;
  dichVuGuiEmail: DichVuGuiEmail;
};

export class XuLyDuyetBaoCaoTaiLieu {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhDuyetBaoCaoTaiLieu) {
    const actorId = command.actorId;

    if (!actorId) {
      throw LoiUngDung.khongDuocXacThuc();
    }

    const baoCao = await this.deps.khoBaoCaoTaiLieu.timTheoMa(command.maBaoCao);

    if (!baoCao) {
      throw LoiUngDung.khongTimThay("Không tìm thấy báo cáo tài liệu");
    }

    if (baoCao.trangThai !== "CHO_XU_LY") {
      throw LoiUngDung.xungDot("Báo cáo tài liệu đã được xử lý");
    }

    const capNhat = await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
      const capNhatBaoCao = await this.deps.khoBaoCaoTaiLieu.duyetBaoCao(
        command.maBaoCao,
        {
          nguoiKiemDuyet: actorId,
          ketQuaKiemDuyet: "Báo cáo hợp lệ, tài liệu đã được ẩn khỏi hệ thống"
        },
        tx
      );

      if (!capNhatBaoCao) {
        throw LoiUngDung.khongTimThay("Không tìm thấy báo cáo tài liệu");
      }

      await this.deps.khoNhatKyHeThong.tao(
        {
          actorId: command.actorId,
          level: "INFO",
          action: "DOCUMENT_REPORT_APPROVED",
          tableName: "bao_cao_tai_lieu",
          recordId: command.maBaoCao,
          message: "Admin duyệt báo cáo tài liệu",
          metadata: {
            maBaoCao: command.maBaoCao,
            maTaiLieu: capNhatBaoCao.maTaiLieu
          }
        },
        tx
      );

      return capNhatBaoCao;
    });

    await this.guiThongBaoEmail(capNhat);
    return capNhat;
  }

  private async guiThongBaoEmail(baoCao: NonNullable<Awaited<ReturnType<KhoBaoCaoTaiLieu["duyetBaoCao"]>>>) {
    const emailNguoiBaoCao = baoCao.nguoiBaoCaoEmail?.trim();

    if (!emailNguoiBaoCao) {
      nhatKy.warn("Không thể gửi email thông báo duyệt báo cáo tài liệu vì thiếu email người báo cáo", {
        maBaoCao: baoCao.maBaoCao,
        maTaiLieu: baoCao.maTaiLieu
      });
      return;
    }

    try {
      const noiDungEmail = taoThongBaoEmailBaoCaoTaiLieu(baoCao, "DUYET");

      await this.deps.dichVuGuiEmail.gui({
        to: emailNguoiBaoCao,
        subject: noiDungEmail.subject,
        text: noiDungEmail.text
      });
    } catch (error) {
      nhatKy.error("Không thể gửi email thông báo duyệt báo cáo tài liệu", {
        maBaoCao: baoCao.maBaoCao,
        maTaiLieu: baoCao.maTaiLieu,
        emailNguoiBaoCao,
        error
      });
    }
  }
}
