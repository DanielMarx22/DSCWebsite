// app/studio/[[...tool]]/page.tsx
import { NextStudio } from "next-sanity/studio";
import config from "../../../sanity.config";

export const dynamic = "force-static";
export { metadata, viewport } from "next-sanity/studio";

export default function StudioPage() {
  return (
    // This class triggers all the CSS rules above
    <div className="studio-pinned-wrapper">
      <NextStudio config={config} />
    </div>
  );
}
