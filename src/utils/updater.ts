import { check } from "@tauri-apps/plugin-updater";
import { ask, message } from "@tauri-apps/plugin-dialog";
import { relaunch } from "@tauri-apps/plugin-process";
import { platform } from "@tauri-apps/plugin-os";
import { getVersion } from "@tauri-apps/api/app";
import { openUrl } from "@tauri-apps/plugin-opener";

type CheckForAppUpdatesProps = {
  showNoUpdate?: boolean;
};

function isNewerVersion(latest: string, current: string): boolean {
  const cleanLatest = latest.replace(/^v/, "").trim();
  const cleanCurrent = current.replace(/^v/, "").trim();
  const lParts = cleanLatest.split(".").map((n) => parseInt(n, 10) || 0);
  const cParts = cleanCurrent.split(".").map((n) => parseInt(n, 10) || 0);
  const maxLen = Math.max(lParts.length, cParts.length);
  for (let i = 0; i < maxLen; i++) {
    const l = lParts[i] ?? 0;
    const c = cParts[i] ?? 0;
    if (l > c) return true;
    if (l < c) return false;
  }
  return false;
}

export async function checkForAppUpdates({
  showNoUpdate = false,
}: CheckForAppUpdatesProps = {}) {
  try {
    const currentPlatform = platform();

    // Android update handling via GitHub Releases
    if (currentPlatform === "android") {
      let currentVersion = "0.6.7";
      try {
        currentVersion = await getVersion();
      } catch (e) {
        console.debug("Could not read app version:", e);
      }

      const res = await fetch(
        "https://api.github.com/repos/rayyanbobs-art/sonara-stream/releases/latest",
        {
          headers: {
            Accept: "application/vnd.github.v3+json",
          },
        }
      );

      if (!res.ok) {
        if (showNoUpdate) {
          try {
            await message("Unable to check for updates. Please try again later.", {
              title: "Check Updates",
              kind: "warning",
              okLabel: "OK",
            });
          } catch {
            window.alert("Unable to check for updates. Please try again later.");
          }
        }
        return;
      }

      const release = (await res.json()) as {
        tag_name?: string;
        body?: string;
        assets?: Array<{ name: string; browser_download_url: string }>;
      };

      const latestTag = release.tag_name || "";
      const hasUpdate = isNewerVersion(latestTag, currentVersion);

      if (hasUpdate) {
        const apkAsset = release.assets?.find((a) =>
          a.name.toLowerCase().endsWith(".apk")
        );
        const downloadUrl =
          apkAsset?.browser_download_url ||
          `https://github.com/rayyanbobs-art/sonara-stream/releases/tag/${latestTag}`;

        const releaseNotes = release.body
          ? release.body.slice(0, 180) + (release.body.length > 180 ? "..." : "")
          : "Bug fixes and performance improvements.";

        let shouldDownload = false;
        try {
          shouldDownload = await ask(
            `Sonara Stream ${latestTag} is available!\n(Current: v${currentVersion})\n\n${releaseNotes}\n\nWould you like to download and install the new version?`,
            {
              title: "Update Available",
              kind: "info",
              okLabel: "Download Update",
              cancelLabel: "Later",
            }
          );
        } catch {
          shouldDownload = window.confirm(
            `Sonara Stream ${latestTag} is available!\n(Current: v${currentVersion})\n\n${releaseNotes}\n\nWould you like to download and install the new version?`
          );
        }

        if (shouldDownload) {
          try {
            await openUrl(downloadUrl);
          } catch {
            window.open(downloadUrl, "_blank");
          }
        }
      } else if (showNoUpdate) {
        try {
          await message(`You are already running the latest version (v${currentVersion}).`, {
            title: "Up to Date",
            kind: "info",
            okLabel: "OK",
          });
        } catch {
          window.alert(`You are already running the latest version (v${currentVersion}).`);
        }
      }
      return;
    }

    if (currentPlatform === "ios") {
      return;
    }

    // Desktop updater logic via @tauri-apps/plugin-updater
    const update = await check();

    if (!update) {
      if (showNoUpdate) {
        await message("You are on the latest version.", {
          title: "No Update Available",
          kind: "info",
          okLabel: "OK",
        });
      }
      return;
    }

    const yes = await ask(`Version ${update.version} is available!`, {
      title: "Update Available",
      kind: "info",
      okLabel: "Update",
      cancelLabel: "Later",
    });

    if (!yes) {
      console.log("User chose not to update");
      return;
    }

    await update
      .downloadAndInstall()
      .then(async () => {
        await relaunch();
      })
      .catch((error) => {
        console.error("Error downloading or installing the update:", error);
      });
  } catch (err) {
    console.debug("Updater check skipped or unavailable:", err);
  }
}
