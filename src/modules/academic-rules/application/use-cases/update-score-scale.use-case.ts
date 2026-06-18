import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { KhoTruongHoc } from "../../../schools/application/ports/school.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import type { KhoHocThuatTruongHoc } from "../ports/academic-rules.repository.js";
import type { MucThangDiemNhap } from "../../domain/academic-rules.js";
import { xacThucDanhSachThangDiem } from "../academic-rules.validation.js";

export type LenhCapNhatThangDiem = {
  actorId: string | null;
  maTruongCode: string;
  mucThangDiem: MucThangDiemNhap[];
};

type PhuThuoc = {
  khoTruongHoc: KhoTruongHoc;
  khoHocThuatTruongHoc: KhoHocThuatTruongHoc;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  giaoDich: BoQuanLyGiaoDich;
};

export class XuLyCapNhatThangDiemTruongHoc {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhCapNhatThangDiem) {
    const truongHoc = await this.deps.khoTruongHoc.timTheoMa(command.maTruongCode);

    if (!truongHoc) {
      throw LoiUngDung.khongTimThay("Không tìm thấy trường học");
    }

    const mucThangDiem = xacThucDanhSachThangDiem(command.mucThangDiem);

    await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
      await this.deps.khoHocThuatTruongHoc.capNhatThangDiem(command.maTruongCode, mucThangDiem, tx);

      await this.deps.khoNhatKyHeThong.tao(
        {
          actorId: command.actorId,
          level: "INFO",
          action: "ACADEMIC_RULES_SCORE_SCALE_UPDATED",
          tableName: "thang_diem",
          recordId: command.maTruongCode,
          message: "Admin cập nhật thang điểm trường học",
          metadata: {
            maTruongCode: command.maTruongCode,
            soMuc: mucThangDiem.length
          }
        },
        tx
      );
    });

    return this.deps.khoHocThuatTruongHoc.layCauHinh(command.maTruongCode);
  }
}
