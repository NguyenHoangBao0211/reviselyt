"use server";
import { getUsage, uploadDocumentService } from "@/lib/services";

export async function handleUploadDocument({
  title,
  file,
  text,
}: {
  title: string;
  file: File | null;
  text: string;
}) {
  if (!title || (!file && !text)) {
    throw new Error("Provide a title and either text or PDF.");
  }

  try {
    const document = await uploadDocumentService({ title, file, text });
    return document;
  } catch (error: any) {
    console.error("Upload failed:", error);

    // Bắt mã lỗi 23505 trùng hash từ PostgreSQL/Supabase
    if (
      error?.code === "23505" ||
      error?.message?.includes("documents_hash_unique")
    ) {
      throw new Error(
        "Tài liệu này đã tồn tại trên hệ thống! Vui lòng chọn file PDF khác."
      );
    }

    throw new Error(error.message || "Failed to upload document");
  }
}

export async function getUsageAction() {
  const data = await getUsage();
  return data;
}