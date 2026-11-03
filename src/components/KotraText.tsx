import { Children, type ReactNode, type HTMLAttributes } from "react";
import titleImages from "../kotra-titles.json";
const images: Record<string, { src: string; ratio: number }> = titleImages;
/** 고정 문구는 코트라 글꼴로 조판한 SVG 이미지로 표시하며 원본 글꼴은 배포하지 않는다. */
export function KotraText({ text }: { text: string }) {
  const trimmed = text.trim(),
    image = images[trimmed];
  if (!image) return <span className="kotra-live">{text}</span>;
  return (
    <>
      {text.slice(0, text.indexOf(trimmed))}
      <span className="kotra-text" style={{ width: `${image.ratio}em` }}>
        <span className="visually-hidden">{trimmed}</span>
        <span
          aria-hidden="true"
          className="kotra-ink"
          style={{
            maskImage: `url("${image.src}")`,
            WebkitMaskImage: `url("${image.src}")`,
          }}
        />
      </span>
      {text.slice(text.indexOf(trimmed) + trimmed.length)}
    </>
  );
}
export function KotraHeading({
  level,
  children,
  ...props
}: {
  level: 2 | 3 | 4;
  children: ReactNode;
} & HTMLAttributes<HTMLHeadingElement>) {
  const Tag = level === 2 ? "h2" : level === 3 ? "h3" : "h4";
  return (
    <Tag {...props}>
      {Children.map(children, (child) =>
        typeof child === "string" ? <KotraText text={child} /> : child,
      )}
    </Tag>
  );
}
