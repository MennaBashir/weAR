import "@google/model-viewer";
import { RotateCcw } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { customerTheme } from "@/features/customer/styles/customerTheme";
import type { SafeModelUrl } from "@/features/customer/try-on/utils/modelUrl";
import { cn } from "@/lib/utils";

type ModelViewerElement = HTMLElement & {
  cameraOrbit?: string;
  fieldOfView?: string;
  jumpCameraToGoal?: () => void;
};

interface TryOn3DViewerProps {
  modelUrl: SafeModelUrl;
  label: string;
  onLoading?: () => void;
  onReady?: () => void;
  onError?: () => void;
}

const supportsCustomElements = () => typeof window !== "undefined" && "customElements" in window;
const supportsWebGl = () => {
  if (typeof document === "undefined") return false;
  const canvas = document.createElement("canvas");
  return Boolean(canvas.getContext("webgl") ?? canvas.getContext("experimental-webgl"));
};

export default function TryOn3DViewer({ modelUrl, label, onLoading, onReady, onError }: TryOn3DViewerProps) {
  const viewerRef = useRef<ModelViewerElement | null>(null);

  useEffect(() => {
    onLoading?.();
    if (!supportsCustomElements() || !supportsWebGl()) onError?.();
  }, [onError, onLoading]);

  const resetView = () => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    viewer.cameraOrbit = "0deg 75deg 105%";
    viewer.fieldOfView = "30deg";
    viewer.jumpCameraToGoal?.();
  };

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-3xl border border-[#E4DCD1] bg-[#F4EDE7]">
        <model-viewer
          ref={viewerRef}
          src={modelUrl}
          camera-controls
          touch-action="pan-y"
          interaction-prompt="none"
          ar="false"
          disable-tap
          loading="eager"
          reveal="auto"
          camera-orbit="0deg 75deg 105%"
          field-of-view="30deg"
          min-camera-orbit="auto auto 70%"
          max-camera-orbit="auto auto 140%"
          alt={label}
          aria-label={label}
          class="block h-[min(70vh,640px)] min-h-[360px] w-full motion-reduce:[--model-viewer-progress-mask:none]"
          onLoad={() => onReady?.()}
          onError={() => onError?.()}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={resetView} className={cn("rounded-full", customerTheme.focusRing)}>
          <RotateCcw className="mr-2 h-4 w-4" />Reset 3D view
        </Button>
      </div>
      <p className="text-sm text-[#6F625B]">Drag or swipe to rotate the model. No camera or microphone access is used.</p>
    </div>
  );
}
