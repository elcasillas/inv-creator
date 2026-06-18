export const COMPANY_LOGO_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export const COMPANY_LOGO_ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml"
] as const;

export const COMPANY_LOGO_ALLOWED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".svg"] as const;

const SUPPORTED_IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "svg"];

export function isSupportedCompanyLogoType(contentType: string) {
  return COMPANY_LOGO_ALLOWED_MIME_TYPES.includes(contentType as (typeof COMPANY_LOGO_ALLOWED_MIME_TYPES)[number]);
}

export function getCompanyLogoExtension(contentType: string) {
  switch (contentType) {
    case "image/png":
      return ".png";
    case "image/jpeg":
      return ".jpg";
    case "image/webp":
      return ".webp";
    case "image/svg+xml":
      return ".svg";
    default:
      return null;
  }
}

export function getCompanyLogoSrc(logoUrl: string | null | undefined) {
  if (!logoUrl) {
    return null;
  }

  if (logoUrl.startsWith("data:")) {
    return logoUrl;
  }

  if (logoUrl.startsWith("/api/company-logo/object/")) {
    return logoUrl;
  }

  try {
    const parsedUrl = new URL(logoUrl);

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return null;
    }

    const pathname = parsedUrl.pathname.toLowerCase();
    const isSupported = SUPPORTED_IMAGE_EXTENSIONS.some((extension) =>
      pathname.endsWith(`.${extension}`)
    );

    if (!isSupported) {
      return null;
    }

    return `/api/company-logo?src=${encodeURIComponent(logoUrl)}`;
  } catch {
    return null;
  }
}
