import { handleProfileImageUpload } from "../image-upload";

export function POST(request: Request) {
  return handleProfileImageUpload(request, {
    subdir: "avatars",
    maxSize: 2 * 1024 * 1024,
    maxSizeLabel: "2MB",
    field: "avatarUrl",
  });
}
