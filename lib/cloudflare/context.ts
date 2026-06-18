export async function getCloudflareEnv() {
  const { getCloudflareContext } = await import("@opennextjs/cloudflare");
  const context = await getCloudflareContext({ async: true });
  return (context.env as Record<string, unknown> | undefined) ?? {};
}
