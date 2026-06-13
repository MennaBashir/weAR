import { describe, expect, it } from "vitest";
import { buildAvatarImageExtractionFormData, formatNullableMeasurement, manualMeasurementSchema, mapManualMeasurementsToPayload, MAX_AVATAR_IMAGE_BYTES, normalizeNullableMeasurements, validateAvatarImageFile } from "@/features/customer/types/profileAvatar";

const fileOfSize = (type: string, size: number) => new File([new Uint8Array(size)], "avatar", { type });

describe("avatar measurement and photo helpers", () => {
  it("validates manual measurements and maps payloads with nullable fields", () => {
    const parsed = manualMeasurementSchema.parse({ heightCm: 180, chestCm: 100 });
    expect(mapManualMeasurementsToPayload(parsed)).toMatchObject({ heightCm: 180, chestCm: 100, waistCm: null });
    expect(() => manualMeasurementSchema.parse({ heightCm: 0 })).toThrow();
  });

  it("normalizes and formats nullable measurements", () => {
    expect(normalizeNullableMeasurements({ heightCm: 170, waistCm: undefined })).toMatchObject({ heightCm: 170, waistCm: null });
    expect(formatNullableMeasurement(null)).toBe("—");
    expect(formatNullableMeasurement(42)).toBe("42");
  });

  it("accepts JPEG/PNG and rejects other image types", () => {
    expect(() => validateAvatarImageFile(fileOfSize("image/jpeg", 10))).not.toThrow();
    expect(() => validateAvatarImageFile(fileOfSize("image/png", 10))).not.toThrow();
    expect(() => validateAvatarImageFile(fileOfSize("image/webp", 10))).toThrow(/JPEG or PNG/);
  });

  it("enforces the 5 MB image limit", () => {
    expect(() => validateAvatarImageFile(fileOfSize("image/png", MAX_AVATAR_IMAGE_BYTES + 1))).toThrow(/5 MB/);
  });

  it("requires height and builds FormData fields without headers", () => {
    const imageFile = fileOfSize("image/png", 10);
    expect(() => buildAvatarImageExtractionFormData({ imageFile, heightCm: 0 })).toThrow(/Height/);
    const formData = buildAvatarImageExtractionFormData({ imageFile, heightCm: 177 });
    expect(formData.get("ImageFile")).toBe(imageFile);
    expect(formData.get("HeightCm")).toBe("177");
  });
});
