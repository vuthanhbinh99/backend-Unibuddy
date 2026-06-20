import { randomInt, randomBytes } from "node:crypto";

const CHU_KY_TU_HOA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const CHU_KY_TU_THUONG = "abcdefghijklmnopqrstuvwxyz";
const CHU_SO = "0123456789";
const KY_TU_DAC_BIET = "!@#$%^&*()-_=+[]{};:,.?/";

const tapKyTu = [CHU_KY_TU_HOA, CHU_KY_TU_THUONG, CHU_SO, KY_TU_DAC_BIET];
const tatCaKyTu = tapKyTu.join("");

const layKyTuNgauNhien = (tap: string) => tap[randomInt(0, tap.length)];

const tronMang = <T>(mang: T[]) => {
  for (let index = mang.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(0, index + 1);
    [mang[index], mang[swapIndex]] = [mang[swapIndex], mang[index]];
  }

  return mang;
};

export const taoMatKhauTamSecure = (doDaiToiThieu = 12, doDaiToiDa = 16) => {
  const doDai = randomInt(doDaiToiThieu, doDaiToiDa + 1);
  const kyTu = tapKyTu.map(layKyTuNgauNhien);

  while (kyTu.length < doDai) {
    kyTu.push(tatCaKyTu[randomInt(0, tatCaKyTu.length)]);
  }

  return tronMang(kyTu).join("");
};

export const taoXacNhanNgauNhien = (doDai = 16) => randomBytes(doDai).toString("hex");