import type { FurnitureKind } from "../types";
// 100×100의 독립적인 SVG 요소. 전체 도면을 확대해도 선명하고 각각 크기·방향을 바꿀 수 있다.
export function FurnitureArt({
  kind,
  color,
}: {
  kind: FurnitureKind;
  color?: string;
}) {
  const wood = color || "#c5a77d",
    edge = "#ad9067",
    mint = "#8fa79a",
    cream = "#fff8e7";
  const book = (x: number, y: number, c = "#b5c1aa") => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width="8" height="70" fill={c} />
      <path d={`M${x + 2} ${y + 5}v50`} stroke="#e6e0c3" strokeWidth="1" />
    </g>
  );
  switch (kind) {
    case "벽":
      return <rect width="100" height="100" fill={color || "#b7a98d"} />;
    case "창문":
      return (
        <>
          <rect width="100" height="100" fill="#faf6e9" />
          <rect x="2" y="17" width="96" height="66" fill={color || "#b8d4cf"} />
          <path d="M50 14v72" stroke="#fff9ec" strokeWidth="3" />
        </>
      );
    case "문":
      return (
        <>
          <rect x="0" y="89" width="100" height="11" fill="#eee2c8" />
          <path
            d="M2 97V3 Q95 3 98 97Z"
            fill="none"
            stroke={color || "#b4a486"}
            strokeWidth="2"
          />
          <path d="M2 3v94h96" fill="none" stroke="#b4a486" strokeWidth="2" />
        </>
      );
    case "러그":
      return (
        <>
          <rect
            x="1"
            y="1"
            width="98"
            height="98"
            rx="20"
            fill={color || "#d6c8ac"}
            stroke="#c2b494"
            strokeWidth="1"
          />
          <rect
            x="4"
            y="4"
            width="92"
            height="92"
            rx="18"
            fill="none"
            stroke="#eee2c7"
            strokeWidth="1.5"
          />
        </>
      );
    case "소파":
      return (
        <>
          <rect
            x="2"
            y="1"
            width="96"
            height="98"
            rx="12"
            fill={color || "#9dae8c"}
          />
          <rect x="13" y="8" width="74" height="39" rx="10" fill="#b9c6a7" />
          <rect x="13" y="51" width="74" height="40" rx="10" fill="#b9c6a7" />
          <rect
            x="23"
            y="16"
            width="34"
            height="24"
            rx="5"
            fill="#e9e0c1"
            transform="rotate(8 40 28)"
          />
          <path d="M8 10v80M92 10v80" stroke="#899e7d" strokeWidth="2" />
        </>
      );
    case "침대":
      return (
        <>
          <rect x="0" y="2" width="100" height="98" rx="5" fill="#c2b6a2" />
          <rect
            x="7"
            y="0"
            width="86"
            height="91"
            rx="4"
            fill={wood}
            stroke={edge}
            strokeWidth="2"
          />
          <rect x="11" y="4" width="78" height="83" rx="3" fill="#f0e4ca" />
          <rect x="11" y="31" width="78" height="56" fill="#c4b8ad" />
          <rect x="11" y="29" width="78" height="8" fill="#d5cab4" />
          <rect
            x="15"
            y="8"
            width="31"
            height="20"
            rx="6"
            fill="#fffaf1"
            stroke="#ded2b9"
            strokeWidth=".6"
          />
          <rect
            x="53"
            y="8"
            width="31"
            height="20"
            rx="6"
            fill="#fffaf1"
            stroke="#ded2b9"
            strokeWidth=".6"
          />
        </>
      );
    case "테이블":
      return (
        <>
          <rect
            x="3"
            y="3"
            width="94"
            height="94"
            rx="30"
            fill={wood}
            stroke={edge}
            strokeWidth="2"
          />
          <rect
            x="20"
            y="22"
            width="23"
            height="43"
            fill={cream}
            transform="rotate(-12 30 43)"
          />
          <circle cx="71" cy="42" r="10" fill="#fdf5dc" />
          <circle cx="71" cy="42" r="6" fill="#a4b591" />
        </>
      );
    case "교탁":
      return (
        <>
          <rect
            x="1"
            y="1"
            width="98"
            height="98"
            rx="4"
            fill={wood}
            stroke={edge}
            strokeWidth="3"
          />
          <rect x="20" y="22" width="22" height="52" fill={cream} />
          <circle cx="78" cy="48" r="10" fill="#edd3aa" />
        </>
      );
    case "책상":
      return (
        <>
          <rect
            x="1"
            y="1"
            width="98"
            height="98"
            rx="4"
            fill={wood}
            stroke={edge}
            strokeWidth="3"
          />
          <rect
            x="31"
            y="14"
            width="32"
            height="33"
            rx="2"
            fill={mint}
            stroke="#68877a"
            strokeWidth="3"
          />
          <path d="M46 49v7M38 58h21" stroke="#728678" strokeWidth="5" />
          <rect x="24" y="68" width="35" height="7" rx="1" fill="#7b8b76" />
          <rect
            x="74"
            y="48"
            width="15"
            height="42"
            fill={cream}
            transform="rotate(-10 80 70)"
          />
          <path d="M77 55l8-1m-8 8l8-1m-7 8l8-1" stroke="#c4b99f" />
          <circle cx="15" cy="68" r="6" fill="#fff4d4" stroke="#b3a078" />
        </>
      );
    case "강의책상":
      return (
        <>
          <rect
            x="1"
            y="1"
            width="98"
            height="98"
            rx="5"
            fill={wood}
            stroke={edge}
            strokeWidth="3"
          />
          <rect x="30" y="20" width="40" height="54" fill="#b7c2ac" />
          <rect x="30" y="20" width="20" height="54" fill={cream} />
          <path d="M81 24l-2 45" stroke="#958c6e" strokeWidth="3" />
        </>
      );
    case "의자":
      return (
        <>
          <rect
            x="8"
            y="8"
            width="84"
            height="88"
            rx="20"
            fill={color || "#8da397"}
            stroke="#698277"
            strokeWidth="3"
          />
          <rect
            x="3"
            y="1"
            width="94"
            height="25"
            rx="8"
            fill={color || "#95aa9b"}
            stroke="#698277"
            strokeWidth="2"
          />
          <path d="M16 84h68" stroke="#698277" strokeWidth="2" />
        </>
      );
    case "싱크대":
      return (
        <>
          <rect
            x="1"
            y="1"
            width="98"
            height="98"
            rx="3"
            fill="#dfd5b8"
            stroke={edge}
            strokeWidth="4"
          />
          <rect x="8" y="4" width="84" height="92" fill="#ece6d1" />
          <rect
            x="16"
            y="11"
            width="68"
            height="29"
            rx="8"
            fill="#bccdc6"
            stroke="#91a99f"
            strokeWidth="3"
          />
          <path d="M46 11V5h18" fill="none" stroke="#879e94" strokeWidth="3" />
          <rect x="10" y="56" width="80" height="37" fill="#889078" />
          {[28, 69].flatMap((x) =>
            [65, 83].map((y) => (
              <circle
                key={`${x}-${y}`}
                cx={x}
                cy={y}
                r="8"
                fill="none"
                stroke="#e1dec2"
                strokeWidth="2"
              />
            )),
          )}
        </>
      );
    case "냉장고":
      return (
        <>
          <rect
            x="2"
            y="1"
            width="96"
            height="98"
            rx="6"
            fill={color || "#cbd3c0"}
            stroke="#a8b59e"
            strokeWidth="3"
          />
          <path
            d="M5 38h90M85 13v15m0 25v28"
            stroke="#a0ad98"
            strokeWidth="3"
          />
        </>
      );
    case "화분":
    case "나무":
      return (
        <>
          <ellipse
            cx="51"
            cy="57"
            rx="34"
            ry="32"
            fill="#a9bb8d"
            opacity=".35"
          />
          {[0, 60, 120, 180, 240, 300].map((angle, i) => (
            <ellipse
              key={angle}
              cx="50"
              cy="30"
              rx="17"
              ry="28"
              fill={color || ["#8da97f", "#9db387", "#789970"][i % 3]}
              stroke="#78936c"
              strokeWidth="1"
              transform={`rotate(${angle} 50 50)`}
            />
          ))}
          <ellipse
            cx="43"
            cy="46"
            rx="20"
            ry="13"
            fill="#b0bf92"
            transform="rotate(25 43 46)"
          />
          <ellipse cx="49" cy="47" rx="6" ry="5" fill="#c7d1a9" />
        </>
      );
    case "책장":
      return (
        <>
          <rect
            width="100"
            height="100"
            fill={wood}
            stroke={edge}
            strokeWidth="3"
          />
          {[5, 16, 27, 38, 49, 60, 71, 82].map((x, i) =>
            book(x, 15, ["#a9b9a5", "#c4c3a4", "#d4b79d"][i % 3]),
          )}
        </>
      );
    case "수납장":
      return (
        <>
          <rect
            x="1"
            y="1"
            width="98"
            height="98"
            fill={wood}
            stroke={edge}
            strokeWidth="3"
          />
          <path d="M2 33h96M2 66h96" stroke={edge} strokeWidth="1" />
          <circle cx="83" cy="18" r="2" fill="#a08b69" />
          <circle cx="83" cy="51" r="2" fill="#a08b69" />
          <circle cx="83" cy="85" r="2" fill="#a08b69" />
        </>
      );
    case "욕조":
      return (
        <>
          <rect
            width="100"
            height="100"
            fill="#e1dfcc"
            stroke="#b7b99f"
            strokeWidth="3"
          />
          <rect
            x="12"
            y="5"
            width="76"
            height="90"
            rx="25"
            fill="#f3f5e9"
            stroke="#c1cbb7"
            strokeWidth="3"
          />
          <rect x="23" y="15" width="54" height="69" rx="20" fill="#c9dfd7" />
        </>
      );
    case "변기":
      return (
        <>
          <rect
            x="17"
            y="0"
            width="66"
            height="32"
            rx="4"
            fill="#f4f3e7"
            stroke="#c5cdbb"
            strokeWidth="2"
          />
          <ellipse
            cx="50"
            cy="61"
            rx="39"
            ry="38"
            fill="#f7f6eb"
            stroke="#c5cdbb"
            strokeWidth="2"
          />
          <ellipse cx="50" cy="61" rx="25" ry="27" fill="#d6e2d6" />
        </>
      );
    case "세면대":
      return (
        <>
          <rect x="1" y="1" width="98" height="98" fill="#d5ccb3" />
          <ellipse
            cx="50"
            cy="51"
            rx="38"
            ry="31"
            fill="#f3f6e9"
            stroke="#b6c7b6"
            strokeWidth="2"
          />
          <path d="M50 5v22" stroke="#9fb6ab" strokeWidth="4" />
        </>
      );
    case "텔레비전":
      return (
        <>
          <rect width="100" height="100" rx="5" fill={wood} />
          <rect x="20" y="9" width="67" height="82" rx="5" fill="#728d83" />
          <path d="M40 16v69" stroke="#bfd2bb" strokeWidth="6" />
        </>
      );
    case "칠판":
      return (
        <>
          <rect width="100" height="100" rx="1" fill={wood} />
          <rect x="2" y="7" width="96" height="78" fill={color || "#748d7c"} />
          <path
            d="M9 31h30m-30 20h16m28-20h26"
            stroke="#d5dfc4"
            strokeWidth="3"
          />
          <path d="M82 93h3m3 0h3" stroke={cream} strokeWidth="6" />
        </>
      );
    case "시계":
      return (
        <>
          <circle
            cx="50"
            cy="50"
            r="46"
            fill={cream}
            stroke="#b3a17e"
            strokeWidth="6"
          />
          <path
            d="M50 20v32l20 12"
            fill="none"
            stroke="#a59a7b"
            strokeWidth="6"
            strokeLinecap="round"
          />
        </>
      );
    case "벤치":
      return (
        <>
          <path d="M12 0v95m76-95v95" stroke="#899779" strokeWidth="5" />
          <rect
            x="1"
            y="14"
            width="98"
            height="72"
            rx="7"
            fill={wood}
            stroke={edge}
            strokeWidth="3"
          />
          <path d="M8 33h84M8 53h84M8 72h84" stroke="#e7ce9f" strokeWidth="4" />
        </>
      );
    case "분수":
      return (
        <>
          <circle cx="50" cy="50" r="49" fill="#f1ecd8" />
          <circle cx="50" cy="50" r="42" fill="#bdc6a9" />
          <circle cx="50" cy="50" r="35" fill={color || "#a9cccb"} />
          <circle
            cx="50"
            cy="50"
            r="24"
            fill="none"
            stroke="#d7e9d8"
            strokeWidth="1.5"
          />
          <circle cx="50" cy="51" r="9" fill="#d8eadb" />
          <path
            d="M38 50q12-34 24 0"
            stroke="#edf4e0"
            strokeWidth="2"
            fill="none"
          />
        </>
      );
    case "카페":
      return (
        <>
          <rect x="3" y="15" width="94" height="65" rx="4" fill={wood} />
          <rect width="100" height="24" fill="#faf0d4" />
          {[0, 17, 34, 51, 68, 85].map((x) => (
            <rect
              key={x}
              x={x}
              width="8"
              height="24"
              fill={color || "#bb8f79"}
            />
          ))}
          <rect x="8" y="37" width="84" height="30" fill="#d2b38b" />
        </>
      );
    case "조명":
      return (
        <>
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="#d8c692"
            stroke="#bfa976"
            strokeWidth="8"
          />
          <circle cx="50" cy="50" r="19" fill="#fffae1" />
        </>
      );
    default:
      return (
        <>
          <rect
            x="1"
            y="1"
            width="98"
            height="98"
            rx="3"
            fill={color || "#f2e5b9"}
            stroke="#d0bf92"
            strokeWidth="2"
          />
          <path
            d="M20 24h60M20 44h60M20 64h40"
            stroke="#bcac7f"
            strokeWidth="2"
          />
        </>
      );
  }
}
