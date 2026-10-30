import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { App } from "@capacitor/app";
import qrcode from "qrcode-generator";
window.FFQR = qrcode;
window.FFNative = Capacitor.isNativePlatform() ? { LocalNotifications, App, platform: Capacitor.getPlatform() } : null;
import { createClient } from "@supabase/supabase-js";
window.FFSupa = { createClient };
