"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import {
  getSiteLanguage,
  SITE_LANGUAGE_EVENT,
  type SiteLanguage,
} from "@/lib/site-language";

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
  status: { isPaired: boolean; hasAccess: boolean };
};

type Member = {
  id: string;
  role: string;
  status: string;
  createdAt: string | null;
  device: Device;
};

type Group = {
  id: string;
  name: string;
  ownerUserId: string;
  ownerDeviceId: string;
  createdAt: string | null;
  members: Member[];
};

type Invite = {
  id: string;
  status: string;
  createdAt: string | null;
  expiresAt: string | null;
  fromDevice: Device;
  toDevice: Device;
  group?: { id: string; name: string } | null;
};

type ConnectState = {
  device?: Device;
  connect?: {
    active: boolean;
    source: string | null;
    group: Group | null;
  } | null;
  invites?: Invite[];
};

type Confirmation = { type: "remove" | "leave"; member?: Member };

const TEXT = {
  ru: {
    title: "Connect",
    subtitle: "До трёх PocketGPT с общей историей.",
    device: "Устройство",
    nickname: "Никнейм",
    active: "Активен",
    inactive: "Неактивен",
    group: "Группа",
    defaultGroupName: "Моя группа",
    editGroupName: "Изменить название группы",
    groupName: "Название группы",
    groupNamePlaceholder: "Например, Семья",
    saveGroupName: "Сохранить",
    groupNameSaved: "Название группы сохранено",
    invitationTo: "Приглашение в группу",
    myDevice: "Моё устройство",
    participant: "Участник",
    owner: "Владелец",
    member: "Участник",
    inGroup: "В группе",
    add: "Добавить",
    addFriend: "Добавить друга",
    addHint: "Найти устройство по никнейму",
    freeSlot: "Свободное место",
    friendNickname: "Никнейм устройства",
    search: "Найти",
    searching: "Поиск…",
    found: "Устройство найдено",
    notFound: "Устройство не найдено",
    send: "Отправить приглашение",
    sending: "Отправляем…",
    sent: "Приглашение отправлено",
    alreadySent: "Приглашение уже отправлено",
    invites: "Приглашения",
    noInvites: "Новых приглашений нет",
    from: "От",
    accept: "Принять",
    decline: "Отклонить",
    accepting: "Принимаем…",
    declining: "Отклоняем…",
    accepted: "Приглашение принято",
    declined: "Приглашение отклонено",
    actions: "Действия",
    remove: "Удалить из группы",
    leave: "Выйти из группы",
    removeTitle: "Удалить участника?",
    removeText: "Устройство потеряет доступ к общей истории этой группы.",
    leaveTitle: "Выйти из группы?",
    leaveText: "Это устройство больше не будет видеть общую историю группы.",
    cancel: "Отмена",
    confirmRemove: "Удалить",
    confirmLeave: "Выйти",
    processing: "Подождите…",
    removed: "Участник удалён",
    left: "Устройство вышло из группы",
    groupFull: "В группе уже 3 устройства",
    connectInactive: "Connect не активен",
    noNickname: "Задай никнейм в кабинете",
    connectRequired: "Активируй Connect в разделе оплаты",
    openBilling: "Перейти к оплате",
    openDashboard: "Открыть кабинет",
    noGroup: "Добавь друга, чтобы создать общую группу",
    noDevices: "Сначала привяжи устройство",
    pair: "Привязать устройство",
    loadFailed: "Не удалось загрузить данные",
    actionFailed: "Не удалось выполнить действие",
    apiMissing: "Для этого действия требуется обновление Connect API",
    retry: "Повторить",
    close: "Закрыть",
    uid: "UID",
  },
  en: {
    title: "Connect",
    subtitle: "Up to three PocketGPT devices with shared history.",
    device: "Device",
    nickname: "Nickname",
    active: "Active",
    inactive: "Inactive",
    group: "Group",
    defaultGroupName: "My group",
    editGroupName: "Edit group name",
    groupName: "Group name",
    groupNamePlaceholder: "For example, Family",
    saveGroupName: "Save",
    groupNameSaved: "Group name saved",
    invitationTo: "Invitation to group",
    myDevice: "My device",
    participant: "Participant",
    owner: "Owner",
    member: "Member",
    inGroup: "In group",
    add: "Add",
    addFriend: "Add a friend",
    addHint: "Find a device by nickname",
    freeSlot: "Available slot",
    friendNickname: "Device nickname",
    search: "Search",
    searching: "Searching…",
    found: "Device found",
    notFound: "Device not found",
    send: "Send invitation",
    sending: "Sending…",
    sent: "Invitation sent",
    alreadySent: "Invitation already sent",
    invites: "Invitations",
    noInvites: "No new invitations",
    from: "From",
    accept: "Accept",
    decline: "Decline",
    accepting: "Accepting…",
    declining: "Declining…",
    accepted: "Invitation accepted",
    declined: "Invitation declined",
    actions: "Actions",
    remove: "Remove from group",
    leave: "Leave group",
    removeTitle: "Remove this member?",
    removeText: "The device will lose access to this group's shared history.",
    leaveTitle: "Leave the group?",
    leaveText: "This device will no longer see the group's shared history.",
    cancel: "Cancel",
    confirmRemove: "Remove",
    confirmLeave: "Leave",
    processing: "Please wait…",
    removed: "Member removed",
    left: "Device left the group",
    groupFull: "The group already has 3 devices",
    connectInactive: "Connect is inactive",
    noNickname: "Set a nickname in Dashboard",
    connectRequired: "Activate Connect in Billing",
    openBilling: "Open billing",
    openDashboard: "Open dashboard",
    noGroup: "Add a friend to create a shared group",
    noDevices: "Pair a device first",
    pair: "Pair a device",
    loadFailed: "Could not load data",
    actionFailed: "Could not complete the action",
    apiMissing: "This action requires a Connect API update",
    retry: "Try again",
    close: "Close",
    uid: "UID",
  },
  kz: {
    title: "Connect",
    subtitle: "Ортақ тарихы бар үш PocketGPT құрылғысына дейін.",
    device: "Құрылғы",
    nickname: "Лақап ат",
    active: "Белсенді",
    inactive: "Белсенді емес",
    group: "Топ",
    defaultGroupName: "Менің тобым",
    editGroupName: "Топ атауын өзгерту",
    groupName: "Топ атауы",
    groupNamePlaceholder: "Мысалы, Отбасы",
    saveGroupName: "Сақтау",
    groupNameSaved: "Топ атауы сақталды",
    invitationTo: "Топқа шақыру",
    myDevice: "Менің құрылғым",
    participant: "Қатысушы",
    owner: "Иесі",
    member: "Қатысушы",
    inGroup: "Топта",
    add: "Қосу",
    addFriend: "Дос қосу",
    addHint: "Құрылғыны лақап аты бойынша табу",
    freeSlot: "Бос орын",
    friendNickname: "Құрылғының лақап аты",
    search: "Іздеу",
    searching: "Ізделуде…",
    found: "Құрылғы табылды",
    notFound: "Құрылғы табылмады",
    send: "Шақыру жіберу",
    sending: "Жіберілуде…",
    sent: "Шақыру жіберілді",
    alreadySent: "Шақыру бұрын жіберілген",
    invites: "Шақырулар",
    noInvites: "Жаңа шақыру жоқ",
    from: "Кімнен",
    accept: "Қабылдау",
    decline: "Бас тарту",
    accepting: "Қабылдануда…",
    declining: "Қабылданбайды…",
    accepted: "Шақыру қабылданды",
    declined: "Шақыру қабылданбады",
    actions: "Әрекеттер",
    remove: "Топтан шығару",
    leave: "Топтан шығу",
    removeTitle: "Қатысушыны шығару керек пе?",
    removeText: "Құрылғы осы топтың ортақ тарихына қолжетімділігін жоғалтады.",
    leaveTitle: "Топтан шығу керек пе?",
    leaveText: "Бұл құрылғы топтың ортақ тарихын енді көрмейді.",
    cancel: "Болдырмау",
    confirmRemove: "Шығару",
    confirmLeave: "Шығу",
    processing: "Күте тұрыңыз…",
    removed: "Қатысушы шығарылды",
    left: "Құрылғы топтан шықты",
    groupFull: "Топта 3 құрылғы бар",
    connectInactive: "Connect белсенді емес",
    noNickname: "Лақап атты кабинетте орнат",
    connectRequired: "Connect қызметін төлем бөлімінде қос",
    openBilling: "Төлемге өту",
    openDashboard: "Кабинетті ашу",
    noGroup: "Ортақ топ құру үшін дос қос",
    noDevices: "Алдымен құрылғыны байланыстыр",
    pair: "Құрылғыны байланыстыру",
    loadFailed: "Деректерді жүктеу мүмкін болмады",
    actionFailed: "Әрекетті орындау мүмкін болмады",
    apiMissing: "Бұл әрекет үшін Connect API жаңартуы қажет",
    retry: "Қайталау",
    close: "Жабу",
    uid: "UID",
  },
} as const;

