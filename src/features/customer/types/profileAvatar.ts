import { z } from "zod";

export type CustomerAddressType = "shipping" | "billing" | "both";

export interface CustomerAccountProfile {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  age?: number | null;
  gender?: "Male" | "Female" | string | null;
}

export interface UpdateCustomerProfilePayload {
  fullName: string;
  phoneNumber?: string | null;
  age?: number | null;
  gender?: string | null;
}

export interface ChangeCustomerPasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface DeleteCustomerAccountPayload {
  password: string;
  reason?: string | null;
}

export interface CustomerAddress {
  id: string;
  fullName: string;
  phoneNumber: string;
  line1: string;
  line2?: string | null;
  city: string;
  state?: string | null;
  postalCode: string;
  country: string;
  type?: CustomerAddressType;
  isDefault: boolean;
}

export type CustomerAddressPayload = Omit<CustomerAddress, "id" | "isDefault"> & {
  isDefault?: boolean;
};

export const measurementFieldConfigs = [
  { key: "heightCm", label: "Height", unit: "cm", required: true, min: 1, max: 300 },
  { key: "weightKg", label: "Weight", unit: "kg", required: false, min: 1, max: 400 },
  { key: "chestCm", label: "Chest", unit: "cm", required: false, min: 1, max: 250 },
  { key: "waistCm", label: "Waist", unit: "cm", required: false, min: 1, max: 250 },
  { key: "hipsCm", label: "Hips", unit: "cm", required: false, min: 1, max: 250 },
  { key: "shoulderCm", label: "Shoulder", unit: "cm", required: false, min: 1, max: 200 },
  { key: "inseamCm", label: "Inseam", unit: "cm", required: false, min: 1, max: 200 },
] as const;

export type MeasurementFieldKey = (typeof measurementFieldConfigs)[number]["key"];
export type BodyMeasurements = Partial<Record<MeasurementFieldKey, number | null>> & { heightCm: number | null };
export type ManualMeasurementsInput = Partial<Record<MeasurementFieldKey, number | null>> & { heightCm: number };

const optionalMeasurement = z.preprocess(
  (value) => (value === "" || value === undefined ? null : value),
  z.number().min(1).max(400).nullable(),
);

export const manualMeasurementSchema = z.object({
  heightCm: z.number().min(1).max(300),
  weightKg: optionalMeasurement.optional(),
  chestCm: optionalMeasurement.optional(),
  waistCm: optionalMeasurement.optional(),
  hipsCm: optionalMeasurement.optional(),
  shoulderCm: optionalMeasurement.optional(),
  inseamCm: optionalMeasurement.optional(),
});

export interface CustomerAvatar {
  id: string;
  customerId: string;
  measurements: BodyMeasurements;
  avatar3dModelUrl: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface MeasurementHistoryEntry {
  id: string;
  measurements: BodyMeasurements;
  source: "manual" | "image" | string;
  createdAt: string;
}

export interface SizeRecommendation {
  productId?: string;
  recommendedSize: string | null;
  confidenceScore?: number | null;
  justification?: string | null;
  confidence?: number | null;
  reason?: string | null;
}

export interface ExtractAvatarFromImageInput {
  imageFile: File;
  heightCm: number;
}

export const MAX_AVATAR_IMAGE_BYTES = 5 * 1024 * 1024;
export const AVATAR_IMAGE_TYPES = ["image/jpeg", "image/png"] as const;

export const mapManualMeasurementsToPayload = (input: ManualMeasurementsInput): BodyMeasurements =>
  measurementFieldConfigs.reduce((payload, field) => {
    const value = input[field.key];
    payload[field.key] = value === undefined ? null : value;
    return payload;
  }, {} as BodyMeasurements);

export const normalizeNullableMeasurements = (measurements: Partial<Record<MeasurementFieldKey, number | null | undefined>>): BodyMeasurements =>
  measurementFieldConfigs.reduce((normalized, field) => {
    normalized[field.key] = measurements[field.key] ?? null;
    return normalized;
  }, {} as BodyMeasurements);

export const formatNullableMeasurement = (value: number | null | undefined): string =>
  value == null ? "—" : String(value);

export const validateAvatarImageFile = (file: File): void => {
  if (![...AVATAR_IMAGE_TYPES].includes(file.type as (typeof AVATAR_IMAGE_TYPES)[number])) {
    throw new Error("Avatar photo must be a JPEG or PNG image");
  }
  if (file.size > MAX_AVATAR_IMAGE_BYTES) {
    throw new Error("Avatar photo must be 5 MB or smaller");
  }
};

export const buildAvatarImageExtractionFormData = ({ imageFile, heightCm }: ExtractAvatarFromImageInput): FormData => {
  validateAvatarImageFile(imageFile);
  if (!Number.isFinite(heightCm) || heightCm < 1 || heightCm > 300) {
    throw new Error("Height in centimeters is required");
  }
  const formData = new FormData();
  formData.append("ImageFile", imageFile);
  formData.append("HeightCm", String(heightCm));
  return formData;
};
