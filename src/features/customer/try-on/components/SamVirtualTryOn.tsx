import { Loader2, RefreshCcw, Shirt, Sparkles, Upload, User } from "lucide-react";
import { lazy, Suspense, useMemo, useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { customerTheme } from "@/features/customer/styles/customerTheme";
import { useSamTryOn } from "@/features/customer/try-on/hooks/samTryOn";
import { toTrustedLocalModelUrl } from "@/features/customer/try-on/utils/modelUrl";
import { cn } from "@/lib/utils";

const LazyTryOn3DViewer = lazy(
  () => import("@/features/customer/try-on/components/TryOn3DViewer"),
);

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const validateImage = (file: File): string | null => {
  if (!ACCEPTED_TYPES.includes(file.type)) return "Use a JPEG, PNG, or WEBP image.";
  if (file.size > MAX_FILE_BYTES) return "Image must be 8 MB or smaller.";
  return null;
};

interface PhotoFieldProps {
  id: string;
  label: string;
  hint: string;
  icon: React.ReactNode;
  file: File | null;
  disabled?: boolean;
  onSelect: (file: File | null, error: string | null) => void;
}

function PhotoField({ id, label, hint, icon, file, disabled, onSelect }: PhotoFieldProps) {
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.files?.[0] ?? null;
    if (!next) {
      onSelect(null, null);
      return;
    }
    const error = validateImage(next);
    onSelect(error ? null : next, error);
  };

  return (
    <div className={cn(customerTheme.softCard, "p-4")}>
      <div className="mb-3 flex items-center gap-2 text-[#4D433D]">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F4EDE7] text-[#A37E6B]">
          {icon}
        </span>
        <div>
          <p className="text-sm font-semibold">{label}</p>
          <p className="text-xs text-[#6F625B]">{hint}</p>
        </div>
      </div>

      {previewUrl ? (
        <img
          src={previewUrl}
          alt={`${label} preview`}
          className="mb-3 max-h-56 w-full rounded-2xl border border-[#E4DCD1] object-contain"
        />
      ) : null}

      <label
        htmlFor={id}
        className={cn(
          "flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-[#C9A390] bg-white px-4 py-3 text-sm font-medium text-[#A37E6B] transition-colors hover:bg-[#FAF7F4]",
          disabled && "cursor-not-allowed opacity-60",
          customerTheme.focusRing,
        )}
      >
        <Upload className="h-4 w-4" />
        {file ? "Replace image" : "Choose image"}
      </label>
      <input
        id={id}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="sr-only"
        disabled={disabled}
        onChange={handleChange}
      />
      {file ? (
        <p className="mt-2 truncate text-xs text-[#6F625B]">Selected: {file.name}</p>
      ) : null}
    </div>
  );
}

