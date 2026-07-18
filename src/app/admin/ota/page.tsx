"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getSiteLanguage, SITE_LANGUAGE_EVENT, type SiteLanguage } from "@/lib/site-language";

type FirmwareRelease = {
  id: string;
  version: string;
  build: number;
  channel: string;
  fileName?: string | null;
  sizeBytes?: number | null;
  notes?: string | null;
  mandatory: boolean;
  rolloutPercent: number;
  isActive: boolean;
  publishedAt?: string | null;
  createdAt?: string | null;
};

type FirmwareEvent = {
  id: string;
  event: string;
  version?: string | null;
  build?: number | null;
  error?: string | null;
  releaseId?: string | null;
  deviceUid?: string | null;
  deviceNickname?: string | null;
  createdAt?: string | null;
};

const COPY = {
  ru: {
    title: "Admin Office",
    subtitle: "Публикация OTA-обновлений PocketGPT",
    uploadTitle: "Новый релиз",
    drop: "Перетащи .bin сюда",
    choose: "или выбери файл",
    max: "До 3 МБ. Файл хранится в Neon и не исчезнет после перезапуска Render.",
    version: "Версия",
    build: "Build",
    notes: "Описание",
    channel: "Канал",
    rollout: "Rollout, %",
    minBuild: "Минимальный текущий build",
    maxBuild: "Максимальный текущий build",
    mandatory: "Обязательное обновление",
    active: "Опубликовать сразу",
    publish: "Загрузить и опубликовать",
    uploading: "Загружаю...",
    noFile: "Выбери .bin файл",
    published: "Релиз опубликован. Устройства увидят его при следующей OTA-проверке.",
    releases: "Релизы",
    events: "Журнал устройств",
    noReleases: "Релизов пока нет",
    noEvents: "Событий пока нет",
    disable: "Отключить",
    enable: "Включить",
    delete: "Удалить",
    stable: "Stable",
    beta: "Beta",
    activeLabel: "Активен",
    inactiveLabel: "Отключён",
    mandatoryLabel: "Обязательный",
    size: "Размер",
    rolloutLabel: "Rollout",
    allDevices: "При rollout 100% обновление получат все подходящие устройства при следующей проверке.",
    denied: "Доступ разрешён только администратору.",
    loading: "Загрузка Admin Office...",
    refresh: "Обновить данные",
    confirmDelete: "Удалить релиз и связанный .bin файл?",
  },
  en: {
    title: "Admin Office",
    subtitle: "Publish PocketGPT OTA updates",
    uploadTitle: "New release",
    drop: "Drop a .bin file here",
    choose: "or choose a file",
    max: "Up to 3 MB. The file is stored in Neon and survives Render restarts.",
    version: "Version",
    build: "Build",
    notes: "Description",
    channel: "Channel",
    rollout: "Rollout, %",
    minBuild: "Minimum current build",
    maxBuild: "Maximum current build",
    mandatory: "Mandatory update",
    active: "Publish immediately",
    publish: "Upload and publish",
    uploading: "Uploading...",
    noFile: "Choose a .bin file",
    published: "Release published. Devices will see it on their next OTA check.",
    releases: "Releases",
    events: "Device log",
    noReleases: "No releases yet",
    noEvents: "No events yet",
    disable: "Disable",
    enable: "Enable",
    delete: "Delete",
    stable: "Stable",
    beta: "Beta",
    activeLabel: "Active",
    inactiveLabel: "Disabled",
    mandatoryLabel: "Mandatory",
    size: "Size",
    rolloutLabel: "Rollout",
    allDevices: "With 100% rollout, every eligible device receives the update on its next check.",
    denied: "Administrator access is required.",
    loading: "Loading Admin Office...",
    refresh: "Refresh data",
    confirmDelete: "Delete the release and its .bin file?",
  },
  kz: {
    title: "Admin Office",
    subtitle: "PocketGPT OTA жаңартуларын жариялау",
    uploadTitle: "Жаңа релиз",
    drop: ".bin файлын осында сүйреп әкел",
    choose: "немесе файлды таңда",
    max: "3 МБ дейін. Файл Neon ішінде сақталады және Render қайта іске қосылғанда жоғалмайды.",
    version: "Нұсқа",
    build: "Build",
    notes: "Сипаттама",
    channel: "Арна",
    rollout: "Rollout, %",
    minBuild: "Ең төменгі ағымдағы build",
    maxBuild: "Ең жоғарғы ағымдағы build",
    mandatory: "Міндетті жаңарту",
    active: "Бірден жариялау",
    publish: "Жүктеу және жариялау",
    uploading: "Жүктелуде...",
    noFile: ".bin файлын таңда",
    published: "Релиз жарияланды. Құрылғылар оны келесі OTA тексерісінде көреді.",
    releases: "Релиздер",
    events: "Құрылғылар журналы",
    noReleases: "Әзірге релиз жоқ",
    noEvents: "Әзірге оқиға жоқ",
    disable: "Өшіру",
    enable: "Қосу",
    delete: "Жою",
    stable: "Stable",
    beta: "Beta",
    activeLabel: "Белсенді",
    inactiveLabel: "Өшірілген",
    mandatoryLabel: "Міндетті",
    size: "Өлшем",
    rolloutLabel: "Rollout",
    allDevices: "Rollout 100% болса, барлық сәйкес құрылғы жаңартуды келесі тексерісте алады.",
    denied: "Тек әкімшіге рұқсат етілген.",
    loading: "Admin Office жүктелуде...",
    refresh: "Деректерді жаңарту",
    confirmDelete: "Релизді және .bin файлын жою керек пе?",
  },
} as const;

