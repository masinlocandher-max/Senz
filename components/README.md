# Scroll Image Sequence Component

Reusable scroll-driven image sequence components for JPG/PNG frame stacks.

## React / Remotion-Friendly Usage

```tsx
import { ScrollImageSequence } from "./components/ScrollImageSequence";

const frames = Array.from({ length: 65 }, (_, index) => {
  const frame = String(index + 1).padStart(3, "0");
  return `/frames/about-tour-${frame}.jpg`;
});

export const AboutTour = () => (
  <ScrollImageSequence
    images={frames}
    frameHeight="100vh"
    totalScrollHeight="480vh"
    objectFit="cover"
    sticky
  />
);
```

## Static HTML Usage

```html
<script type="module" src="components/scroll-image-sequence.js"></script>

<scroll-image-sequence
  images="frames/frame-001.jpg,frames/frame-002.jpg,frames/frame-003.jpg"
  frame-height="100vh"
  total-scroll-height="420vh"
  object-fit="cover"
  sticky="true"
></scroll-image-sequence>
```

## Props / Attributes

- `images`: ordered array of image frame URLs. The component supports up to 65 frames.
- `frameHeight` / `frame-height`: visible preview height, for example `720`, `"720px"`, or `"100vh"`.
- `totalScrollHeight` / `total-scroll-height`: internal scroll distance.
- `objectFit` / `object-fit`: `cover`, `contain`, `fill`, `none`, or `scale-down`.
- `sticky` / `sticky`: keeps the preview pinned while scrolling inside the component.

The scroll container is internal, so the browser window does not need to scroll for frame updates.
