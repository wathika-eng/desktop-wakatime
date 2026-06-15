import {
  activeWindow,
  isEnabledExtension,
  isInstalledExtension,
  subscribeActiveWindow,
  unsubscribeActiveWindow,
  WindowInfo,
} from "@miniben90/x-win";
import { powerMonitor } from "electron";

import { AppsManager } from "../helpers/apps-manager";
import { MonitoredApp } from "../helpers/monitored-app";
import { MonitoringManager } from "../helpers/monitoring-manager";
import { Logging, LogLevel } from "../utils/logging";
import { Wakatime } from "./wakatime";

export class Watcher {
  wakatime: Wakatime;
  activeWindow?: WindowInfo;
  private activeWindowSubscription: number | null;
  private interval: NodeJS.Timeout | null;
  private windowTrackingAvailable: boolean | null;

  constructor(wakatime: Wakatime) {
    this.wakatime = wakatime;
    this.activeWindowSubscription = null;
    this.interval = null;
    this.windowTrackingAvailable = null;
  }

  private handleActivity() {
    if (this.windowTrackingAvailable === null) {
      this.windowTrackingAvailable =
        process.platform !== "linux" ||
        (isInstalledExtension() && isEnabledExtension());
      if (!this.windowTrackingAvailable) {
        Logging.instance().log(
          "Window tracking not available. Install the GNOME Shell extension and restart your session.",
          LogLevel.ERROR,
        );
      }
    }
    if (!this.windowTrackingAvailable) {
      return;
    }

    try {
      const window = activeWindow();
      if (!MonitoringManager.isMonitored(window.info.path)) {
        return;
      }

      const app = AppsManager.instance().getApp(window.info.path);
      const heartbeatData = MonitoredApp.heartbeatData(window, app);
      if (!heartbeatData) {
        return;
      }

      this.wakatime.sendHeartbeat({
        appData: app,
        windowInfo: window,
        project: heartbeatData.project,
        entity: heartbeatData.entity,
        entityType: "app",
        category: heartbeatData.category,
        language: heartbeatData.language,
        isWrite: false,
      });
    } catch (error) {
      Logging.instance().log((error as Error).message, LogLevel.ERROR, true);
    }
  }

  start() {
    this.stop();
    this.activeWindowSubscription = subscribeActiveWindow(
      (error: Error | null, windowInfo: WindowInfo | undefined) => {
        if (error || !windowInfo?.info.processId) return;
        if (this.activeWindow?.info.processId === windowInfo.info.processId) {
          return;
        }

        Logging.instance().log(
          `App changed from ${this.activeWindow?.info.name || "nil"} to ${windowInfo.info.name}`,
        );
        this.activeWindow = windowInfo;

        this.handleActivity();
      },
    );
    this.interval = setInterval(() => {
      const idleState = powerMonitor.getSystemIdleState(10);
      if (idleState === "active") {
        this.handleActivity();
      }
    }, 5000);
  }

  stop() {
    if (this.activeWindowSubscription !== null) {
      unsubscribeActiveWindow(this.activeWindowSubscription);
    }
    if (this.interval !== null) {
      clearInterval(this.interval);
    }
  }
}
