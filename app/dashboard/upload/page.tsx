"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getUsageAction, handleUploadDocument } from "./actions";
import { extractTextFromPDF } from "@/lib/pdf";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileText, UploadCloud, Sparkles } from "lucide-react";

const TEXT_MIN = 100;
const TEXT_MAX = 15000;
const PDF_MAX_MB = 5;

export default function UploadPage() {
  const mode = useSearchParams().get("mode");
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState<any | null>(null);
  const [usageLoading, setUsageLoading] = useState(true);

  useEffect(() => {
    async function loadUsage() {
      try {
        const data = await getUsageAction();
        setUsage(data);
        setText("");
        setFile(null);
        setTitle("");
        setLoading(false);
      } finally {
        setUsageLoading(false);
      }
    }

    loadUsage();
  }, []);

  useEffect(() => {
    if (!mode) {
      router.replace("/dashboard/upload?mode=text");
      return;
    }

    if (mode !== "text" && mode !== "pdf") {
      router.replace("/dashboard");
    }
  }, [mode, router]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      return toast.error("Please add a document title");
    }

    if (mode === "text") {
      if (!text.trim()) {
        return toast.error("Please paste some content");
      }
      if (text.length < TEXT_MIN) {
        return toast.error(`Text must be at least ${TEXT_MIN} characters`);
      }
      if (text.length > TEXT_MAX) {
        return toast.error(`Text cannot exceed ${TEXT_MAX} characters`);
      }
    }

    if (mode === "pdf") {
      if (!file) {
        return toast.error("Please upload a PDF file");
      }
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > PDF_MAX_MB) {
        return toast.error(`PDF must be under ${PDF_MAX_MB} MB`);
      }
    }
    setLoading(true);

    try {
      let extractedText = text.trim();

      if (mode === "pdf" && file) {
        extractedText = await extractTextFromPDF(file);
      }

      const doc = await handleUploadDocument({
        title,
        file: mode === "pdf" ? file : null,
        text: extractedText,
      });
      toast.success("Document uploaded successfully");
      router.push(`/dashboard/summarize/${doc.id}`);
    } catch (e: any) {
      toast.error(e.message || "Something went wrong");
    } finally {
      setLoading(false);
      setText("");
      setFile(null);
      setTitle("");
    }
  };

  // Tăng giới hạn lượt test lên 100
  const pdfRemaining = usage
    ? Math.max(100 - (usage.pdf_summaries_today ?? 0), 0)
    : 100;
  const textRemaining = usage
    ? Math.max(100 - (usage.text_summaries_today ?? 0), 0)
    : 100;

  // Bỏ khóa nút bấm để test thoải mái
  const limitReached = false;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-10">
        {/* Header Header */}
        <div className="text-center space-y-4">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold tracking-wide rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Sparkles className="w-3.5 h-3.5" />
            {mode === "pdf" ? "PDF AI SUMMARIZER" : "TEXT AI SUMMARIZER"}
          </span>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white">
            {mode === "pdf" ? "Summarize Your PDF" : "Summarize Your Notes"}
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-xl mx-auto">
            Transform heavy documents into high-yield, revision-ready bullet
            points in seconds.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/60 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8">
          {/* Document Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">
              Document Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. DBMS – Normalization & Indexing"
              className="w-full rounded-xl bg-slate-900/80 border border-slate-700 px-4 py-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            />
          </div>

          {/* Mode: PDF */}
          {mode === "pdf" && (
            <label
              className="block cursor-pointer group"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const droppedFile = e.dataTransfer.files[0];
                if (droppedFile) setFile(droppedFile);
              }}
            >
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />

              <div className="rounded-2xl border-2 border-dashed border-slate-700 group-hover:border-indigo-500/60 bg-slate-900/40 group-hover:bg-indigo-500/5 px-6 py-12 text-center transition-all duration-200">
                {!file ? (
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-indigo-400 group-hover:scale-110 transition-transform">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-200">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        PDF only • Max {PDF_MAX_MB} MB • Text-based documents
                        recommended
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center mx-auto text-indigo-400">
                      <FileText className="w-6 h-6" />
                    </div>
                    <p className="font-semibold text-indigo-400">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      File attached & ready for analysis
                    </p>
                  </div>
                )}
              </div>
            </label>
          )}

          {/* Mode: Text */}
          {mode === "text" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">
                Content / Study Notes
              </label>

              <div className="relative">
                <textarea
                  rows={8}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste lecture notes, syllabus, or raw text here..."
                  className="w-full rounded-2xl bg-slate-900/80 border border-slate-700 px-4 py-4 pr-20 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                />

                <span
                  className={`absolute bottom-3 right-4 text-xs font-mono
                  ${
                    text.length > TEXT_MAX || text.length < TEXT_MIN
                      ? "text-rose-500"
                      : "text-slate-500"
                  }`}
                >
                  {text.length}/{TEXT_MAX}
                </span>
              </div>

              <p className="text-xs text-slate-400">
                Minimum {TEXT_MIN} characters. Clean text ensures maximum AI
                accuracy.
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={loading || usageLoading || limitReached}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-95 text-white py-4 font-semibold shadow-lg shadow-indigo-500/25 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {usageLoading
              ? "Verifying quota..."
              : limitReached
              ? "Daily Quota Reached"
              : loading
              ? "Processing Document..."
              : "Generate AI Summary"}
          </button>
        </div>
      </div>
    </div>
  );
}