"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";

type Lang = "ru" | "en" | "kz";

type Device = {
  id: string;
  uid: string;
  name: string;
  nickname?: string | null;
  ownerId?: string | null;
  disabled?: boolean;
};

type DeviceItem = {
  device: Device;
  status: {
    isPaired: boolean;
    hasAccess: boolean;
  };
};

type ConnectMember = {
  id: string;
  role: string;
  status: string;
  createdAt: string | null;
  device: Device;
};

type ConnectGroup = {
  id: string;
  name: string;
  ownerUserId: string;
  ownerDeviceId: string;
  createdAt: string | null;
  members: ConnectMember[];
};

type ConnectState = {
  device?: Device;
  connect?: {
    active: boolean;
    source: string | null;
    group: ConnectGroup | null;
  } | null;
  invites?: ConnectInvite[];
};

type ConnectInvite = {
  id: string;
  status: string;
  createdAt: string | null;
  expiresAt: string | null;
  fromDevice: Device;
  toDevice: Device;
  group?: {
    id: string;
    name: string;
  } | null;
};

const TEXT = {
  ru: {
    loading: "Загрузка...",
    title: "PocketGPT Connect",
    subtitle: "Объединяй до 3 устройств в одну группу и используй общую историю ответов.",
    refresh: "Обновить",
    refreshing: "Обновление...",
    chooseDevice: "Устройство",
    noDevices: "Нет привязанных устройств.",
    nicknameTitle: "Никнейм устройства",
    nicknameHint: "По никнейму друзья смогут найти твоё устройство для Connect.",
    nicknamePlaceholder: "например alibek-pocket",
    saveNickname: "Сохранить",
    saving: "Сохранение...",
    nicknameSaved: "Никнейм сохранён.",
    connectStatus: "Статус Connect",
    active: "Активен",
    inactive: "Не активен",
    needConnect: "Для общей истории нужна подписка Connect или план с Connect.",
    members: "Участники",
    emptyMembers: "Пока нет участников Connect.",
    inviteTitle: "Добавить устройство друга",
    inviteHint: "Введи никнейм устройства друга. Ему придёт приглашение на сайте.",
    searchPlaceholder: "никнейм друга",
    search: "Найти",
    sendInvite: "Отправить приглашение",
    sending: "Отправка...",
    noResults: "Ничего не найдено.",
    invites: "Входящие приглашения",
    noInvites: "Входящих приглашений нет.",
    accept: "Принять",
    decline: "Отклонить",
    groupLimit: "В Connect-группе максимум 3 устройства.",
    uid: "UID",
  },
  en: {
    loading: "Loading...",
    title: "PocketGPT Connect",
    subtitle: "Group up to 3 devices and share answer history between them.",
    refresh: "Refresh",
    refreshing: "Refreshing...",
    chooseDevice: "Device",
    noDevices: "No paired devices.",
    nicknameTitle: "Device nickname",
    nicknameHint: "Friends can find your device by nickname for Connect.",
    nicknamePlaceholder: "example alibek-pocket",
    saveNickname: "Save",
    saving: "Saving...",
    nicknameSaved: "Nickname saved.",
    connectStatus: "Connect status",
    active: "Active",
    inactive: "Inactive",
    needConnect: "Shared history requires Connect or a plan with Connect included.",
    members: "Members",
    emptyMembers: "No Connect members yet.",
    inviteTitle: "Add a friend's device",
    inviteHint: "Enter your friend's device nickname. They will receive an invite on the website.",
    searchPlaceholder: "friend nickname",
    search: "Search",
    sendInvite: "Send invite",
    sending: "Sending...",
    noResults: "Nothing found.",
    invites: "Incoming invites",
    noInvites: "No incoming invites.",
    accept: "Accept",
    decline: "Decline",
    groupLimit: "A Connect group can have up to 3 devices.",
    uid: "UID",
  },
  kz: {
    loading: "Жүктелуде...",
    title: "PocketGPT Connect",
    subtitle: "3 құрылғыға дейін бір топқа біріктіріп, жауап тарихын ортақ қолдан.",
    refresh: "Жаңарту",
    refreshing: "Жаңартылуда...",
    chooseDevice: "Құрылғы",
    noDevices: "Байланған құрылғы жоқ.",
    nicknameTitle: "Құрылғы никнеймі",
    nicknameHint: "Достар Connect үшін құрылғыңды никнейм арқылы табады.",
    nicknamePlaceholder: "мысалы alibek-pocket",
    saveNickname: "Сақтау",
    saving: "Сақталуда...",
    nicknameSaved: "Никнейм сақталды.",
    connectStatus: "Connect статусы",
    active: "Белсенді",
    inactive: "Белсенді емес",
    needConnect: "Ортақ тарих үшін Connect жазылымы немесе Connect бар жоспар керек.",
    members: "Қатысушылар",
    emptyMembers: "Connect қатысушылары әзірге жоқ.",
    inviteTitle: "Дос құрылғысын қосу",
    inviteHint: "Досыңның құрылғы никнеймін енгіз. Оған сайтта шақыру келеді.",
    searchPlaceholder: "дос никнеймі",
    search: "Іздеу",
    sendInvite: "Шақыру жіберу",
    sending: "Жіберілуде...",
    noResults: "Ештеңе табылмады.",
    invites: "Кіріс шақырулар",
    noInvites: "Кіріс шақыру жоқ.",
    accept: "Қабылдау",
    decline: "Бас тарту",
    groupLimit: "Connect тобында максимум 3 құрылғы болады.",
    uid: "UID",
  },
} as const;

