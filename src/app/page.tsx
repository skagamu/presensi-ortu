"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  ArrowLeft, 
  Check, 
  ChevronRight, 
  GraduationCap, 
  Wrench, 
  Calculator, 
  ShoppingBag, 
  Layers, 
  User, 
  Calendar, 
  FileText, 
  Eye, 
  ExternalLink, 
  CheckCircle2, 
  Search, 
  RotateCcw,
  Sparkles,
  School,
  X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface SiswaItem {
  nis: string;
  nama: string;
  kelas: string;
  tingkat: string;
  jurusan: string;
}

interface LogPresensiItem {
  nis: string;
  tanggal: string;
  status: string;
  adaSurat: boolean;
  linkBukti?: string;
}

const SHEET_ID = "1i3Nxqmsy7T6D4N17MdRgT3x7l0L_Lr3TcbthPbnPwWY";

const JURUSAN_META: Record<string, { label: string; desc: string; icon: any; color: string }> = {
  "TKR": {
    label: "Teknik Kendaraan Ringan (TKR)",
    desc: "Teknologi & Rekayasa Otomotif",
    icon: Wrench,
    color: "bg-blue-500 text-white"
  },
  "AK": {
    label: "Akuntansi (AK)",
    desc: "Akuntansi & Keuangan Lembaga",
    icon: Calculator,
    color: "bg-emerald-500 text-white"
  },
  "BD": {
    label: "Bisnis Digital (BD)",
    desc: "Bisnis Digital & Manajemen Pemasaran",
    icon: ShoppingBag,
    color: "bg-amber-500 text-white"
  },
  "LAINNYA": {
    label: "Program Keahlian Lain",
    desc: "Kelas & Jurusan Tambahan",
    icon: Layers,
    color: "bg-purple-500 text-white"
  }
};

const getJurusanKey = (kelas: string): string => {
  const k = kelas.toUpperCase();
  if (k.includes("TKR")) return "TKR";
  if (k.includes("AK")) return "AK";
  if (k.includes("BD") || k.includes("BDP") || k.includes("PM")) return "BD";
  return "LAINNYA";
};

