// Dùng router endpoint ổn định của Hugging Face
const HF_URL =
  "https://router.huggingface.co/hf-inference/models/sshleifer/distilbart-cnn-12-6";

export async function summarizeWithHF(text: string) {
  const token = process.env.HF_API_TOKEN;

  if (!token) throw new Error("HF_API_TOKEN missing in .env.local");

  try {
    const res = await fetch(HF_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: text,
        parameters: {
          max_length: 160,
          min_length: 60,
          do_sample: false,
        },
      }),
    });

    const rawText = await res.text();

    let data: any;
    try {
      data = JSON.parse(rawText);
    } catch {
      console.error("HF Non-JSON Response:", rawText);
      throw new Error(
        "Hugging Face server trả về phản hồi không hợp lệ. Vui lòng thử lại sau!"
      );
    }

    if (!res.ok) {
      console.error("HF ERROR RESPONSE:", data);
      if (data.error && data.error.includes("loading")) {
        throw new Error(
          "Mô hình AI đang khởi động trên Hugging Face, vui lòng thử lại sau 20 giây!"
        );
      }
      throw new Error(data.error || `HF API lỗi status ${res.status}`);
    }

    if (!Array.isArray(data) || !data[0]?.summary_text) {
      console.error("HF INVALID RESPONSE FORMAT:", data);
      throw new Error("Định dạng dữ liệu trả về không hợp lệ.");
    }

    return data[0].summary_text;
  } catch (err: any) {
    // Bắt lỗi ENOTFOUND nếu mất kết nối DNS/Internet
    if (err?.cause?.code === "ENOTFOUND" || err?.code === "ENOTFOUND") {
      console.error("Lỗi DNS Hugging Face:", err);
      throw new Error(
        "Không thể kết nối đến Hugging Face! Kiểm tra lại kết nối mạng hoặc DNS."
      );
    }
    throw err;
  }
}