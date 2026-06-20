import { cert, getApps, initializeApp, type App, type AppOptions } from "firebase-admin/app";

export type CauHinhFirebase = {
  projectId: string | null;
  clientEmail: string | null;
  privateKey: string | null;
  storageBucket: string | null;
  serviceAccountJson: string | null;
};

type TaiKhoanDichVuFirebase = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

const TEN_UNG_DUNG_FIREBASE = "unibuddy-backend";

const docChuoi = (value: unknown) => (typeof value === "string" && value.trim() ? value : null);

const docTaiKhoanDichVu = (cauHinh: CauHinhFirebase): TaiKhoanDichVuFirebase | null => {
  if (cauHinh.serviceAccountJson) {
    const parsed = JSON.parse(cauHinh.serviceAccountJson) as Record<string, unknown>;
    const projectId = docChuoi(parsed.project_id) ?? docChuoi(parsed.projectId);
    const clientEmail = docChuoi(parsed.client_email) ?? docChuoi(parsed.clientEmail);
    const privateKey = docChuoi(parsed.private_key) ?? docChuoi(parsed.privateKey);

    if (projectId && clientEmail && privateKey) {
      return { projectId, clientEmail, privateKey };
    }
  }

  if (cauHinh.projectId && cauHinh.clientEmail && cauHinh.privateKey) {
    return {
      projectId: cauHinh.projectId,
      clientEmail: cauHinh.clientEmail,
      privateKey: cauHinh.privateKey
    };
  }

  return null;
};

export const layUngDungFirebaseAdmin = (cauHinh: CauHinhFirebase): App | null => {
  const taiKhoanDichVu = docTaiKhoanDichVu(cauHinh);

  if (!taiKhoanDichVu) {
    return null;
  }

  const ungDungDaCo = getApps().find((ungDung) => ungDung.name === TEN_UNG_DUNG_FIREBASE);

  if (ungDungDaCo) {
    return ungDungDaCo;
  }

  const tuyChon: AppOptions = {
    credential: cert(taiKhoanDichVu)
  };

  if (cauHinh.storageBucket) {
    tuyChon.storageBucket = cauHinh.storageBucket;
  }

  return initializeApp(tuyChon, TEN_UNG_DUNG_FIREBASE);
};
