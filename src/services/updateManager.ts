export interface AppUpdateInfo {
  isUpdateAvailable: boolean;
  latestVersion: string;
  currentVersion: string;
  releaseNotes: string;
  downloadUrl?: string;
  publishedAt?: string;
}

/**
 * So sánh 2 chuỗi phiên bản semver (ví dụ: "3.3.0" vs "3.2.0")
 * Trả về: > 0 nếu v1 > v2, < 0 nếu v1 < v2, = 0 nếu bằng nhau
 */
export function compareSemver(v1: string, v2: string): number {
  const clean1 = v1.replace(/^v/i, '').trim();
  const clean2 = v2.replace(/^v/i, '').trim();
  const p1 = clean1.split('.').map(n => parseInt(n, 10) || 0);
  const p2 = clean2.split('.').map(n => parseInt(n, 10) || 0);

  for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
    const num1 = p1[i] || 0;
    const num2 = p2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

export async function checkAppUpdate(currentVersion: string): Promise<AppUpdateInfo> {
  const repo = 'tranlocbtr99/Ltmsav';
  const url = `https://api.github.com/repos/${repo}/releases/latest`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return {
        isUpdateAvailable: false,
        latestVersion: currentVersion,
        currentVersion,
        releaseNotes: 'Không thể kiểm tra cập nhật lúc này.'
      };
    }

    const data = await res.json();
    const tagName = data.tag_name || data.name || currentVersion;
    const latestVersion = tagName.replace(/^v/i, '');
    const releaseNotes = data.body || 'Phiên bản mới với nhiều cải tiến và sửa lỗi.';

    // Tìm link tải file APK trong danh sách assets (nếu có)
    let downloadUrl = data.html_url;
    if (Array.isArray(data.assets) && data.assets.length > 0) {
      const apkAsset = data.assets.find((a: any) => a.name && a.name.endsWith('.apk'));
      if (apkAsset && apkAsset.browser_download_url) {
        downloadUrl = apkAsset.browser_download_url;
      }
    }

    const isAvailable = compareSemver(latestVersion, currentVersion) > 0;

    return {
      isUpdateAvailable: isAvailable,
      latestVersion,
      currentVersion,
      releaseNotes,
      downloadUrl,
      publishedAt: data.published_at
    };
  } catch (error) {
    return {
      isUpdateAvailable: false,
      latestVersion: currentVersion,
      currentVersion,
      releaseNotes: 'Không có kết nối mạng hoặc server không phản hồi.'
    };
  }
}

