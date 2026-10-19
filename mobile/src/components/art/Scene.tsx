import { View } from "react-native";
import Svg, { Circle, Defs, Ellipse, G, Line, LinearGradient, Path, RadialGradient, Rect, Stop } from "react-native-svg";
import { decorative, seeded } from "./seeded";

export type SceneKind = "rain" | "fire" | "sea" | "rain-sea";

const W = 160;
const H = 110;

const DROPS = (() => {
  const rnd = seeded(9);
  return Array.from({ length: 26 }, () => ({ x: rnd() * (W + 20), y: 18 + rnd() * 80, len: 6 + rnd() * 6 }));
})();
const STARS = (() => {
  const rnd = seeded(3);
  return Array.from({ length: 10 }, () => ({ x: rnd() * W, y: rnd() * 40, r: 0.5 + rnd() * 0.8 }));
})();

function Rain() {
  return (
    <G>
      <Ellipse cx={40} cy={16} rx={44} ry={14} fill="#2b3a58" />
      <Ellipse cx={110} cy={12} rx={56} ry={16} fill="#33446a" />
      {DROPS.map((d, i) => (
        <Line key={i} x1={d.x} y1={d.y} x2={d.x - 3} y2={d.y + d.len} stroke="#a9c4d9" strokeOpacity={0.55} strokeWidth={1.2} strokeLinecap="round" />
      ))}
    </G>
  );
}

function Sea() {
  return (
    <G>
      <Rect y={70} width={W} height={H - 70} fill="#1a2c4f" />
      <Rect x={112} y={72} width={14} height={30} fill="#f1f5f9" opacity={0.18} rx={7} />
      {[78, 88, 99].map((y, i) => (
        <Path key={y} d={`M0 ${y} Q20 ${y - 4} 40 ${y} T80 ${y} T120 ${y} T160 ${y}`} stroke="#7fb5a8" strokeOpacity={0.5 - i * 0.1} strokeWidth={1.5} fill="none" />
      ))}
    </G>
  );
}

function Fire() {
  return (
    <G>
      <Path d={`M0 88 C40 76 90 80 ${W} 86 L${W} ${H} L0 ${H} Z`} fill="#141c30" />
      <Circle cx={80} cy={86} r={40} fill="url(#ember)" />
      <Rect x={60} y={90} width={40} height={6} rx={3} fill="#6b4a2f" transform="rotate(-12 80 93)" />
      <Rect x={60} y={90} width={40} height={6} rx={3} fill="#5a3d27" transform="rotate(12 80 93)" />
      <Path d="M80 58 C90 70 94 78 88 88 C84 94 76 94 72 88 C66 78 72 70 80 58 Z" fill="#d9a86c" />
      <Path d="M80 70 C85 77 86 82 83 87 C81 90 79 90 77 87 C74 82 76 77 80 70 Z" fill="#f6d29b" />
    </G>
  );
}

/** A small night picture for a sound mix (rain, fire, sea, rain at sea). Static: it sits on a card. */
export function Scene({ kind, height = H }: { kind: SceneKind; height?: number }) {
  return (
    <View testID={`scene-${kind}`} {...decorative} style={{ height, overflow: "hidden" }}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id="scene-sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#0b1224" />
            <Stop offset="1" stopColor={kind === "fire" ? "#3a2d3f" : "#22345a"} />
          </LinearGradient>
          <RadialGradient id="ember" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#d9a86c" stopOpacity={0.55} />
            <Stop offset="1" stopColor="#d9a86c" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width={W} height={H} fill="url(#scene-sky)" />
        {kind !== "rain" && kind !== "rain-sea" && STARS.map((s, i) => <Circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#f1f5f9" opacity={0.6} />)}
        {kind === "sea" && <Circle cx={119} cy={30} r={11} fill="#f1f5f9" />}
        {(kind === "sea" || kind === "rain-sea") && <Sea />}
        {kind === "fire" && <Fire />}
        {(kind === "rain" || kind === "rain-sea") && <Rain />}
        {kind === "rain" && <Path d={`M0 94 C50 84 100 90 ${W} 92 L${W} ${H} L0 ${H} Z`} fill="#141c30" />}
      </Svg>
    </View>
  );
}
