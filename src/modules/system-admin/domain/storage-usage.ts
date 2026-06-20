export type DungLuongTheoDanhMuc = {
  category: string;
  bytes: number;
  fileCount: number;
};

export type DungLuongBangPostgres = {
  tableName: string;
  bytes: number;
};

export type ThongKeDungLuongNoiBo = {
  database: {
    totalBytes: number;
    tables: DungLuongBangPostgres[];
  };
  documents: {
    totalBytes: number;
    fileCount: number;
    categories: DungLuongTheoDanhMuc[];
  };
};

export type ThongKeDungLuongFirebase = {
  configured: boolean;
  bucket: string | null;
  totalBytes: number;
  fileCount: number;
  categories: DungLuongTheoDanhMuc[];
  error?: string;
};

export type ThongKeDungLuongHeThong = ThongKeDungLuongNoiBo & {
  firebase: ThongKeDungLuongFirebase;
};
