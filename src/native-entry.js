// Ponte para os plugins nativos (notificações). Vira www/native.js no build.
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
window.FFNative = Capacitor.isNativePlatform() ? { LocalNotifications, platform: Capacitor.getPlatform() } : null;
