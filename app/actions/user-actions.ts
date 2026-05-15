"use server";

type UserActionResult = { success: true; message: string } | { success: false; message: string };

export async function createUserAction(formData: FormData): Promise<UserActionResult> {
  void formData;
  return { success: false, message: "User management is unavailable in the Cloudflare D1 version." };
}

export async function updateUserAction(userId: string, formData: FormData): Promise<UserActionResult> {
  void userId;
  void formData;
  return { success: false, message: "User management is unavailable in the Cloudflare D1 version." };
}

export async function setUserDisabledAction(
  userId: string,
  disabled: boolean
): Promise<UserActionResult> {
  void userId;
  void disabled;
  return { success: false, message: "User management is unavailable in the Cloudflare D1 version." };
}

export async function deleteUserAction(userId: string): Promise<UserActionResult> {
  void userId;
  return { success: false, message: "User management is unavailable in the Cloudflare D1 version." };
}
