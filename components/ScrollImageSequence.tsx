import React, {
  CSSProperties,
  UIEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type ObjectFit = "cover" | "contain" | "fill" | "none" | "scale-down";

export type ScrollImageSequenceProps = {
  images: string[];
  frameHeight?: number | string;
  totalScrollHeight?: number | string;
  objectFit?: ObjectFit;
  sticky?: boolean;
  className?: string;
  style?: CSSProperties;
  imageStyle?: CSSProperties;
  ariaLabel?: string;
  maxFrames?: number;
};

const toCssSize = (value: number | string): string =>
  typeof value === "number" ? `${value}px` : value;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const ScrollImageSequence = ({
  images,
  frameHeight = "100vh",
  totalScrollHeight = "420vh",
  objectFit = "cover",
  sticky = true,
  className,
  style,
  imageStyle,
  ariaLabel = "Scroll-driven image sequence",
  maxFrames = 65,
}: ScrollImageSequenceProps) => {
  const frameUrls = useMemo(
    () => images.filter(Boolean).slice(0, Math.max(1, maxFrames)),
    [images, maxFrames],
  );
  const [currentFrame, setCurrentFrame] = useState(0);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const preloaded: HTMLImageElement[] = [];
    frameUrls.forEach((src) => {
      const image = new Image();
      image.decoding = "async";
      image.src = src;
      preloaded.push(image);
    });

    return () => {
      preloaded.splice(0, preloaded.length);
    };
  }, [frameUrls]);

  const syncFrame = useCallback(() => {
    rafRef.current = null;
    const scroller = scrollerRef.current;
    if (!scroller || frameUrls.length <= 1) {
      setCurrentFrame(0);
      return;
    }

    const maxScroll = Math.max(1, scroller.scrollHeight - scroller.clientHeight);
    const progress = clamp(scroller.scrollTop / maxScroll, 0, 1);
    const nextFrame = Math.round(progress * (frameUrls.length - 1));
    setCurrentFrame((previous) => (previous === nextFrame ? previous : nextFrame));
  }, [frameUrls.length]);

  const handleScroll = useCallback(
    (_event: UIEvent<HTMLDivElement>) => {
      if (rafRef.current !== null) return;
      rafRef.current = window.requestAnimationFrame(syncFrame);
    },
    [syncFrame],
  );

  useEffect(() => {
    syncFrame();
    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, [syncFrame]);

  if (frameUrls.length === 0) {
    return null;
  }

  const currentSrc = frameUrls[currentFrame] || frameUrls[0];
  const frameHeightCss = toCssSize(frameHeight);
  const totalScrollHeightCss = toCssSize(totalScrollHeight);

  return (
    <section
      className={className}
      aria-label={ariaLabel}
      style={{
        position: "relative",
        width: "100%",
        height: frameHeightCss,
        overflow: "hidden",
        ...style,
      }}
    >
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        style={{
          height: "100%",
          overflowY: "auto",
          overflowX: "hidden",
          overscrollBehavior: "contain",
          scrollbarGutter: "stable",
        }}
      >
        <div
          style={{
            position: "relative",
            minHeight: totalScrollHeightCss,
          }}
        >
          <div
            style={{
              position: sticky ? "sticky" : "relative",
              top: 0,
              width: "100%",
              height: frameHeightCss,
              overflow: "hidden",
            }}
          >
            <img
              src={currentSrc}
              alt=""
              aria-hidden="true"
              draggable={false}
              decoding="async"
              style={{
                display: "block",
                width: "100%",
                height: "100%",
                objectFit,
                userSelect: "none",
                pointerEvents: "none",
                ...imageStyle,
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