function nameOf(device?: Device | null) {
  return device?.nickname || device?.name || "PocketGPT";
}

function roleOf(role?: string | null) {
  return String(role || "member").toLowerCase();
}

function invitationSummary(
  lang: SiteLanguage,
  inviter: string,
  groupName: string,
) {
  if (lang === "en") return `${inviter} invites you to “${groupName}”`;
  if (lang === "kz") return `${inviter} сізді «${groupName}» тобына шақырады`;
  return `${inviter} приглашает вас в группу «${groupName}»`;
}

function groupNameStorageKey(
  groupId: string | null | undefined,
  deviceId: string,
) {
  return `pocketgpt:connect-group-name:${groupId || `device-${deviceId}`}`;
}

function friendlyError(error: unknown, lang: SiteLanguage) {
  const raw = error instanceof Error ? error.message : String(error || "");
  const value = raw.toLowerCase();
  const t = TEXT[lang];
  if (value.includes("already") && value.includes("invite"))
    return t.alreadySent;
  if (
    value.includes("group") &&
    (value.includes("full") || value.includes("limit") || value.includes("3"))
  )
    return t.groupFull;
  if (
    value.includes("connect") &&
    (value.includes("inactive") ||
      value.includes("required") ||
      value.includes("subscription"))
  )
    return t.connectInactive;
  if (value.includes("device") && value.includes("not found"))
    return t.notFound;
  return raw && raw !== "Request failed" ? raw : t.actionFailed;
}

