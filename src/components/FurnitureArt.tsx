import type { FurnitureKind } from "../types";
import { FURNITURE_META } from "../planSpec";
import { LegacyFurnitureArt } from "./LegacyFurnitureArt";
// 외곽 크기에 맞춰 요소를 배치하되 모니터·컵·손잡이 등은 원래 비율을 유지한다.
export function FurnitureArt({
  kind,
  color,
  width,
  height,
  open = false,
}: {
  kind: FurnitureKind;
  color?: string;
  width?: number;
  height?: number;
  open?: boolean;
}) {
  const meta = FURNITURE_META[kind],
    w = width ?? meta.w * 9,
    h = height ?? meta.h * 6,
    m = Math.min(w, h),
    wood = color || "#c5a77d",
    edge = "#ad9067",
    mint = "#8fa79a",
    cream = "#fff8e7";
  const rounded = (
    x: number,
    y: number,
    rw: number,
    rh: number,
    fill: string,
    r = 4,
    stroke?: string,
  ) => (
    <rect
      x={x}
      y={y}
      width={Math.max(1, rw)}
      height={Math.max(1, rh)}
      rx={Math.min(r, rw / 3, rh / 3)}
      fill={fill}
      stroke={stroke}
      strokeWidth={stroke ? 1.8 : undefined}
    />
  );
  let drawing;
  switch (kind) {
    case "화분": {
      // 위에서 본 둥근 화분: 흙과 테두리 위에 작은 잎들이 방사형으로 펼쳐진다.
      const radius = m * 0.43;
      drawing = (
        <g transform={`translate(${w / 2} ${h / 2})`}>
          <circle cy="2" r={radius + 1} fill="#96866d" opacity=".12" />
          <circle
            r={radius}
            fill={color || "#bc9a78"}
            stroke="#a88c6d"
            strokeWidth="1.5"
          />
          <circle r={radius * 0.79} fill="#827759" />
          {[0, 60, 120, 180, 240, 300].map((a, i) => (
            <g key={a} transform={`rotate(${a})`}>
              <path
                d={`M0 0L${m * 0.32} 0`}
                stroke="#688366"
                strokeWidth="1.5"
              />
              <ellipse
                cx={m * 0.22}
                cy="0"
                rx={m * 0.25}
                ry={m * 0.105}
                fill={i % 2 ? "#91a782" : "#b0bc93"}
                stroke="#7e9776"
                strokeWidth=".8"
              />
              <path
                d={`M${m * 0.08} 0H${m * 0.39}`}
                stroke="#d4daba"
                strokeOpacity=".45"
                strokeWidth=".8"
              />
            </g>
          ))}
          <circle r={m * 0.09} fill="#80976d" />
        </g>
      );
      break;
    }
    case "미닫이창": {
      const slide = open ? w * 0.25 : 0;
      drawing = (
        <g data-sliding-window={open ? "open" : "closed"}>
          <rect width={w} height={h} fill="#f5f1e5" />
          <path
            d={`M0 1H${w}M0 ${h - 1}H${w}`}
            stroke="#a6b6ad"
            strokeWidth="2"
          />
          {[0, 1].map((i) => (
            <g
              key={i}
              transform={`translate(${i === 0 ? -slide : slide} 0)`}
              style={{ transition: "transform .25s ease" }}
            >
              <rect
                x={i * w * 0.5 + 1}
                y={i === 0 ? h * 0.15 : h * 0.35}
                width={w * 0.5 - 2}
                height={h * 0.5}
                fill={color || "#bad7d1"}
                stroke="#809e95"
                strokeWidth="1.4"
              />
              <path
                d={`M${i === 0 ? w * 0.43 : w * 0.57} ${i === 0 ? h * 0.26 : h * 0.46}v${h * 0.23}`}
                stroke="#fdfaf0"
                strokeWidth="2"
              />
              <path
                d={`M${i * w * 0.5 + w * 0.12} ${h * 0.35}l${w * 0.14} ${-h * 0.1}`}
                stroke="#ecf8f3"
                strokeWidth="1"
              />
            </g>
          ))}
        </g>
      );
      break;
    }
    case "문":
      drawing = (
        <path
          data-door-threshold="true"
          d={`M1 ${h / 2}H${w - 1}`}
          fill="none"
          stroke={color || "#b5a58b"}
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      );
      break;
    case "벽":
      drawing = <rect width={w} height={h} fill={color || "#b7a98d"} />;
      break;
    case "창문":
      drawing = (
        <>
          <rect width={w} height={h} fill="#fff8eb" />
          <rect
            x="2"
            y="2"
            width={Math.max(1, w - 4)}
            height={Math.max(1, h - 4)}
            fill={color || "#bad4ce"}
          />
          <path d={`M${w / 2} 1v${h - 2}`} stroke="#fff9ed" strokeWidth="2" />
        </>
      );
      break;
    case "러그":
      drawing = (
        <>
          {rounded(1, 1, w - 2, h - 2, color || "#d6c8ac", m * 0.2, "#c4b494")}
          <rect
            x="5"
            y="5"
            width={Math.max(1, w - 10)}
            height={Math.max(1, h - 10)}
            rx={m * 0.17}
            fill="none"
            stroke="#f2e6cb"
            strokeWidth="1.5"
          />
        </>
      );
      break;
    case "소파":
      drawing = (
        <>
          {rounded(0, 0, w, h, color || "#9dae8c", m * 0.14)}
          {rounded(w * 0.32, h * 0.06, w * 0.59, h * 0.42, "#bcc8a9", m * 0.1)}
          {rounded(w * 0.32, h * 0.52, w * 0.59, h * 0.42, "#bcc8a9", m * 0.1)}
          {rounded(
            w * 0.03,
            h * 0.025,
            w * 0.27,
            h * 0.95,
            "#8d9f7d",
            m * 0.12,
          )}
          {rounded(w * 0.38, h * 0.13, w * 0.37, w * 0.4, "#eae1c4", m * 0.07)}
        </>
      );
      break;
    case "침대":
    case "1인 침대":
      drawing = (
        <>
          {rounded(1, 4, w - 2, h - 4, "#c2b6a2", 5)}
          {rounded(w * 0.06, 0, w * 0.88, h * 0.94, wood, 5, edge)}
          {rounded(w * 0.1, h * 0.04, w * 0.8, h * 0.85, "#f0e4ca", 3)}
          <rect
            x={w * 0.1}
            y={h * 0.32}
            width={w * 0.8}
            height={h * 0.57}
            fill="#c7b8ac"
          />
          <rect
            x={w * 0.1}
            y={h * 0.29}
            width={w * 0.8}
            height={Math.min(13, h * 0.07)}
            fill="#d8cbb5"
          />
          {rounded(
            w * (kind === "1인 침대" ? 0.2 : 0.15),
            h * 0.08,
            w * (kind === "1인 침대" ? 0.6 : 0.3),
            Math.min(h * 0.18, w * 0.23),
            "#fffaf1",
            6,
            "#dfd3bb",
          )}
          {kind === "침대" &&
            rounded(
              w * 0.55,
              h * 0.08,
              w * 0.3,
              Math.min(h * 0.18, w * 0.23),
              "#fffaf1",
              6,
              "#dfd3bb",
            )}
        </>
      );
      break;
    case "테이블":
    case "교탁":
      drawing = (
        <>
          {rounded(
            1,
            1,
            w - 2,
            h - 2,
            wood,
            kind === "테이블" ? m * 0.28 : 4,
            edge,
          )}
          <rect
            x={w * 0.2}
            y={h * 0.23}
            width={m * 0.25}
            height={m * 0.4}
            fill={cream}
            transform={`rotate(-9 ${w * 0.3} ${h * 0.4})`}
          />
          <circle cx={w * 0.73} cy={h * 0.45} r={m * 0.09} fill="#fff4db" />
          <circle cx={w * 0.73} cy={h * 0.45} r={m * 0.055} fill="#abb995" />
        </>
      );
      break;
    case "책상":
    case "강의책상": {
      const monitorW = Math.min(w * 0.37, h * 0.65),
        monitorH = monitorW * 0.6;
      drawing = (
        <>
          {rounded(1, 1, w - 2, h - 2, wood, 4, edge)}
          {kind === "책상" ? (
            <>
              {rounded(
                w * 0.32,
                h * 0.16,
                monitorW,
                monitorH,
                mint,
                2,
                "#6c877b",
              )}
              <path
                d={`M${w * 0.32 + monitorW / 2} ${h * 0.16 + monitorH}v${monitorH * 0.2}m-${monitorW * 0.2} 0h${monitorW * 0.4}`}
                stroke="#718779"
                strokeWidth="2"
              />
              {rounded(
                w * 0.29,
                h * 0.73,
                Math.min(w * 0.35, h * 0.5),
                Math.min(5, h * 0.1),
                "#7d8b77",
                1,
              )}
              <circle
                cx={w * 0.13}
                cy={h * 0.7}
                r={Math.min(6, m * 0.09)}
                fill="#fff4d3"
                stroke="#b3a078"
              />
            </>
          ) : (
            <>
              <rect
                x={w * 0.3}
                y={h * 0.2}
                width={m * 0.6}
                height={h * 0.55}
                fill="#b7c2ac"
              />
              <rect
                x={w * 0.3}
                y={h * 0.2}
                width={m * 0.3}
                height={h * 0.55}
                fill={cream}
              />
            </>
          )}
          <rect
            x={w * 0.79}
            y={h * 0.48}
            width={Math.min(w * 0.13, h * 0.2)}
            height={h * 0.4}
            fill={cream}
            transform={`rotate(-8 ${w * 0.84} ${h * 0.65})`}
          />
        </>
      );
      break;
    }
    case "의자":
      drawing = (
        <>
          {rounded(
            w * 0.1,
            h * 0.1,
            w * 0.8,
            h * 0.86,
            color || "#8da397",
            7,
            "#6b8578",
          )}
          {rounded(
            w * 0.05,
            0,
            w * 0.9,
            Math.min(h * 0.25, w * 0.25),
            color || "#96aa9b",
            4,
            "#6b8578",
          )}
        </>
      );
      break;
    case "싱크대":
      drawing = (
        <>
          {rounded(1, 1, w - 2, h - 2, "#dfd5b8", 3, edge)}
          {rounded(
            w * 0.12,
            h * 0.1,
            w * 0.76,
            h * 0.3,
            "#bccdc6",
            6,
            "#94ab9f",
          )}
          <path
            d={`M${w * 0.47} ${h * 0.1}v-8h12`}
            stroke="#879f94"
            strokeWidth="2.5"
            fill="none"
          />
          <rect
            x={w * 0.1}
            y={h * 0.57}
            width={w * 0.8}
            height={h * 0.36}
            fill="#899078"
          />
          {[0.31, 0.7].flatMap((x) =>
            [0.68, 0.83].map((y) => (
              <circle
                key={`${x}-${y}`}
                cx={w * x}
                cy={h * y}
                r={Math.min(w * 0.14, h * 0.065)}
                fill="none"
                stroke="#e1dec2"
                strokeWidth="1.8"
              />
            )),
          )}
        </>
      );
      break;
    case "책장":
      drawing = (
        <>
          <rect
            x="1"
            y="1"
            width={w - 2}
            height={h - 2}
            fill={wood}
            stroke={edge}
            strokeWidth="2"
          />
          {Array.from({ length: Math.max(1, Math.floor(w / 13)) }, (_, i) => (
            <rect
              key={i}
              x={5 + i * 13}
              y={h * 0.15}
              width="9"
              height={h * 0.7}
              fill={["#afbea6", "#d0b59c", "#b9c2a6"][i % 3]}
            />
          ))}
        </>
      );
      break;
    case "칠판":
      drawing = (
        <>
          <rect width={w} height={h} fill={wood} />
          <rect
            x="4"
            y="3"
            width={w - 8}
            height={h - 9}
            fill={color || "#748d7c"}
          />
          <path
            d={`M${w * 0.1} ${h * 0.3}h${w * 0.26}m-${w * 0.26} ${h * 0.2}h${w * 0.16}M${w * 0.55} ${h * 0.3}h${w * 0.23}`}
            stroke="#d6dfc6"
            strokeWidth="1.5"
          />
          <path
            d={`M${w * 0.85} ${h - 3}h6m6 0h6`}
            stroke={cream}
            strokeWidth="3"
          />
        </>
      );
      break;
    case "벤치":
      drawing = (
        <>
          <path
            d={`M${w * 0.12} 0v${h}M${w * 0.88} 0v${h}`}
            stroke="#8e9a7c"
            strokeWidth="3"
          />
          {rounded(1, h * 0.16, w - 2, h * 0.7, wood, 4, edge)}
          {[0.34, 0.53, 0.72].map((y) => (
            <path
              key={y}
              d={`M6 ${h * y}H${w - 6}`}
              stroke="#e5ca9b"
              strokeWidth="2"
            />
          ))}
        </>
      );
      break;
    case "수납장":
      drawing = (
        <>
          <rect
            x="1"
            y="1"
            width={w - 2}
            height={h - 2}
            fill={wood}
            stroke={edge}
            strokeWidth="2"
          />
          {[1 / 3, 2 / 3].map((y) => (
            <path
              key={y}
              d={`M2 ${h * y}H${w - 2}`}
              stroke={edge}
              strokeWidth="1"
            />
          ))}
          {[0.17, 0.5, 0.83].map((y) => (
            <circle key={y} cx={w * 0.83} cy={h * y} r="1.5" fill="#a08a69" />
          ))}
        </>
      );
      break;
    case "텔레비전":
      drawing = (
        <>
          {rounded(0, 0, w, h, wood, 4)}
          {rounded(w * 0.18, h * 0.08, w * 0.66, h * 0.84, "#728d83", 3)}
          <path
            d={`M${w * 0.38} ${h * 0.14}v${h * 0.68}`}
            stroke="#bfd2bb"
            strokeWidth="2"
          />
        </>
      );
      break;
    case "욕조":
      drawing = (
        <>
          {rounded(0, 0, w, h, "#e0deca", 2, "#b7b99f")}
          {rounded(
            w * 0.12,
            h * 0.05,
            w * 0.76,
            h * 0.9,
            "#f4f5e9",
            Math.min(w * 0.3, 20),
            "#c0cbb8",
          )}
          {rounded(
            w * 0.22,
            h * 0.15,
            w * 0.56,
            h * 0.68,
            "#c9dfd7",
            Math.min(w * 0.24, 15),
          )}
        </>
      );
      break;
    case "변기":
      drawing = (
        <>
          {rounded(w * 0.18, 0, w * 0.64, h * 0.28, "#f4f3e7", 3, "#c5cdbb")}
          <ellipse
            cx={w * 0.5}
            cy={h * 0.62}
            rx={w * 0.38}
            ry={h * 0.36}
            fill="#f7f6eb"
            stroke="#c5cdbb"
            strokeWidth="1.5"
          />
          <ellipse
            cx={w * 0.5}
            cy={h * 0.62}
            rx={w * 0.24}
            ry={h * 0.25}
            fill="#d6e2d6"
          />
        </>
      );
      break;
    case "세면대":
      drawing = (
        <>
          <rect width={w} height={h} fill="#d5ccb3" />
          <ellipse
            cx={w * 0.5}
            cy={h * 0.52}
            rx={w * 0.37}
            ry={h * 0.31}
            fill="#f3f6e9"
            stroke="#b6c7b6"
            strokeWidth="1.2"
          />
          <path
            d={`M${w * 0.5} 1v${h * 0.25}`}
            stroke="#9fb6ab"
            strokeWidth="2"
          />
        </>
      );
      break;
    case "냉장고":
      drawing = (
        <>
          {rounded(1, 1, w - 2, h - 2, color || "#cbd3c0", 5, "#a8b59e")}
          <path
            d={`M3 ${h * 0.38}H${w - 3}M${w * 0.85} ${h * 0.12}v${h * 0.15}M${w * 0.85} ${h * 0.52}v${h * 0.3}`}
            stroke="#a0ad98"
            strokeWidth="2"
          />
        </>
      );
      break;
    case "카페":
      drawing = (
        <>
          {rounded(w * 0.03, h * 0.15, w * 0.94, h * 0.72, wood, 4)}
          <rect width={w} height={h * 0.24} fill="#faf0d4" />
          {Array.from({ length: 7 }, (_, i) => (
            <rect
              key={i}
              x={(i * w) / 7}
              width={w / 14}
              height={h * 0.24}
              fill={color || "#bb8f79"}
            />
          ))}
          <rect
            x={w * 0.08}
            y={h * 0.4}
            width={w * 0.84}
            height={h * 0.28}
            fill="#d2b38b"
          />
        </>
      );
      break;
    case "메모":
      drawing = (
        <>
          {rounded(1, 1, w - 2, h - 2, color || "#f2e5b9", 3, "#d0bf92")}
          <path
            d={`M${w * 0.12} ${h * 0.25}h${w * 0.72}M${w * 0.12} ${h * 0.42}h${w * 0.72}`}
            stroke="#c4b58c"
            strokeWidth="1"
          />
        </>
      );
      break;
    default:
      drawing = (
        <svg
          width={w}
          height={h}
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid meet"
        >
          <LegacyFurnitureArt kind={kind} color={color} />
        </svg>
      );
  }
  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="xMidYMid meet"
      overflow="visible"
      aria-hidden="true"
    >
      {drawing}
    </svg>
  );
}