export default function OrtuOnboardingPage() {
  const [allStudents, setAllStudents] = useState<SiswaItem[]>([]);
  const [logs, setLogs] = useState<LogPresensiItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Wizard Step: 1 (Jurusan), 2 (Kelas), 3 (Siswa), 4 (Detail Presensi)
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Selections
  const [selectedJurusanKey, setSelectedJurusanKey] = useState<string>("");
  const [selectedKelas, setSelectedKelas] = useState<string>("");
  const [selectedNis, setSelectedNis] = useState<string>("");
  const [studentSearch, setStudentSearch] = useState("");

  // Preview Modal
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>("");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const levels = ["X", "XI", "XII"];
      const studentPromises = levels.map(async (lvl) => {
        const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Siswa_${lvl}&_v=${Date.now()}`;
        const res = await fetch(url);
        const text = await res.text();
        const match = text.match(/google\.visualization\.Query\.setResponse\((.*)\);?/);
        if (match && match[1]) {
          const json = JSON.parse(match[1]);
          const rows = json.table.rows || [];
          const list: SiswaItem[] = [];
          rows.forEach((r: any) => {
            const c = r.c;
            if (c && c[1] && c[2] && c[3]) {
              const kelas = String(c[1].v || "").trim();
              list.push({
                kelas,
                nis: String(c[2].v || "").trim(),
                nama: String(c[3].v || "").trim(),
                tingkat: lvl,
                jurusan: getJurusanKey(kelas)
              });
            }
          });
          return list;
        }
        return [];
      });

      const presensiPromise = (async () => {
        const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=LogPresensi&_v=${Date.now()}`;
        const res = await fetch(url);
        const text = await res.text();
        const match = text.match(/google\.visualization\.Query\.setResponse\((.*)\);?/);
        if (match && match[1]) {
          const json = JSON.parse(match[1]);
          const rows = json.table.rows || [];
          const list: LogPresensiItem[] = [];
          rows.forEach((r: any) => {
            const c = r.c;
            if (c && c[2]) {
              list.push({
                nis: String(c[2].v || "").trim(),
                tanggal: c[1]?.f || c[1]?.v || "",
                status: String(c[5]?.v || "").toUpperCase(),
                adaSurat: Boolean(c[6]?.v),
                linkBukti: c[7]?.v ? String(c[7].v) : undefined,
              });
            }
          });
          return list;
        }
        return [];
      })();

      const [studentsNested, presensiLogs] = await Promise.all([
        Promise.all(studentPromises),
        presensiPromise
      ]);

      setAllStudents(studentsNested.flat());
      setLogs(presensiLogs);
    } catch (err) {
      console.error("Gagal mengambil data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Available Jurusans
  const availableJurusans = useMemo(() => {
    const keys = Array.from(new Set(allStudents.map(s => s.jurusan)));
    return keys.map(key => ({
      key,
      meta: JURUSAN_META[key] || JURUSAN_META["LAINNYA"],
      count: allStudents.filter(s => s.jurusan === key).length
    }));
  }, [allStudents]);

  // Available Classes for selected Jurusan
  const availableClasses = useMemo(() => {
    if (!selectedJurusanKey) return [];
    const classes = Array.from(
      new Set(allStudents.filter(s => s.jurusan === selectedJurusanKey).map(s => s.kelas))
    ).sort();
    return classes;
  }, [allStudents, selectedJurusanKey]);

  // Available Students for selected Class
  const availableStudents = useMemo(() => {
    if (!selectedKelas) return [];
    return allStudents
      .filter(s => s.kelas === selectedKelas)
      .filter(s => !studentSearch || s.nama.toLowerCase().includes(studentSearch.toLowerCase()) || s.nis.includes(studentSearch))
      .sort((a, b) => a.nama.localeCompare(b.nama));
  }, [allStudents, selectedKelas, studentSearch]);

  // Active Student
  const activeSiswa = useMemo(() => {
    if (!selectedNis) return null;
    return allStudents.find(s => s.nis === selectedNis) || null;
  }, [allStudents, selectedNis]);

  // Active Student Logs
  const activeLogs = useMemo(() => {
    if (!selectedNis) return [];
    return logs
      .filter(l => l.nis === selectedNis)
      .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  }, [logs, selectedNis]);

  const stats = useMemo(() => {
    let alpha = 0;
    let sakit = 0;
    let izin = 0;
    activeLogs.forEach((l) => {
      if (l.status === "ALPHA" || l.status === "A") alpha++;
      else if (l.status === "SAKIT" || l.status === "S") sakit++;
      else if (l.status === "IZIN" || l.status === "I") izin++;
    });
    return { alpha, sakit, izin, total: alpha + sakit + izin };
  }, [activeLogs]);

  const handleBack = () => {
    if (step === 4) {
      setStep(3);
    } else if (step === 3) {
      setStep(2);
      setSelectedNis("");
      setStudentSearch("");
    } else if (step === 2) {
      setStep(1);
      setSelectedKelas("");
    }
  };

  const handleResetAll = () => {
    setStep(1);
    setSelectedJurusanKey("");
    setSelectedKelas("");
    setSelectedNis("");
    setStudentSearch("");
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return "";
    if (url.includes("drive.google.com/file/d/")) {
      return url.replace(/\/view.*$/, "/preview");
    }
    return url;
  };

  const handleOpenPreview = (url: string, title: string) => {
    setPreviewUrl(getEmbedUrl(url));
    setPreviewTitle(title);
  };

  return (
    <div className="min-h-screen bg-neutral-900 sm:py-8 flex justify-center items-center">
      {/* MOBILE DEVICE CONTAINER */}
      <div className="w-full max-w-md min-h-screen sm:min-h-[844px] bg-slate-50 sm:rounded-[40px] shadow-2xl flex flex-col justify-between overflow-hidden border border-slate-200/50 relative">
        
        {/* TOP STATUS BAR & HEADER */}
        <div className="pt-4 px-6 pb-2">
          <div className="flex items-center justify-between">
            {/* Back Button */}
            {step > 1 ? (
              <button 
                onClick={handleBack}
                className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-200/80 flex items-center justify-center text-slate-700 hover:bg-slate-100 transition active:scale-95"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                <School className="w-5 h-5" />
              </div>
            )}

            {/* Stepper Progress Bars */}
            <div className="flex items-center gap-1.5">
              <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= 1 ? "w-8 bg-orange-600" : "w-6 bg-slate-200"}`} />
              <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= 2 ? "w-8 bg-orange-600" : "w-6 bg-slate-200"}`} />
              <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= 3 ? "w-8 bg-orange-600" : "w-6 bg-slate-200"}`} />
              <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= 4 ? "w-8 bg-orange-600" : "w-6 bg-slate-200"}`} />
            </div>
          </div>
        </div>

        {/* STEP BODY */}
        <div className="flex-1 px-6 pt-4 pb-6 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-80 space-y-3">
              <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-semibold text-slate-600">Memuat data sekolah...</p>
            </div>
          ) : (
            <>
              {/* STEP 1: PILIH JURUSAN */}
              {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div>
                    <span className="text-[11px] font-bold tracking-widest text-orange-600 uppercase">Langkah 1 dari 3</span>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
                      Pilih Jurusan Keahlian
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Silakan pilih bidang kejuruan yang ditempuh oleh putra/putri Anda.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {availableJurusans.map(({ key, meta }) => {
                      const Icon = meta.icon;
                      const isSelected = selectedJurusanKey === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setSelectedJurusanKey(key)}
                          className={`w-full p-4 rounded-2xl border text-left transition-all duration-200 flex items-center gap-3.5 ${
                            isSelected 
                              ? "bg-orange-50/80 border-orange-500 ring-2 ring-orange-500/20 shadow-sm" 
                              : "bg-white border-slate-200/80 hover:border-slate-300 shadow-sm"
                          }`}
                        >
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                            isSelected ? "bg-orange-600 text-white" : "bg-slate-100 text-slate-700"
                          }`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className={`font-bold text-sm truncate ${isSelected ? "text-orange-950" : "text-slate-900"}`}>
                              {meta.label}
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5 truncate">
                              {meta.desc}
                            </p>
                          </div>
                          {isSelected && (
                            <div className="w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center shrink-0">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 2: PILIH KELAS */}
              {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div>
                    <span className="text-[11px] font-bold tracking-widest text-orange-600 uppercase">Langkah 2 dari 3</span>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
                      Pilih Ruang Kelas
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Pilih kelas aktif berdasarkan jurusan <strong>{JURUSAN_META[selectedJurusanKey]?.label || selectedJurusanKey}</strong>.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {availableClasses.map((kelas) => {
                      const isSelected = selectedKelas === kelas;
                      const countInClass = allStudents.filter(s => s.kelas === kelas).length;
                      return (
                        <button
                          key={kelas}
                          type="button"
                          onClick={() => setSelectedKelas(kelas)}
                          className={`p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between h-28 ${
                            isSelected 
                              ? "bg-orange-50/80 border-orange-500 ring-2 ring-orange-500/20 shadow-sm" 
                              : "bg-white border-slate-200/80 hover:border-slate-300 shadow-sm"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-400">Kelas</span>
                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            )}
                          </div>
                          <div>
                            <h3 className={`font-black text-lg ${isSelected ? "text-orange-950" : "text-slate-900"}`}>
                              {kelas}
                            </h3>
                            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                              {countInClass} Siswa
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 3: PILIH NAMA SISWA */}
              {step === 3 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div>
                    <span className="text-[11px] font-bold tracking-widest text-orange-600 uppercase">Langkah 3 dari 3</span>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
                      Pilih Nama Siswa
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Daftar siswa di kelas <strong className="text-slate-800">{selectedKelas}</strong>.
                    </p>
                  </div>

                  {/* Search box */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <Input
                      placeholder="Cari nama atau NIS siswa..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="pl-9 bg-white border-slate-200 text-xs rounded-xl h-10 focus-visible:ring-orange-500"
                    />
                  </div>

                  <div className="space-y-2">
                    {availableStudents.length === 0 ? (
                      <div className="text-center py-8 text-xs text-slate-500">
                        Tidak ada nama siswa yang sesuai.
                      </div>
                    ) : (
                      availableStudents.map((s) => {
                        const isSelected = selectedNis === s.nis;
                        return (
                          <button
                            key={s.nis}
                            type="button"
                            onClick={() => setSelectedNis(s.nis)}
                            className={`w-full p-3.5 rounded-xl border text-left transition-all duration-150 flex items-center justify-between ${
                              isSelected
                                ? "bg-orange-50/80 border-orange-500 ring-2 ring-orange-500/20"
                                : "bg-white border-slate-200/80 hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                isSelected ? "bg-orange-600 text-white" : "bg-slate-100 text-slate-700"
                              }`}>
                                {s.nama.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <p className={`text-xs font-bold truncate ${isSelected ? "text-orange-950" : "text-slate-900"}`}>
                                  {s.nama}
                                </p>
                                <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                                  NIS: {s.nis}
                                </p>
                              </div>
                            </div>
                            {isSelected && (
                              <Check className="w-4 h-4 text-orange-600 stroke-[3] shrink-0" />
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* STEP 4: HASIL PRESENSI SISWA */}
              {step === 4 && activeSiswa && (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                  {/* Student Badge Card */}
                  <div className="bg-gradient-to-br from-orange-600 to-amber-600 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden">
                    <div className="relative z-10">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest bg-white/20 px-2.5 py-0.5 rounded-full backdrop-blur-md">
                        Kartu Presensi Siswa
                      </span>
                      <h3 className="text-xl font-black mt-2 leading-tight">
                        {activeSiswa.nama}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-orange-100 mt-1">
                        <span>NIS: <strong className="text-white font-mono">{activeSiswa.nis}</strong></span>
                        <span>•</span>
                        <span>Kelas: <strong className="text-white">{activeSiswa.kelas}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Summary Metric Cards */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Rekap Ketidakhadiran
                      </p>
                      <button 
                        onClick={handleResetAll} 
                        className="text-[11px] font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" /> Ganti Siswa
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-red-50 border border-red-200/80 rounded-2xl p-3 text-center">
                        <span className="text-[10px] uppercase font-bold text-red-600">Alpha</span>
                        <p className="text-2xl font-black text-red-950 mt-0.5">{stats.alpha}</p>
                        <span className="text-[10px] text-red-500 font-medium">Hari</span>
                      </div>
                      <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3 text-center">
                        <span className="text-[10px] uppercase font-bold text-amber-600">Sakit</span>
                        <p className="text-2xl font-black text-amber-950 mt-0.5">{stats.sakit}</p>
                        <span className="text-[10px] text-amber-500 font-medium">Hari</span>
                      </div>
                      <div className="bg-blue-50 border border-blue-200/80 rounded-2xl p-3 text-center">
                        <span className="text-[10px] uppercase font-bold text-blue-600">Izin</span>
                        <p className="text-2xl font-black text-blue-950 mt-0.5">{stats.izin}</p>
                        <span className="text-[10px] text-blue-500 font-medium">Hari</span>
                      </div>
                    </div>
                  </div>

                  {/* Logs list */}
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Riwayat Log Presensi ({activeLogs.length})
                    </p>

                    {activeLogs.length === 0 ? (
                      <div className="py-8 text-center bg-white border border-slate-200 rounded-2xl p-4">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1.5 opacity-80" />
                        <p className="text-xs font-bold text-slate-800">Kehadiran 100% Sempurna</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Tidak ada riwayat alpha, izin, maupun sakit.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {activeLogs.map((log, idx) => {
                          const isAlpha = log.status === "ALPHA" || log.status === "A";
                          const isSakit = log.status === "SAKIT" || log.status === "S";
                          const isIzin = log.status === "IZIN" || log.status === "I";

                          let badgeBg = "bg-slate-100 text-slate-700 border-slate-200";
                          if (isAlpha) badgeBg = "bg-red-50 text-red-700 border-red-200";
                          if (isSakit) badgeBg = "bg-amber-50 text-amber-700 border-amber-200";
                          if (isIzin) badgeBg = "bg-blue-50 text-blue-700 border-blue-200";

                          return (
                            <div 
                              key={idx} 
                              className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-sm flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="min-w-0 space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-semibold text-slate-800 text-[11px]">
                                    {log.tanggal}
                                  </span>
                                  <Badge variant="outline" className={`text-[10px] font-bold px-1.5 py-0 ${badgeBg}`}>
                                    {log.status}
                                  </Badge>
                                </div>
                                <p className="text-[11px] text-slate-500 truncate">
                                  {isSakit && (log.adaSurat ? "Surat Dokter / Klinik" : "Tanpa Surat Dokter")}
                                  {isIzin && (log.adaSurat ? "Surat Izin Orang Tua" : "Izin Lisan / Pesan")}
                                  {isAlpha && "Tanpa Keterangan"}
                                </p>
                              </div>

                              {log.linkBukti && log.linkBukti.startsWith("http") && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenPreview(log.linkBukti!, `Bukti Presensi - ${activeSiswa.nama} (${log.tanggal})`)}
                                  className="h-7 px-2.5 rounded-lg bg-orange-50 border border-orange-200 text-orange-700 text-[11px] font-bold flex items-center gap-1 hover:bg-orange-100 shrink-0"
                                >
                                  <Eye className="w-3.5 h-3.5" /> Preview
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* BOTTOM ACTION CTA (ONBOARDING BUTTON) */}
        {!isLoading && step < 4 && (
          <div className="p-6 pt-2 bg-slate-50/90 backdrop-blur-sm border-t border-slate-100">
            <button
              type="button"
              disabled={
                (step === 1 && !selectedJurusanKey) ||
                (step === 2 && !selectedKelas) ||
                (step === 3 && !selectedNis)
              }
              onClick={() => {
                if (step === 1 && selectedJurusanKey) setStep(2);
                else if (step === 2 && selectedKelas) setStep(3);
                else if (step === 3 && selectedNis) setStep(4);
              }}
              className="w-full py-4 px-6 rounded-2xl bg-orange-600 hover:bg-orange-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-sm shadow-md disabled:shadow-none transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <span>{step === 3 ? "Lihat Presensi Siswa" : "Lanjutkan"}</span>
              <ChevronRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        )}

        {/* PREVIEW MODAL */}
        <Dialog open={!!previewUrl} onOpenChange={(open) => !open && setPreviewUrl(null)}>
          <DialogContent className="max-w-md h-[80vh] p-0 overflow-hidden flex flex-col bg-slate-900 border-slate-800 rounded-3xl sm:rounded-3xl [&>button]:hidden">
            {/* Modal Header */}
            <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-white shrink-0">
              <div className="flex items-center gap-2 text-xs font-semibold truncate pr-2 min-w-0">
                <FileText className="w-4 h-4 text-orange-400 shrink-0" />
                <span className="truncate">{previewTitle || "Preview Bukti"}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {previewUrl && (
                  <a
                    href={previewUrl.replace("/preview", "/view")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-orange-400 hover:underline inline-flex items-center gap-1 font-semibold px-2 py-1 rounded bg-orange-950/50 border border-orange-800/60"
                  >
                    <ExternalLink className="w-3 h-3" /> Buka Tab
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewUrl(null)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition active:scale-95 border border-slate-700"
                  title="Tutup Preview"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Modal Iframe Content */}
            <div className="flex-1 w-full h-full bg-slate-100 relative">
              {previewUrl && (
                <iframe
                  src={previewUrl}
                  className="w-full h-full border-none"
                  title="Dokumen Bukti Presensi"
                  allow="autoplay"
                />
              )}
            </div>

            {/* Modal Footer Close Button for Extra Accessibility */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 shrink-0 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewUrl(null)}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-[0.98]"
              >
                <X className="w-4 h-4" /> Tutup Pratinjau
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
