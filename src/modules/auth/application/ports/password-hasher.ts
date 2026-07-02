export interface BoMaHoaMatKhau {
  soSanh(plainText: string, bam: string): Promise<boolean>;
  bam(plainText: string): Promise<string>;
}


