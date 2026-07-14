export const DEVICE_NICKNAME_MAX_LENGTH = 15;

export function sanitizeDeviceNickname(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "")
    .slice(0, DEVICE_NICKNAME_MAX_LENGTH);
}

export function isValidDeviceNickname(value: string): boolean {
  return /^[a-z0-9._-]{1,15}$/.test(value);
}

export type DeviceNicknameErrorKind =
  | "taken"
  | "invalid"
  | "device-not-found"
  | "generic";

export function classifyDeviceNicknameError(error: unknown): DeviceNicknameErrorKind {
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  if (
    message.includes("taken") ||
    message.includes("exists") ||
    message.includes("unique") ||
    message.includes("duplicate") ||
    message.includes("занят") ||
    message.includes("бос емес")
  ) {
    return "taken";
  }

  if (
    message.includes("invalid") ||
    message.includes("format") ||
    message.includes("character") ||
    message.includes("length") ||
    message.includes("validation")
  ) {
    return "invalid";
  }

  if (
    message.includes("device not found") ||
    message.includes("device_not_found") ||
    message.includes("устройство не найдено")
  ) {
    return "device-not-found";
  }

  return "generic";
}
