import type { KhoNhatKyHeThong } from "../../../audit-logs/application/ports/audit-log.repository.js";
import type { KhoTruongHoc } from "../../../schools/application/ports/school.repository.js";
import type { BoQuanLyGiaoDich } from "../../../../shared/database/transaction.js";
import { LoiUngDung } from "../../../../shared/errors/app-error.js";
import type { KhoHocThuatTruongHoc } from "../ports/academic-rules.repository.js";
import type { QuyCheHocLucNhap } from "../../domain/academic-rules.js";
import { xacThucDanhSachQuyCheHocLuc } from "../academic-rules.validation.js";

export type LenhCapNhatQuyCheHocLuc = {
  actorId: string | null;
  maTruongCode: string;
  quyCheHocLuc: QuyCheHocLucNhap[];
};

type PhuThuoc = {
  khoTruongHoc: KhoTruongHoc;
  khoHocThuatTruongHoc: KhoHocThuatTruongHoc;
  khoNhatKyHeThong: KhoNhatKyHeThong;
  giaoDich: BoQuanLyGiaoDich;
};

export class XuLyCapNhatQuyCheHocLucTruongHoc {
  constructor(private readonly deps: PhuThuoc) {}

  async thucThi(command: LenhCapNhatQuyCheHocLuc) {
    const truongHoc = await this.deps.khoTruongHoc.timTheoMa(command.maTruongCode);

    if (!truongHoc) {
      throw LoiUngDung.khongTimThay("Không tìm thấy trường học");
    }

    const quyCheHocLuc = xacThucDanhSachQuyCheHocLuc(command.quyCheHocLuc);

    await this.deps.giaoDich.thucThiTrongGiaoDich(async (tx) => {
      await this.deps.khoHocThuatTruongHoc.capNhatQuyCheHocLuc(command.maTruongCode, quyCheHocLuc, tx);

      await this.deps.khoNhatKyHeThong.tao(
        {
          actorId: command.actorId,
          level: "INFO",
          action: "ACADEMIC_RULES_STANDING_UPDATED",
          tableName: "quy_che_hoc_luc",
          recordId: command.maTruongCode,
          message: "Admin cập nhật quy chế học lực",
          metadata: {
            maTruongCode: command.maTruongCode,
            soQuyChe: quyCheHocLuc.length
          }
        },
        tx
      );
    });

    return this.deps.khoHocThuatTruongHoc.layCauHinh(command.maTruongCode);
  }
}