function Spinner() {
  return <span className="pg-connect-spinner" aria-hidden="true" />;
}

function ConnectIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="24" cy="11" r="6" />
      <circle cx="11" cy="35" r="6" />
      <circle cx="37" cy="35" r="6" />
      <path d="M21 16.2 14.3 29M27 16.2 33.7 29M17 35h14" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" />
      <path d="M10 21h4" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="5" cy="12" r="1.7" />
      <circle cx="12" cy="12" r="1.7" />
      <circle cx="19" cy="12" r="1.7" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m4 20 4.2-1 10.6-10.6a2.1 2.1 0 0 0-3-3L5.2 16 4 20Z" />
      <path d="m14.6 6.6 3 3" />
    </svg>
  );
}

function DeviceGlyph({ active = false }: { active?: boolean }) {
  return (
    <span
      className={`pg-connect-glyph ${active ? "is-active" : ""}`}
      aria-hidden="true"
    >
      <i>
        <b />
        <b />
        <b />
        <b />
      </i>
      <em />
    </span>
  );
}

function Modal({
  title,
  closeLabel,
  onClose,
  children,
  className = "",
}: {
  title: string;
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) =>
      event.key === "Escape" && onClose();
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose]);

  return (
    <div
      className="pg-connect-modal-layer"
      onMouseDown={onClose}
      role="presentation"
    >
      <section
        className={`pg-connect-modal ${className}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <h2>{title}</h2>
          <button type="button" onClick={onClose} aria-label={closeLabel}>
            <CloseIcon />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="pg-connect-skeleton" aria-hidden="true">
      <span />
      <i />
      <div>
        <b />
        <b />
        <b />
      </div>
    </div>
  );
}

export default function ConnectPage() {
  const [lang, setLang] = useState<SiteLanguage>("ru");
  const t = TEXT[lang];
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [softLoading, setSoftLoading] = useState(false);
  const [error, setError] = useState("");
  const [modalError, setModalError] = useState("");
  const [toast, setToast] = useState("");
  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [state, setState] = useState<ConnectState | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invitesOpen, setInvitesOpen] = useState(false);
  const [groupNameOpen, setGroupNameOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupNameDraft, setGroupNameDraft] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Device[]>([]);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [sendingId, setSendingId] = useState("");
  const [respondingId, setRespondingId] = useState("");
  const [menuId, setMenuId] = useState("");
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [membershipBusy, setMembershipBusy] = useState(false);
  const selectedRef = useRef("");
  const lastLoaded = useRef(0);

  useEffect(() => {
    const sync = () => setLang(getSiteLanguage());
    sync();
    window.addEventListener(SITE_LANGUAGE_EVENT, sync);
    return () => window.removeEventListener(SITE_LANGUAGE_EVENT, sync);
  }, []);

  const paired = useMemo(
    () =>
      devices.filter((item) => item.status.isPaired && !item.device.disabled),
    [devices],
  );

  const selected = useMemo(
    () => paired.find((item) => item.device.id === selectedId)?.device || null,
    [paired, selectedId],
  );

  const loadData = useCallback(
    async (mode: "initial" | "soft" = "soft", forcedId?: string) => {
      if (mode === "initial") setLoading(true);
      else setSoftLoading(true);
      setError("");
      try {
        const devicesResponse = await apiFetch("/v1/user/devices", {
          method: "GET",
        });
        const next = (devicesResponse.devices || []) as DeviceItem[];
        setDevices(next);
        const first =
          next.find((item) => item.status.isPaired && !item.device.disabled)
            ?.device.id || "";
        const candidate = forcedId || selectedRef.current;
        const nextId = next.some(
          (item) =>
            item.device.id === candidate &&
            item.status.isPaired &&
            !item.device.disabled,
        )
          ? candidate
          : first;
        selectedRef.current = nextId;
        setSelectedId(nextId);
        if (nextId) {
          setState(
            (await apiFetch(
              `/v1/user/connect?deviceId=${encodeURIComponent(nextId)}`,
              { method: "GET" },
            )) as ConnectState,
          );
        } else {
          setState(null);
        }
        lastLoaded.current = Date.now();
      } catch (loadError) {
        setError(friendlyError(loadError, lang) || t.loadFailed);
      } finally {
        setLoading(false);
        setSoftLoading(false);
      }
    },
    [lang, t.loadFailed],
  );

  useEffect(() => {
    if (!getToken()) {
      window.location.href = "/login";
      return;
    }
    setReady(true);
    void loadData("initial");
  }, [loadData]);

  useEffect(() => {
    const refreshIfStale = () => {
      if (Date.now() - lastLoaded.current > 20_000) void loadData("soft");
    };
    const onVisibility = () =>
      document.visibilityState === "visible" && refreshIfStale();
    window.addEventListener("focus", refreshIfStale);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", refreshIfStale);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [loadData]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!selectedId) {
      setGroupName("");
      setGroupNameDraft("");
      return;
    }

    const groupKey = groupNameStorageKey(state?.connect?.group?.id, selectedId);
    const deviceKey = groupNameStorageKey(null, selectedId);
    const savedForGroup = window.localStorage.getItem(groupKey);
    const savedForDevice = window.localStorage.getItem(deviceKey);
    const serverName = state?.connect?.group?.name?.trim();
    const nextName =
      serverName || savedForGroup || savedForDevice || t.defaultGroupName;

    if (state?.connect?.group?.id && !savedForGroup && savedForDevice) {
      window.localStorage.setItem(groupKey, savedForDevice);
    }

    setGroupName(nextName);
    setGroupNameDraft(nextName);
  }, [
    selectedId,
    state?.connect?.group?.id,
    state?.connect?.group?.name,
    t.defaultGroupName,
  ]);

  const changeDevice = async (id: string) => {
    selectedRef.current = id;
    setSelectedId(id);
    setResults([]);
    setSearched(false);
    setMenuId("");
    await loadData("soft", id);
  };

  const search = async () => {
    const nickname = query.trim().toLowerCase();
    if (!nickname) return;
    setSearching(true);
    setModalError("");
    setSearched(true);
    try {
      const response = await apiFetch(
        `/v1/user/device/search?nickname=${encodeURIComponent(nickname)}`,
        { method: "GET" },
      );
      setResults(
        ((response.devices || []) as Device[]).filter(
          (device) => device.id !== selectedId,
        ),
      );
    } catch (searchError) {
      setResults([]);
      const message = friendlyError(searchError, lang);
      if (message !== t.notFound) setModalError(message);
    } finally {
      setSearching(false);
    }
  };

  const invite = async (device: Device) => {
    if (!selectedId || !device.nickname) return;
    setSendingId(device.id);
    setModalError("");
    try {
      await apiFetch("/v1/user/connect/invite", {
        method: "POST",
        body: JSON.stringify({
          deviceId: selectedId,
          nickname: device.nickname,
          lang,
        }),
      });
      setInviteOpen(false);
      setQuery("");
      setResults([]);
      setSearched(false);
      setToast(t.sent);
      await loadData("soft", selectedId);
    } catch (inviteError) {
      setModalError(friendlyError(inviteError, lang));
    } finally {
      setSendingId("");
    }
  };

  const respond = async (inviteId: string, accept: boolean) => {
    const actionId = `${inviteId}:${accept ? "accept" : "decline"}`;
    setRespondingId(actionId);
    setModalError("");
    try {
      await apiFetch(
        `/v1/user/connect/invites/${inviteId}/${accept ? "accept" : "decline"}`,
        { method: "POST" },
      );
      setToast(accept ? t.accepted : t.declined);
      await loadData("soft", selectedId);
    } catch (respondError) {
      setModalError(friendlyError(respondError, lang));
    } finally {
      setRespondingId("");
    }
  };

  const membershipAction = async () => {
    if (!confirmation || !selectedId) return;
    setMembershipBusy(true);
    setError("");
    try {
      if (confirmation.type === "remove" && confirmation.member) {
        await apiFetch("/v1/user/connect/member/remove", {
          method: "POST",
          body: JSON.stringify({
            deviceId: selectedId,
            memberId: confirmation.member.id,
          }),
        });
        setToast(t.removed);
      } else {
        await apiFetch("/v1/user/connect/leave", {
          method: "POST",
          body: JSON.stringify({ deviceId: selectedId }),
        });
        setToast(t.left);
      }
      setConfirmation(null);
      setMenuId("");
      await loadData("soft", selectedId);
    } catch (membershipError) {
      const raw =
        membershipError instanceof Error
          ? membershipError.message.toLowerCase()
          : "";
      setError(
        raw.includes("not found") ||
          raw.includes("404") ||
          raw.includes("method not allowed")
          ? t.apiMissing
          : friendlyError(membershipError, lang),
      );
      setConfirmation(null);
    } finally {
      setMembershipBusy(false);
    }
  };

  const saveGroupName = async () => {
    if (!selectedId) return;
    const normalized = groupNameDraft.trim().replace(/\s+/g, " ").slice(0, 32);
    if (!normalized) return;
    setModalError("");
    try {
      await apiFetch("/v1/user/connect/group/name", {
        method: "POST",
        body: JSON.stringify({ deviceId: selectedId, name: normalized, lang }),
      });
      const key = groupNameStorageKey(state?.connect?.group?.id, selectedId);
      const deviceKey = groupNameStorageKey(null, selectedId);
      window.localStorage.setItem(key, normalized);
      window.localStorage.setItem(deviceKey, normalized);
      setGroupName(normalized);
      setGroupNameDraft(normalized);
      setGroupNameOpen(false);
      setToast(t.groupNameSaved);
      await loadData("soft", selectedId);
    } catch (saveError) {
      setModalError(friendlyError(saveError, lang));
    }
  };

  const connectActive = Boolean(state?.connect?.active);
  const group = state?.connect?.group || null;
  const members = group?.members || [];
  const currentMember =
    members.find((member) => member.device.id === selectedId) || null;
  const others = members
    .filter((member) => member.device.id !== selectedId)
    .slice(0, 2);
  const isOwner =
    group?.ownerDeviceId === selectedId ||
    roleOf(currentMember?.role) === "owner";
  const canEditGroupName = !group || isOwner;
  const pendingInvites = (state?.invites || []).filter(
    (invite) => roleOf(invite.status) === "pending",
  );
  const count = Math.max(members.length, selected ? 1 : 0);
  const full = count >= 3;
  const canInvite = Boolean(connectActive && selected?.nickname && !full && (!group || isOwner));
  const slots: Array<Member | null> = [others[0] || null, others[1] || null];

  const openInvite = () => {
    if (!connectActive) return setError(t.connectInactive);
    if (!selected?.nickname) return setError(t.noNickname);
    if (full) return setError(t.groupFull);
    setError("");
    setModalError("");
    setInviteOpen(true);
  };

  if (!ready) return <main className="pg-connect-page" aria-busy="true" />;

  return (
    <main className="pg-connect-page">
      <div className="pg-connect-grid" aria-hidden="true" />
      <div className="pg-connect-glow" aria-hidden="true" />
      <div className="pg-connect-shell">
        <header className="pg-connect-head">
          <div>
            <h1>{t.title}</h1>
            <p>{t.subtitle}</p>
          </div>
          {softLoading ? <Spinner /> : null}
        </header>

        {error ? (
          <div className="pg-connect-message" role="alert">
            <span>{error}</span>
            <button
              type="button"
              onClick={() =>
                error === t.loadFailed ? void loadData("soft") : setError("")
              }
              aria-label={t.close}
            >
              {error === t.loadFailed ? t.retry : <CloseIcon />}
            </button>
          </div>
        ) : null}
        {toast ? (
          <div className="pg-connect-toast" role="status">
            <i />
            {toast}
          </div>
        ) : null}

        {loading ? (
          <Skeleton />
        ) : paired.length === 0 ? (
          <section className="pg-connect-empty">
            <ConnectIcon />
            <h2>{t.noDevices}</h2>
            <Link href="/pair" className="pg-button pg-button-primary">
              {t.pair}
            </Link>
          </section>
        ) : (
          <>
            <section className="pg-connect-toolbar">
              <label>
                <span>{t.device}</span>
                <select
                  value={selectedId}
                  onChange={(event) => void changeDevice(event.target.value)}
                >
                  {paired.map((item) => (
                    <option key={item.device.id} value={item.device.id}>
                      {nameOf(item.device)}
                    </option>
                  ))}
                </select>
              </label>
              <div className="pg-connect-toolbar-info">
                <div>
                  <span>{t.nickname}</span>
                  <strong>{selected?.nickname || "—"}</strong>
                </div>
                <span
                  className={`pg-connect-status is-${connectActive ? "active" : "inactive"}`}
                >
                  <i />
                  {connectActive ? t.active : t.inactive}
                </span>
                <button
                  type="button"
                  className="pg-connect-bell"
                  onClick={() => {
                    setModalError("");
                    setInvitesOpen(true);
                  }}
                  aria-label={`${t.invites}: ${pendingInvites.length}`}
                >
                  <BellIcon />
                  {pendingInvites.length > 0 ? (
                    <b>{pendingInvites.length}</b>
                  ) : null}
                </button>
              </div>
            </section>

            {!connectActive ? (
              <section className="pg-connect-note">
                <span>
                  <i />
                  {t.connectRequired}
                </span>
                <Link href="/billing">{t.openBilling}</Link>
              </section>
            ) : !selected?.nickname ? (
              <section className="pg-connect-note">
                <span>
                  <i />
                  {t.noNickname}
                </span>
                <Link href="/dashboard">{t.openDashboard}</Link>
              </section>
            ) : null}

            <section className="pg-connect-group">
              <div className="pg-connect-group-title">
                <span>
                  <ConnectIcon />
                </span>
                <div className="pg-connect-group-copy">
                  <div className="pg-connect-group-name-row">
                    <h2>{groupName || t.defaultGroupName}</h2>
                    {canEditGroupName ? (
                      <button
                        type="button"
                        onClick={() => {
                          setModalError("");
                          setGroupNameDraft(groupName || t.defaultGroupName);
                          setGroupNameOpen(true);
                        }}
                        aria-label={t.editGroupName}
                      >
                        <PencilIcon />
                      </button>
                    ) : null}
                  </div>
                  <p>{group ? `${count} / 3` : t.noGroup}</p>
                </div>
              </div>

              <div className="pg-connect-diagram">
                <div className="pg-connect-lines" aria-hidden="true">
                  <i />
                  <i />
                </div>
                <article className="pg-connect-node is-current">
                  <DeviceGlyph active={connectActive} />
                  <div>
                    <span>{t.myDevice}</span>
                    <strong>{nameOf(selected)}</strong>
                    <small>{isOwner ? t.owner : t.member}</small>
                  </div>
                  <em className={connectActive ? "is-online" : "is-offline"}>
                    <i />
                    {connectActive ? t.inGroup : t.inactive}
                  </em>
                  {!isOwner && currentMember ? (
                    <div className="pg-connect-node-menu">
                      <button
                        type="button"
                        onClick={() =>
                          setMenuId(
                            menuId === currentMember.id ? "" : currentMember.id,
                          )
                        }
                        aria-label={t.actions}
                      >
                        <DotsIcon />
                      </button>
                      {menuId === currentMember.id ? (
                        <div>
                          <button
                            type="button"
                            onClick={() => setConfirmation({ type: "leave" })}
                          >
                            {t.leave}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </article>

                <div className="pg-connect-members">
                  {slots.map((member, index) =>
                    member ? (
                      <article
                        className="pg-connect-node is-member"
                        key={member.id}
                        style={{ "--member-index": index } as CSSProperties}
                      >
                        <DeviceGlyph active />
                        <div>
                          <span>{t.participant}</span>
                          <strong>{nameOf(member.device)}</strong>
                          <small>
                            {roleOf(member.role) === "owner"
                              ? t.owner
                              : t.member}
                          </small>
                        </div>
                        <em className="is-online">
                          <i />
                          {t.inGroup}
                        </em>
                        {isOwner ? (
                          <div className="pg-connect-node-menu">
                            <button
                              type="button"
                              onClick={() =>
                                setMenuId(menuId === member.id ? "" : member.id)
                              }
                              aria-label={t.actions}
                            >
                              <DotsIcon />
                            </button>
                            {menuId === member.id ? (
                              <div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setConfirmation({ type: "remove", member })
                                  }
                                >
                                  {t.remove}
                                </button>
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </article>
                    ) : (
                      <button
                        type="button"
                        className="pg-connect-slot"
                        onClick={openInvite}
                        disabled={!canInvite}
                        key={`slot-${index}`}
                        style={{ "--member-index": index } as CSSProperties}
                        aria-label={t.addFriend}
                      >
                        <PlusIcon />
                      </button>
                    ),
                  )}
                </div>
              </div>
            </section>
          </>
        )}
      </div>

      {groupNameOpen ? (
        <Modal
          title={t.editGroupName}
          closeLabel={t.close}
          onClose={() => setGroupNameOpen(false)}
          className="is-confirm"
        >
          <div className="pg-connect-group-name-form">
            <label>
              <span>{t.groupName}</span>
              <input
                autoFocus
                value={groupNameDraft}
                maxLength={32}
                onChange={(event) => setGroupNameDraft(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && void saveGroupName()}
                placeholder={t.groupNamePlaceholder}
              />
            </label>
            {modalError ? (
              <div className="pg-connect-modal-error" role="alert">
                {modalError}
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => void saveGroupName()}
              disabled={!groupNameDraft.trim()}
            >
              {t.saveGroupName}
            </button>
          </div>
        </Modal>
      ) : null}

      {inviteOpen ? (
        <Modal
          title={t.addFriend}
          closeLabel={t.close}
          onClose={() => {
            setInviteOpen(false);
            setModalError("");
          }}
        >
          <div className="pg-connect-invite-form">
            <label>
              <span>{t.friendNickname}</span>
              <div>
                <input
                  autoFocus
                  value={query}
                  maxLength={15}
                  onChange={(event) => {
                    setQuery(
                      event.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9._-]/g, ""),
                    );
                    setResults([]);
                    setSearched(false);
                    setModalError("");
                  }}
                  onKeyDown={(event) => event.key === "Enter" && void search()}
                  placeholder="alibek-pocket"
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  type="button"
                  onClick={() => void search()}
                  disabled={!query.trim() || searching}
                >
                  {searching ? <Spinner /> : null}
                  {searching ? t.searching : t.search}
                </button>
              </div>
            </label>
            {modalError ? (
              <div className="pg-connect-modal-error" role="alert">
                {modalError}
              </div>
            ) : null}
            {searched && results.length === 0 && !searching ? (
              <div className="pg-connect-search-empty">{t.notFound}</div>
            ) : null}
            {results.map((device) => (
              <article className="pg-connect-search-result" key={device.id}>
                <DeviceGlyph active />
                <div>
                  <span>{t.found}</span>
                  <strong>{nameOf(device)}</strong>
                  <small>
                    {t.invitationTo}: {groupName || t.defaultGroupName}
                  </small>
                </div>
                <button
                  type="button"
                  onClick={() => void invite(device)}
                  disabled={sendingId === device.id}
                >
                  {sendingId === device.id ? <Spinner /> : null}
                  {sendingId === device.id ? t.sending : t.send}
                </button>
              </article>
            ))}
          </div>
        </Modal>
      ) : null}

      {invitesOpen ? (
        <Modal
          title={t.invites}
          closeLabel={t.close}
          onClose={() => {
            setInvitesOpen(false);
            setModalError("");
          }}
          className="is-wide"
        >
          <div className="pg-connect-invites">
            {modalError ? (
              <div className="pg-connect-modal-error" role="alert">
                {modalError}
              </div>
            ) : null}
            {pendingInvites.length === 0 ? (
              <div className="pg-connect-no-invites">
                <BellIcon />
                <span>{t.noInvites}</span>
              </div>
            ) : (
              pendingInvites.map((inviteItem) => {
                const accepting = respondingId === `${inviteItem.id}:accept`;
                const declining = respondingId === `${inviteItem.id}:decline`;
                return (
                  <article key={inviteItem.id}>
                    <DeviceGlyph active />
                    <div>
                      <span>{t.invites}</span>
                      <strong>
                        {invitationSummary(
                          lang,
                          nameOf(inviteItem.fromDevice),
                          inviteItem.group?.name?.trim() || t.defaultGroupName,
                        )}
                      </strong>
                      <small>{inviteItem.fromDevice.uid}</small>
                    </div>
                    <div className="pg-connect-invite-actions">
                      <button
                        type="button"
                        className="is-accept"
                        onClick={() => void respond(inviteItem.id, true)}
                        disabled={accepting || declining}
                      >
                        {accepting ? <Spinner /> : null}
                        {accepting ? t.accepting : t.accept}
                      </button>
                      <button
                        type="button"
                        onClick={() => void respond(inviteItem.id, false)}
                        disabled={accepting || declining}
                      >
                        {declining ? <Spinner /> : null}
                        {declining ? t.declining : t.decline}
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </Modal>
      ) : null}

      {confirmation ? (
        <Modal
          title={confirmation.type === "remove" ? t.removeTitle : t.leaveTitle}
          closeLabel={t.close}
          onClose={() => !membershipBusy && setConfirmation(null)}
          className="is-confirm"
        >
          <div className="pg-connect-confirm">
            <p>{confirmation.type === "remove" ? t.removeText : t.leaveText}</p>
            {confirmation.member ? (
              <strong>{nameOf(confirmation.member.device)}</strong>
            ) : null}
            <div>
              <button
                type="button"
                onClick={() => setConfirmation(null)}
                disabled={membershipBusy}
              >
                {t.cancel}
              </button>
              <button
                type="button"
                className="is-danger"
                onClick={() => void membershipAction()}
                disabled={membershipBusy}
              >
                {membershipBusy ? <Spinner /> : null}
                {membershipBusy
                  ? t.processing
                  : confirmation.type === "remove"
                    ? t.confirmRemove
                    : t.confirmLeave}
              </button>
            </div>
          </div>
        </Modal>
      ) : null}
    </main>
  );
}