function formatDate(value?: string | null) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatBytes(value?: number | null) {
  if (!value) return "—";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(2)} MB`;
}

function eventTone(event: string) {
  if (event === "boot_ok" || event === "download_completed") return "is-success";
  if (event === "failed" || event === "rollback") return "is-danger";
  if (event === "install_started" || event === "download_started") return "is-progress";
  return "";
}

export default function AdminOtaPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [lang, setLang] = useState<SiteLanguage>("ru");
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [version, setVersion] = useState("2.2.12");
  const [build, setBuild] = useState("232");
  const [notes, setNotes] = useState("");
  const [channel, setChannel] = useState("stable");
  const [rollout, setRollout] = useState("100");
  const [minBuild, setMinBuild] = useState("0");
  const [maxBuild, setMaxBuild] = useState("");
  const [mandatory, setMandatory] = useState(false);
  const [active, setActive] = useState(true);
  const [releases, setReleases] = useState<FirmwareRelease[]>([]);
  const [events, setEvents] = useState<FirmwareEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const t = COPY[lang];

  useEffect(() => {
    const sync = () => setLang(getSiteLanguage());
    sync();
    window.addEventListener(SITE_LANGUAGE_EVENT, sync);
    return () => window.removeEventListener(SITE_LANGUAGE_EVENT, sync);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const me = await apiFetch("/v1/auth/me");
      if (!me?.user?.isAdmin) {
        setAuthorized(false);
        setTimeout(() => {
          window.location.href = me?.user ? "/dashboard" : "/login";
        }, 900);
        return;
      }
      setAuthorized(true);
      localStorage.setItem("user", JSON.stringify(me.user));
      localStorage.setItem("authUser", JSON.stringify(me.user));

      const [releaseData, eventData] = await Promise.all([
        apiFetch("/v1/admin/firmware/releases?limit=100"),
        apiFetch("/v1/admin/firmware/events?limit=100"),
      ]);
      setReleases(Array.isArray(releaseData?.releases) ? releaseData.releases : []);
      setEvents(Array.isArray(eventData?.events) ? eventData.events : []);
    } catch (err) {
      setAuthorized(false);
      setError(err instanceof Error ? err.message : t.denied);
    } finally {
      setLoading(false);
    }
  }, [t.denied]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const stats = useMemo(() => {
    const recent = events.slice(0, 100);
    return {
      successful: recent.filter((item) => item.event === "boot_ok").length,
      failed: recent.filter((item) => item.event === "failed" || item.event === "rollback").length,
      downloads: recent.filter((item) => item.event === "download_completed").length,
    };
  }, [events]);

  function acceptFile(next?: File | null) {
    setError("");
    if (!next) return;
    if (!next.name.toLowerCase().endsWith(".bin")) {
      setError(t.noFile);
      return;
    }
    setFile(next);
  }

  async function publishRelease(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!file) {
      setError(t.noFile);
      return;
    }

    const form = new FormData();
    form.append("file", file);
    form.append("version", version.trim());
    form.append("build", build.trim());
    form.append("notes", notes.trim());
    form.append("channel", channel);
    form.append("rolloutPercent", rollout);
    form.append("mandatory", String(mandatory));
    form.append("isActive", String(active));
    form.append("target", "esp32s3");
    form.append("minCurrentBuild", minBuild || "0");
    form.append("maxCurrentBuild", maxBuild);

    setUploading(true);
    try {
      await apiFetch("/v1/admin/firmware/upload", { method: "POST", body: form });
      setSuccess(t.published);
      setFile(null);
      setNotes("");
      setBuild((current) => String((Number(current) || 0) + 1));
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function toggleRelease(release: FirmwareRelease) {
    setError("");
    try {
      await apiFetch(`/v1/admin/firmware/releases/${release.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !release.isActive }),
      });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function deleteRelease(release: FirmwareRelease) {
    if (!window.confirm(t.confirmDelete)) return;
    setError("");
    try {
      await apiFetch(`/v1/admin/firmware/releases/${release.id}`, { method: "DELETE" });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  if (authorized === null || loading && authorized !== true) {
    return <main className="admin-office admin-office-center"><div className="admin-loader" /><p>{t.loading}</p></main>;
  }

  if (authorized === false) {
    return <main className="admin-office admin-office-center"><p className="admin-error">{error || t.denied}</p></main>;
  }

  return (
    <main className="admin-office">
      <section className="admin-hero">
        <div>
          <span className="admin-eyebrow">POCKETGPT / OTA CONTROL</span>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>
        <button type="button" className="admin-quiet-button" onClick={() => void loadData()}>{t.refresh}</button>
      </section>

      <section className="admin-stats" aria-label="OTA statistics">
        <article><span>BOOT OK</span><strong>{stats.successful}</strong></article>
        <article><span>DOWNLOADS</span><strong>{stats.downloads}</strong></article>
        <article><span>FAILED / ROLLBACK</span><strong>{stats.failed}</strong></article>
      </section>

      <section className="admin-grid">
        <form className="admin-panel admin-upload-panel" onSubmit={publishRelease}>
          <div className="admin-panel-head"><div><span>01</span><h2>{t.uploadTitle}</h2></div></div>

          <div
            className={`admin-dropzone ${dragging ? "is-dragging" : ""} ${file ? "has-file" : ""}`}
            onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              acceptFile(event.dataTransfer.files?.[0]);
            }}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") inputRef.current?.click(); }}
          >
            <input ref={inputRef} type="file" accept=".bin,application/octet-stream" hidden onChange={(event) => acceptFile(event.target.files?.[0])} />
            <div className="admin-drop-icon">↓</div>
            <strong>{file ? file.name : t.drop}</strong>
            <span>{file ? formatBytes(file.size) : t.choose}</span>
            <small>{t.max}</small>
          </div>

          <div className="admin-form-grid">
            <label><span>{t.version}</span><input value={version} onChange={(e) => setVersion(e.target.value)} required /></label>
            <label><span>{t.build}</span><input type="number" min="1" value={build} onChange={(e) => setBuild(e.target.value)} required /></label>
            <label><span>{t.channel}</span><select value={channel} onChange={(e) => setChannel(e.target.value)}><option value="stable">{t.stable}</option><option value="beta">{t.beta}</option></select></label>
            <label><span>{t.rollout}</span><input type="number" min="0" max="100" value={rollout} onChange={(e) => setRollout(e.target.value)} /></label>
            <label><span>{t.minBuild}</span><input type="number" min="0" value={minBuild} onChange={(e) => setMinBuild(e.target.value)} /></label>
            <label><span>{t.maxBuild}</span><input type="number" min="0" placeholder="—" value={maxBuild} onChange={(e) => setMaxBuild(e.target.value)} /></label>
          </div>

          <label className="admin-notes"><span>{t.notes}</span><textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} /></label>

          <div className="admin-switches">
            <label><input type="checkbox" checked={mandatory} onChange={(e) => setMandatory(e.target.checked)} /><span>{t.mandatory}</span></label>
            <label><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /><span>{t.active}</span></label>
          </div>

          <p className="admin-hint">{t.allDevices}</p>
          {error ? <div className="admin-message is-error">{error}</div> : null}
          {success ? <div className="admin-message is-success">{success}</div> : null}
          <button className="admin-primary-button" type="submit" disabled={uploading}>{uploading ? t.uploading : t.publish}</button>
        </form>

        <section className="admin-panel admin-releases-panel">
          <div className="admin-panel-head"><div><span>02</span><h2>{t.releases}</h2></div><b>{releases.length}</b></div>
          <div className="admin-release-list">
            {releases.length ? releases.map((release) => (
              <article className="admin-release" key={release.id}>
                <div className="admin-release-main">
                  <div><strong>v{release.version}</strong><span>build {release.build}</span></div>
                  <span className={`admin-status ${release.isActive ? "is-active" : ""}`}>{release.isActive ? t.activeLabel : t.inactiveLabel}</span>
                </div>
                <div className="admin-release-meta">
                  <span>{release.channel}</span><span>{t.rolloutLabel}: {release.rolloutPercent}%</span><span>{t.size}: {formatBytes(release.sizeBytes)}</span>
                  {release.mandatory ? <span className="is-mandatory">{t.mandatoryLabel}</span> : null}
                </div>
                {release.notes ? <p>{release.notes}</p> : null}
                <time>{formatDate(release.publishedAt || release.createdAt)}</time>
                <div className="admin-release-actions">
                  <button type="button" onClick={() => void toggleRelease(release)}>{release.isActive ? t.disable : t.enable}</button>
                  <button type="button" className="is-danger" onClick={() => void deleteRelease(release)}>{t.delete}</button>
                </div>
              </article>
            )) : <div className="admin-empty">{t.noReleases}</div>}
          </div>
        </section>
      </section>

      <section className="admin-panel admin-events-panel">
        <div className="admin-panel-head"><div><span>03</span><h2>{t.events}</h2></div><b>{events.length}</b></div>
        <div className="admin-event-table">
          {events.length ? events.map((item) => (
            <article className="admin-event" key={item.id}>
              <span className={`admin-event-dot ${eventTone(item.event)}`} />
              <div className="admin-event-name"><strong>{item.event}</strong><span>{item.deviceNickname || item.deviceUid || "unknown device"}</span></div>
              <div className="admin-event-build">{item.version ? `v${item.version}` : "—"}{item.build != null ? ` / ${item.build}` : ""}</div>
              <div className="admin-event-error">{item.error || "—"}</div>
              <time>{formatDate(item.createdAt)}</time>
            </article>
          )) : <div className="admin-empty">{t.noEvents}</div>}
        </div>
      </section>
    </main>
  );
}