function normalizeLang(value: string | null): Lang {
  if (value === "en") return "en";
  if (value === "kz" || value === "kk") return "kz";
  return "ru";
}

function getLang(): Lang {
  if (typeof window === "undefined") return "ru";
  return normalizeLang(localStorage.getItem("site_lang") || localStorage.getItem("lang"));
}

function deviceLabel(device: Device | null | undefined) {
  if (!device) return "—";
  return `${device.nickname || device.name || "PocketGPT"} · ${device.uid}`;
}

export default function ConnectPage() {
  const [lang, setLang] = useState<Lang>("ru");
  const t = TEXT[lang];
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [connectState, setConnectState] = useState<ConnectState | null>(null);
  const [nicknameValue, setNicknameValue] = useState("");
  const [nicknameMessage, setNicknameMessage] = useState("");
  const [savingNickname, setSavingNickname] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [searchResults, setSearchResults] = useState<Device[]>([]);
  const [searched, setSearched] = useState(false);
  const [sendingInviteId, setSendingInviteId] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    const updateLang = () => setLang(getLang());
    updateLang();
    window.addEventListener("site-language-change", updateLang);
    return () => window.removeEventListener("site-language-change", updateLang);
  }, []);

  const pairedDevices = useMemo(
    () => devices.filter((item) => item.status.isPaired && !item.device.disabled),
    [devices]
  );

  const selectedDevice = useMemo(
    () => pairedDevices.find((item) => item.device.id === selectedDeviceId)?.device || null,
    [pairedDevices, selectedDeviceId]
  );

  useEffect(() => {
    setNicknameValue(selectedDevice?.nickname || "");
    setNicknameMessage("");
  }, [selectedDeviceId, selectedDevice?.nickname]);

  async function loadData(showLoader = false, forcedDeviceId?: string) {
    if (showLoader) setLoading(true);
    else setRefreshing(true);
    setErrorText("");

    try {
      const devicesData = await apiFetch("/v1/user/devices", { method: "GET" });
      const nextDevices = (devicesData.devices || []) as DeviceItem[];
      setDevices(nextDevices);

      const nextSelected = forcedDeviceId || selectedDeviceId || nextDevices.find((item) => item.status.isPaired && !item.device.disabled)?.device.id || "";
      setSelectedDeviceId(nextSelected);

      if (nextSelected) {
        const state = (await apiFetch(`/v1/user/connect?deviceId=${encodeURIComponent(nextSelected)}`, { method: "GET" })) as ConnectState;
        setConnectState(state);
      } else {
        setConnectState(null);
      }
    } catch (err) {
      setErrorText(err instanceof Error ? err.message : "Load failed");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (!getToken()) {
      window.location.href = "/login";
      return;
    }
    setReady(true);
    void loadData(true);
  }, []);

  async function handleChangeDevice(deviceId: string) {
    setSelectedDeviceId(deviceId);
    setSearchResults([]);
    setSearched(false);
    setActionMessage("");
    await loadData(false, deviceId);
  }

  async function handleSaveNickname() {
    if (!selectedDeviceId || !nicknameValue.trim()) return;
    try {
      setSavingNickname(true);
      setErrorText("");
      setNicknameMessage("");
      await apiFetch("/v1/user/device/nickname", {
        method: "POST",
        body: JSON.stringify({ deviceId: selectedDeviceId, nickname: nicknameValue.trim(), lang }),
      });
      setNicknameMessage(t.nicknameSaved);
      await loadData(false, selectedDeviceId);
    } catch (err) {
      setErrorText(err instanceof Error ? err.message : "Nickname save failed");
    } finally {
      setSavingNickname(false);
    }
  }

  async function handleSearch() {
    if (!searchValue.trim()) return;
    try {
      setErrorText("");
      setActionMessage("");
      setSearched(true);
      const data = await apiFetch(`/v1/user/device/search?nickname=${encodeURIComponent(searchValue.trim())}`, { method: "GET" });
      setSearchResults((data.devices || []) as Device[]);
    } catch (err) {
      setSearchResults([]);
      setErrorText(err instanceof Error ? err.message : "Search failed");
    }
  }

  async function handleInvite(device: Device) {
    if (!selectedDeviceId || !device.nickname) return;
    try {
      setSendingInviteId(device.id);
      setErrorText("");
      setActionMessage("");
      await apiFetch("/v1/user/connect/invite", {
        method: "POST",
        body: JSON.stringify({ deviceId: selectedDeviceId, nickname: device.nickname, lang }),
      });
      setActionMessage(lang === "en" ? "Invite sent." : lang === "kz" ? "Шақыру жіберілді." : "Приглашение отправлено.");
      setSearchResults([]);
      setSearchValue("");
      await loadData(false, selectedDeviceId);
    } catch (err) {
      setErrorText(err instanceof Error ? err.message : "Invite failed");
    } finally {
      setSendingInviteId("");
    }
  }

  async function respondInvite(inviteId: string, accept: boolean) {
    try {
      setErrorText("");
      setActionMessage("");
      await apiFetch(`/v1/user/connect/invites/${inviteId}/${accept ? "accept" : "decline"}`, { method: "POST" });
      setActionMessage(accept ? (lang === "en" ? "Invite accepted." : lang === "kz" ? "Шақыру қабылданды." : "Приглашение принято.") : (lang === "en" ? "Invite declined." : lang === "kz" ? "Шақыру қабылданбады." : "Приглашение отклонено."));
      await loadData(false, selectedDeviceId);
    } catch (err) {
      setErrorText(err instanceof Error ? err.message : "Action failed");
    }
  }

  const members = connectState?.connect?.group?.members || [];
  const invites = connectState?.invites || [];
  const connectActive = !!connectState?.connect?.active;

  if (!ready) {
    return (
      <main className="min-h-[calc(100vh-73px)] bg-[#050816] px-4 py-6 text-white sm:px-6 sm:py-10">
        <div className="mx-auto max-w-[1150px]">{t.loading}</div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-73px)] bg-[#050816] px-4 py-6 text-white sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-[1150px] space-y-5">
        <section className="rounded-3xl border border-[#1f2937] bg-gradient-to-br from-[#111827] to-[#0b1220] p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold">{t.title}</h1>
              <p className="text-sm text-[#a1a1aa] sm:text-base">{t.subtitle}</p>
            </div>
            <button
              type="button"
              onClick={() => void loadData(false, selectedDeviceId)}
              className="rounded-xl border border-[#374151] bg-[#0b1220] px-4 py-3 font-semibold text-white transition hover:border-[#4b5563] hover:bg-[#0f172a]"
            >
              {refreshing ? t.refreshing : t.refresh}
            </button>
          </div>
        </section>

        {errorText ? <div className="rounded-2xl border border-[#7f1d1d] bg-[#3f1d1d] p-4 text-sm text-[#fecaca]">{errorText}</div> : null}
        {actionMessage ? <div className="rounded-2xl border border-[#14532d] bg-[#0f2f1d] p-4 text-sm text-[#bbf7d0]">{actionMessage}</div> : null}

        <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-5">
            <div className="rounded-3xl border border-[#1f2937] bg-[#111827] p-5 sm:p-6">
              <h2 className="mb-4 text-2xl font-semibold">{t.chooseDevice}</h2>
              {loading ? <div className="text-[#a1a1aa]">{t.loading}</div> : null}
              {!loading && pairedDevices.length === 0 ? <div className="text-[#a1a1aa]">{t.noDevices}</div> : null}

              <select
                value={selectedDeviceId}
                onChange={(e) => void handleChangeDevice(e.target.value)}
                className="w-full rounded-xl border border-[#374151] bg-[#0b1220] px-4 py-3 text-white outline-none transition focus:border-blue-500"
              >
                <option value="">{t.chooseDevice}</option>
                {pairedDevices.map((item) => (
                  <option key={item.device.id} value={item.device.id}>{deviceLabel(item.device)}</option>
                ))}
              </select>

              {selectedDevice ? (
                <div className="mt-4 rounded-2xl border border-[#1f2937] bg-[#0b1220] p-4 text-sm leading-7 text-[#d1d5db]">
                  <div>{t.uid}: {selectedDevice.uid}</div>
                  <div>{t.nicknameTitle}: {selectedDevice.nickname || "—"}</div>
                </div>
              ) : null}
            </div>

            <div className="rounded-3xl border border-[#1f2937] bg-[#111827] p-5 sm:p-6">
              <h2 className="mb-2 text-2xl font-semibold">{t.nicknameTitle}</h2>
              <p className="mb-4 text-sm text-[#a1a1aa]">{t.nicknameHint}</p>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <input
                  value={nicknameValue}
                  onChange={(e) => setNicknameValue(e.target.value)}
                  placeholder={t.nicknamePlaceholder}
                  className="w-full rounded-xl border border-[#374151] bg-[#0b1220] px-4 py-3 text-white outline-none transition placeholder:text-[#6b7280] focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => void handleSaveNickname()}
                  disabled={!selectedDeviceId || !nicknameValue.trim() || savingNickname}
                  className="rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingNickname ? t.saving : t.saveNickname}
                </button>
              </div>
              {nicknameMessage ? <div className="mt-3 text-sm text-[#86efac]">{nicknameMessage}</div> : null}
            </div>

            <div className="rounded-3xl border border-[#1f2937] bg-[#111827] p-5 sm:p-6">
              <h2 className="mb-2 text-2xl font-semibold">{t.connectStatus}</h2>
              <div className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${connectActive ? "bg-emerald-500/10 text-emerald-300" : "bg-amber-500/10 text-amber-300"}`}>
                {connectActive ? t.active : t.inactive}
              </div>
              {!connectActive ? <p className="mt-3 text-sm text-[#a1a1aa]">{t.needConnect}</p> : null}
              <p className="mt-3 text-sm text-[#94a3b8]">{t.groupLimit}</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-3xl border border-[#1f2937] bg-[#111827] p-5 sm:p-6">
              <h2 className="mb-2 text-2xl font-semibold">{t.members}</h2>
              {members.length === 0 ? <div className="text-[#a1a1aa]">{t.emptyMembers}</div> : null}
              <div className="grid gap-3">
                {members.map((member) => (
                  <div key={member.id} className="rounded-2xl border border-[#1f2937] bg-[#0b1220] p-4">
                    <div className="font-bold text-white">{deviceLabel(member.device)}</div>
                    <div className="mt-1 text-sm text-[#94a3b8]">{member.role} · {member.status}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-[#1f2937] bg-[#111827] p-5 sm:p-6">
              <h2 className="mb-2 text-2xl font-semibold">{t.inviteTitle}</h2>
              <p className="mb-4 text-sm text-[#a1a1aa]">{t.inviteHint}</p>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <input
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="w-full rounded-xl border border-[#374151] bg-[#0b1220] px-4 py-3 text-white outline-none transition placeholder:text-[#6b7280] focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => void handleSearch()}
                  disabled={!searchValue.trim()}
                  className="rounded-xl border border-[#374151] bg-[#0b1220] px-4 py-3 font-semibold text-white transition hover:border-[#4b5563] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {t.search}
                </button>
              </div>

              <div className="mt-4 grid gap-3">
                {searched && searchResults.length === 0 ? <div className="text-sm text-[#a1a1aa]">{t.noResults}</div> : null}
                {searchResults.map((device) => (
                  <div key={device.id} className="rounded-2xl border border-[#1f2937] bg-[#0b1220] p-4">
                    <div className="font-bold text-white">{deviceLabel(device)}</div>
                    <button
                      type="button"
                      onClick={() => void handleInvite(device)}
                      disabled={!connectActive || sendingInviteId === device.id}
                      className="mt-3 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {sendingInviteId === device.id ? t.sending : t.sendInvite}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-[#1f2937] bg-[#111827] p-5 sm:p-6">
              <h2 className="mb-2 text-2xl font-semibold">{t.invites}</h2>
              {invites.length === 0 ? <div className="text-[#a1a1aa]">{t.noInvites}</div> : null}
              <div className="grid gap-3">
                {invites.map((invite) => (
                  <div key={invite.id} className="rounded-2xl border border-[#1f2937] bg-[#0b1220] p-4">
                    <div className="font-bold text-white">{deviceLabel(invite.fromDevice)}</div>
                    <div className="mt-1 text-sm text-[#94a3b8]">{invite.status}</div>
                    {invite.status === "pending" ? (
                      <div className="mt-3 flex gap-2">
                        <button type="button" onClick={() => void respondInvite(invite.id, true)} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500">{t.accept}</button>
                        <button type="button" onClick={() => void respondInvite(invite.id, false)} className="rounded-xl border border-[#374151] px-4 py-2 text-sm font-semibold text-white hover:bg-white/5">{t.decline}</button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