export function SamVirtualTryOn() {
  const [personPhoto, setPersonPhoto] = useState<File | null>(null);
  const [clothesPhoto, setClothesPhoto] = useState<File | null>(null);
  const [clothesPrompt, setClothesPrompt] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const sam = useSamTryOn();

  const dressedModelUrl = toTrustedLocalModelUrl(sam.result.dressedModelUrl);
  const bodyModelUrl = toTrustedLocalModelUrl(sam.result.bodyModelUrl);
  // Show the dressed model when available, otherwise the body. We never reset
  // the viewer to empty while a re-dress is running.
  const activeModelUrl = dressedModelUrl ?? bodyModelUrl;

  const canGenerateBody = Boolean(personPhoto) && !sam.isBuildingBody;
  const canDress = sam.hasBody && Boolean(clothesPhoto) && !sam.isDressing;

  const handleGenerateBody = () => {
    setFieldError(null);
    if (!personPhoto) {
      setFieldError("Upload your photo first.");
      return;
    }
    void sam.generateBody(personPhoto);
  };

  const handleDress = () => {
    setFieldError(null);
    if (!sam.hasBody) {
      setFieldError("Generate your 3D body first.");
      return;
    }
    if (!clothesPhoto) {
      setFieldError("Upload a clothing photo to wear.");
      return;
    }
    void sam.dress(clothesPhoto, clothesPrompt);
  };

  const isBusy = sam.isBuildingBody || sam.isDressing;
  const statusLabel = sam.isDressing
    ? sam.dressStageLabel
    : sam.isBuildingBody
      ? sam.bodyStageLabel
      : "";

  return (
    <section
      className="space-y-6 rounded-3xl border border-[#E4DCD1] bg-gradient-to-b from-[#FAF7F4] to-white p-5 sm:p-8"
      aria-label="Sam AI virtual try-on"
    >
      <header className="space-y-2">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#F4EDE7] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#A37E6B]">
          <Sparkles className="h-3.5 w-3.5" />
          Sam AI Try-On
        </span>
        <h2 className="text-2xl font-semibold text-[#2F2925] sm:text-3xl">
          Build your 3D avatar, then try clothes on it
        </h2>
        <p className="max-w-2xl text-sm text-[#6F625B]">
          Step 1: upload your photo and Sam reconstructs a 3D body rendered with your real
          skin tone via WebGL. Step 2: upload any garment to wear it. Upload another garment
          anytime — only the clothes are swapped, your avatar is not rebuilt.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="space-y-4">
          {/* Step 1 — generate body */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-[#A37E6B]">Step 1 · Your 3D body</p>
            <PhotoField
              id="sam-person-photo"
              label="Your photo"
              hint="Full-body photo works best"
              icon={<User className="h-4 w-4" />}
              file={personPhoto}
              disabled={sam.isBuildingBody}
              onSelect={(file, error) => {
                setPersonPhoto(file);
                setFieldError(error);
              }}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={handleGenerateBody}
                disabled={!canGenerateBody}
                className={cn(
                  "rounded-full bg-[#A37E6B] text-white hover:bg-[#8F6E5D]",
                  customerTheme.focusRing,
                )}
              >
                {sam.isBuildingBody ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <User className="mr-2 h-4 w-4" />
                )}
                {sam.isBuildingBody
                  ? "Building body…"
                  : sam.hasBody
                    ? "Regenerate body"
                    : "Generate 3D body"}
              </Button>
              {sam.isBuildingBody ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={sam.cancelBody}
                  className={cn("rounded-full", customerTheme.focusRing)}
                >
                  Cancel
                </Button>
              ) : null}
            </div>
            {sam.bodyError ? (
              <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {sam.bodyError}
              </p>
            ) : null}
          </div>

          {/* Step 2 — dress */}
          <div
            className={cn(
              "space-y-3 border-t border-[#E4DCD1] pt-4",
              !sam.hasBody && "opacity-60",
            )}
          >
            <p className="text-sm font-semibold text-[#A37E6B]">Step 2 · Try on a garment</p>
            <PhotoField
              id="sam-clothes-photo"
              label="Clothing photo"
              hint="Upload any garment to wear"
              icon={<Shirt className="h-4 w-4" />}
              file={clothesPhoto}
              disabled={!sam.hasBody || sam.isDressing}
              onSelect={(file, error) => {
                setClothesPhoto(file);
                setFieldError(error);
              }}
            />
            <div className={cn(customerTheme.softCard, "p-4")}>
              <label
                htmlFor="sam-clothes-prompt"
                className="mb-1.5 block text-sm font-semibold text-[#4D433D]"
              >
                Garment type (optional)
              </label>
              <input
                id="sam-clothes-prompt"
                type="text"
                value={clothesPrompt}
                onChange={(event) => setClothesPrompt(event.target.value)}
                placeholder="e.g. shirt, dress, jacket"
                disabled={!sam.hasBody || sam.isDressing}
                className={cn(
                  "h-11 w-full rounded-xl border border-[#E4DCD1] bg-white px-3 text-sm text-[#2F2925] outline-none placeholder:text-[#B6A092] focus:border-[#A37E6B] disabled:opacity-60",
                  customerTheme.focusRing,
                )}
              />
              <p className="mt-1 text-xs text-[#6F625B]">
                Helps Sam segment the garment accurately.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={handleDress}
                disabled={!canDress}
                className={cn(
                  "rounded-full bg-[#A37E6B] text-white hover:bg-[#8F6E5D]",
                  customerTheme.focusRing,
                )}
              >
                {sam.isDressing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Shirt className="mr-2 h-4 w-4" />
                )}
                {sam.isDressing
                  ? "Dressing…"
                  : sam.result.isDressed
                    ? "Change garment"
                    : "Wear this garment"}
              </Button>
              {sam.isDressing ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={sam.cancelDress}
                  className={cn("rounded-full", customerTheme.focusRing)}
                >
                  Cancel
                </Button>
              ) : null}
            </div>
            {sam.dressError ? (
              <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {sam.dressError}
              </p>
            ) : null}
          </div>

          {fieldError ? (
            <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {fieldError}
            </p>
          ) : null}

          {sam.hasBody || sam.result.isDressed ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                sam.reset();
                setPersonPhoto(null);
                setClothesPhoto(null);
                setClothesPrompt("");
                setFieldError(null);
              }}
              className={cn("rounded-full", customerTheme.focusRing)}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Start over
            </Button>
          ) : null}
        </div>

        <div className="relative min-h-[420px] rounded-3xl border border-[#E4DCD1] bg-[#F4EDE7] p-4">
          {activeModelUrl ? (
            <div className="space-y-4">
              <Suspense
                fallback={
                  <div className="flex h-[420px] items-center justify-center text-sm text-[#6F625B]">
                    Loading 3D viewer…
                  </div>
                }
              >
                <LazyTryOn3DViewer
                  modelUrl={activeModelUrl}
                  tintColor={sam.result.isDressed ? null : sam.result.skinTone}
                  label={
                    sam.result.isDressed
                      ? "Your dressed 3D avatar"
                      : "Your reconstructed 3D body"
                  }
                />
              </Suspense>
              <p className="text-sm font-medium text-[#4D433D]">
                {sam.result.isDressed
                  ? "Your avatar is wearing the garment in 3D. Drag to rotate. Upload another garment to change it."
                  : "3D body ready with your skin tone. Upload a garment in Step 2 to wear it."}
              </p>
            </div>
          ) : isBusy ? (
            <div className="flex h-full min-h-[400px] flex-col items-center justify-center text-center text-[#6F625B]">
              <Loader2 className="mb-4 h-10 w-10 animate-spin text-[#A37E6B]" />
              <p className="text-base font-semibold text-[#4D433D]">{statusLabel}</p>
              <p className="mt-1 text-sm">This can take up to a minute per step.</p>
            </div>
          ) : sam.bodyStage === "error" ? (
            <div
              role="alert"
              className="flex h-full min-h-[400px] flex-col items-center justify-center text-center"
            >
              <h3 className="text-lg font-semibold text-[#2F2925]">Body generation failed</h3>
              <p className="mt-2 max-w-sm text-sm text-[#6F625B]">{sam.bodyError}</p>
            </div>
          ) : (
            <div className="flex h-full min-h-[400px] flex-col items-center justify-center text-center text-[#6F625B]">
              <Sparkles className="mb-3 h-10 w-10 text-[#C9A390]" />
              <p className="max-w-sm text-sm">
                Upload your photo and generate your 3D body. It renders here in WebGL with
                your real skin tone, then you can try on garments.
              </p>
            </div>
          )}

          {/* Overlay shown while re-dressing so the current model stays visible */}
          {sam.isDressing && activeModelUrl ? (
            <div className="pointer-events-none absolute inset-4 flex items-end justify-center rounded-3xl bg-gradient-to-t from-white/85 to-transparent">
              <div className="mb-6 flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-medium text-[#4D433D] shadow">
                <Loader2 className="h-4 w-4 animate-spin text-[#A37E6B]" />
                {sam.dressStageLabel}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
