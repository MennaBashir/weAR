declare namespace JSX {
  interface IntrinsicElements {
    "model-viewer": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      src?: string;
      alt?: string;
      class?: string;
      "camera-controls"?: boolean;
      "touch-action"?: string;
      "interaction-prompt"?: string;
      ar?: string;
      "disable-tap"?: boolean;
      loading?: string;
      reveal?: string;
      "camera-orbit"?: string;
      "field-of-view"?: string;
      "min-camera-orbit"?: string;
      "max-camera-orbit"?: string;
    };
  }
}
