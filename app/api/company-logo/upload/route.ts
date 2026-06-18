import { NextRequest, NextResponse } from "next/server";
import { getCloudflareEnv } from "@/lib/cloudflare/context";
import {
  COMPANY_LOGO_MAX_FILE_SIZE_BYTES,
  getCompanyLogoExtension,
  isSupportedCompanyLogoType
} from "@/lib/utils/company-logo";
import { executeStatement, queryFirst } from "@/lib/d1/client";
import { hasR2S3Env, putObjectToR2, verifyR2Access, verifyR2WriteAccess } from "@/lib/r2/s3";

type R2BucketLike = {
  put: (key: string, value: Blob | ArrayBuffer | ArrayBufferView | string, options?: any) => Promise<unknown>;
};

function getPublicBaseUrl(env: Record<string, unknown>) {
  const publicBaseUrl =
    (env.COMPANY_LOGO_PUBLIC_BASE_URL as string | undefined) ??
    (env.CLOUDFLARE_R2_PUBLIC_BASE_URL as string | undefined);

  if (!publicBaseUrl) {
    return { ok: false as const, message: "Missing company logo public base URL." };
  }

  try {
    const parsedUrl = new URL(publicBaseUrl);

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return {
        ok: false as const,
        message:
          "Company logo public base URL must use http or https. Set COMPANY_LOGO_PUBLIC_BASE_URL in wrangler.jsonc or CLOUDFLARE_R2_PUBLIC_BASE_URL in the environment."
      };
    }

    if (parsedUrl.hostname === "invoice.casibros.com") {
      return {
        ok: false as const,
        message:
          "Company logo public base URL is pointing at the app host. Use a public R2 domain or custom asset domain instead."
      };
    }

    return { ok: true as const, value: parsedUrl.toString().replace(/\/$/, "") };
  } catch {
    return {
      ok: false as const,
      message:
        "Company logo public base URL is invalid. Set COMPANY_LOGO_PUBLIC_BASE_URL in wrangler.jsonc or CLOUDFLARE_R2_PUBLIC_BASE_URL in the environment to a full https URL."
    };
  }
}

function buildStoredLogoUrl(publicBaseUrl: string, objectKey: string) {
  try {
    const parsedUrl = new URL(publicBaseUrl);
    const looksLikeR2Host =
      parsedUrl.hostname.endsWith(".r2.dev") ||
      parsedUrl.hostname.endsWith(".r2.cloudflarestorage.com");

    if (looksLikeR2Host) {
      return `${parsedUrl.toString().replace(/\/$/, "")}/${objectKey}`;
    }
  } catch {
    // Fall back to an app-local object route when the public URL is not a real R2 host.
  }

  return `/api/company-logo/object/${objectKey}`;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const fileEntry = formData.get("file");
    const companyIdValue = formData.get("companyId");

    if (!(fileEntry instanceof File)) {
      return NextResponse.json({ message: "Missing company logo file." }, { status: 400 });
    }

    if (fileEntry.size <= 0) {
      return NextResponse.json({ message: "The uploaded file is empty." }, { status: 400 });
    }

    if (fileEntry.size > COMPANY_LOGO_MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { message: "Company logos must be 5 MB or smaller." },
        { status: 413 }
      );
    }

    const contentType = fileEntry.type.toLowerCase();

    if (!isSupportedCompanyLogoType(contentType)) {
      return NextResponse.json(
        { message: "Unsupported company logo type. Use PNG, JPG, WEBP, or SVG." },
        { status: 415 }
      );
    }

    const extension = getCompanyLogoExtension(contentType);

    if (!extension) {
      return NextResponse.json({ message: "Unsupported company logo type." }, { status: 415 });
    }

    const envRecord = await getCloudflareEnv();
    const bucket = envRecord.COMPANY_LOGO_BUCKET as R2BucketLike | undefined;

    const objectKey = `company-logos/${crypto.randomUUID()}${extension}`;

    if (hasR2S3Env()) {
      const fileBuffer = await fileEntry.arrayBuffer();
      await putObjectToR2(objectKey, fileBuffer, contentType);
    } else {
      if (!bucket) {
        return NextResponse.json(
          {
            message:
              'R2 binding "COMPANY_LOGO_BUCKET" is not configured and direct R2 credentials are missing.'
          },
          { status: 500 }
        );
      }

      await bucket.put(objectKey, fileEntry, {
        httpMetadata: {
          contentType
        },
        customMetadata: {
          originalName: fileEntry.name
        }
      });
    }

    const publicBaseUrlResult = getPublicBaseUrl(envRecord);
    const logoUrl = publicBaseUrlResult.ok
      ? buildStoredLogoUrl(publicBaseUrlResult.value, objectKey)
      : `/api/company-logo/object/${objectKey}`;

    if (typeof companyIdValue === "string" && companyIdValue.trim()) {
      const companyId = companyIdValue.trim();
      const company = await queryFirst<Record<string, unknown>>(
        "SELECT id FROM companies WHERE id = ? LIMIT 1",
        [companyId]
      );

      if (!company) {
        return NextResponse.json({ message: "Company not found." }, { status: 404 });
      }

      await executeStatement(
        "UPDATE companies SET logo_url = ?, updated_at = ? WHERE id = ?",
        [logoUrl, new Date().toISOString(), companyId]
      );
    }

    return NextResponse.json({
      logoUrl,
      objectKey,
      contentType,
      size: fileEntry.size,
      storageMode: logoUrl.startsWith("/api/company-logo/object/") ? "internal" : "public",
      publicBaseUrlConfigured: publicBaseUrlResult.ok,
      uploadBackend: hasR2S3Env() ? "s3" : "binding"
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to upload the company logo."
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const envRecord = await getCloudflareEnv();
    const bucket = envRecord.COMPANY_LOGO_BUCKET as R2BucketLike | undefined;
    const publicBaseUrlResult = getPublicBaseUrl(envRecord);
    const r2AccessCheck = hasR2S3Env() ? await verifyR2Access() : null;
    const r2WriteCheck = hasR2S3Env() ? await verifyR2WriteAccess() : null;

    return NextResponse.json(
      {
        bucketConfigured: Boolean(bucket) || hasR2S3Env(),
        uploadBackend: hasR2S3Env() ? "s3" : "binding",
        r2AccessOk: r2AccessCheck?.ok ?? null,
        r2AccessStatus: r2AccessCheck?.status ?? null,
        r2AccessMessage: r2AccessCheck?.message ?? null,
        r2WriteOk: r2WriteCheck?.ok ?? null,
        r2WriteStatus: r2WriteCheck?.status ?? null,
        r2WriteMessage: r2WriteCheck?.message ?? null,
        publicUrlConfigured: publicBaseUrlResult.ok,
        publicUrlError: publicBaseUrlResult.ok ? null : publicBaseUrlResult.message
      },
      {
        status:
          (Boolean(bucket) || hasR2S3Env()) &&
          publicBaseUrlResult.ok &&
          (r2AccessCheck ? r2AccessCheck.ok : true) &&
          (r2WriteCheck ? r2WriteCheck.ok : true)
            ? 200
            : 500
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        bucketConfigured: false,
        publicUrlConfigured: false,
        publicUrlError: error instanceof Error ? error.message : "Failed to inspect company logo config."
      },
      { status: 500 }
    );
  }
}
