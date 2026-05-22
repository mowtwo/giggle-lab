import type { SVGProps } from "react";

export type TanukiAvatarVariant = "talk" | "hello" | "bye";

export type TanukiAvatarProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  variant?: TanukiAvatarVariant;
  size?: number | string;
};

const labels: Record<TanukiAvatarVariant, string> = {
  talk: "Talking tanuki avatar",
  hello: "Waving hello tanuki avatar",
  bye: "Waving goodbye tanuki avatar",
};

export function TanukiAvatar({
  variant = "hello",
  size = 220,
  className,
  "aria-label": ariaLabel,
  ...props
}: TanukiAvatarProps) {
  const isTalk = variant === "talk";
  const isHello = variant === "hello";
  const isBye = variant === "bye";

  return (
    <svg
      aria-label={ariaLabel ?? labels[variant]}
      className={className}
      role="img"
      viewBox="0 0 240 240"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <style>
        {`
          .tanuki-bob {
            animation: tanuki-bob 2.4s ease-in-out infinite;
            transform-origin: 120px 132px;
          }

          .tanuki-ear {
            animation: tanuki-ear-twitch 3.2s ease-in-out infinite;
            transform-box: fill-box;
          }

          .tanuki-left-ear {
            transform-origin: 72px 68px;
          }

          .tanuki-right-ear {
            transform-origin: 168px 68px;
            animation-delay: 0.25s;
          }

          .tanuki-eye {
            animation: tanuki-blink 4.8s ease-in-out infinite;
            transform-box: fill-box;
            transform-origin: center;
          }

          .tanuki-mouth-talk {
            animation: tanuki-talk 0.46s steps(2, end) infinite;
            transform-origin: 120px 139px;
          }

          .tanuki-mouth-smile {
            animation: tanuki-smile 2.4s ease-in-out infinite;
            transform-origin: 120px 140px;
          }

          .tanuki-hand-wave {
            animation: tanuki-wave 0.82s ease-in-out infinite;
            transform-box: fill-box;
            transform-origin: 176px 122px;
          }

          .tanuki-hand-bye {
            animation: tanuki-bye 0.72s ease-in-out infinite;
            transform-box: fill-box;
            transform-origin: 176px 122px;
          }

          .tanuki-speech-dot {
            animation: tanuki-speech 1s ease-in-out infinite;
          }

          .tanuki-speech-dot:nth-of-type(2) {
            animation-delay: 0.15s;
          }

          .tanuki-speech-dot:nth-of-type(3) {
            animation-delay: 0.3s;
          }

          .tanuki-leaf {
            animation: tanuki-leaf-sway 1.7s ease-in-out infinite;
            transform-origin: 65px 184px;
          }

          .tanuki-bye-mark {
            animation: tanuki-fade-drift 1.2s ease-in-out infinite;
          }

          @keyframes tanuki-bob {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-4px); }
          }

          @keyframes tanuki-ear-twitch {
            0%, 78%, 100% { transform: rotate(0deg); }
            83% { transform: rotate(-7deg); }
            88% { transform: rotate(4deg); }
          }

          @keyframes tanuki-blink {
            0%, 92%, 100% { transform: scaleY(1); }
            95% { transform: scaleY(0.12); }
          }

          @keyframes tanuki-talk {
            0% { transform: scaleY(0.45); }
            100% { transform: scaleY(1); }
          }

          @keyframes tanuki-smile {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(1px); }
          }

          @keyframes tanuki-wave {
            0%, 100% { transform: rotate(-8deg); }
            50% { transform: rotate(18deg); }
          }

          @keyframes tanuki-bye {
            0%, 100% { transform: rotate(14deg) translateY(0); }
            50% { transform: rotate(-18deg) translateY(-2px); }
          }

          @keyframes tanuki-speech {
            0%, 100% { opacity: 0.45; transform: translateY(0); }
            50% { opacity: 1; transform: translateY(-3px); }
          }

          @keyframes tanuki-leaf-sway {
            0%, 100% { transform: rotate(-5deg); }
            50% { transform: rotate(7deg); }
          }

          @keyframes tanuki-fade-drift {
            0% { opacity: 0; transform: translateY(6px); }
            25%, 70% { opacity: 1; }
            100% { opacity: 0; transform: translateY(-4px); }
          }

          @media (prefers-reduced-motion: reduce) {
            .tanuki-bob,
            .tanuki-ear,
            .tanuki-eye,
            .tanuki-mouth-talk,
            .tanuki-mouth-smile,
            .tanuki-hand-wave,
            .tanuki-hand-bye,
            .tanuki-speech-dot,
            .tanuki-leaf,
            .tanuki-bye-mark {
              animation: none;
            }
          }
        `}
      </style>

      <circle cx="120" cy="125" r="98" fill="#f8dfad" opacity="0.18" />
      <ellipse cx="120" cy="210" rx="68" ry="13" fill="#8d6844" opacity="0.16" />

      <g className="tanuki-bob">
        <path
          d="M57 143c-12 14-22 37-21 57 1 14 13 19 27 13 12-5 20-17 24-30"
          fill="#6f4b2f"
        />
        <path
          d="M183 143c12 14 22 37 21 57-1 14-13 19-27 13-12-5-20-17-24-30"
          fill="#6f4b2f"
        />
        <ellipse cx="120" cy="150" rx="62" ry="71" fill="#9f7047" />
        <ellipse cx="120" cy="165" rx="42" ry="47" fill="#f1c37f" />

        <g className="tanuki-ear tanuki-left-ear">
          <path d="M64 70 45 25l47 23Z" fill="#734b2d" />
          <path d="M64 61 55 39l24 12Z" fill="#efbd86" />
        </g>
        <g className="tanuki-ear tanuki-right-ear">
          <path d="m176 70 19-45-47 23Z" fill="#734b2d" />
          <path d="m176 61 9-22-24 12Z" fill="#efbd86" />
        </g>

        <circle cx="120" cy="88" r="55" fill="#a9784e" />
        <path
          d="M78 80c11-24 28-36 42-36s31 12 42 36c-11-10-25-16-42-16s-31 6-42 16Z"
          fill="#d9a268"
        />
        <ellipse cx="91" cy="100" rx="28" ry="34" fill="#5b3928" />
        <ellipse cx="149" cy="100" rx="28" ry="34" fill="#5b3928" />
        <ellipse cx="91" cy="103" rx="18" ry="25" fill="#efe1c9" />
        <ellipse cx="149" cy="103" rx="18" ry="25" fill="#efe1c9" />
        <circle className="tanuki-eye" cx="92" cy="104" r="7" fill="#2c211c" />
        <circle className="tanuki-eye" cx="148" cy="104" r="7" fill="#2c211c" />
        <circle cx="95" cy="101" r="2" fill="#fff8ed" />
        <circle cx="151" cy="101" r="2" fill="#fff8ed" />

        <ellipse cx="120" cy="122" rx="24" ry="19" fill="#f1c37f" />
        <path d="M111 121c2-6 16-6 18 0-3 5-15 5-18 0Z" fill="#3a2820" />
        {isTalk ? (
          <ellipse
            className="tanuki-mouth-talk"
            cx="120"
            cy="140"
            rx="9"
            ry="12"
            fill="#3a2820"
          />
        ) : (
          <path
            className="tanuki-mouth-smile"
            d="M108 137c4 8 20 8 24 0"
            fill="none"
            stroke="#3a2820"
            strokeLinecap="round"
            strokeWidth="5"
          />
        )}
        <circle cx="83" cy="129" r="8" fill="#e89a7f" opacity="0.55" />
        <circle cx="157" cy="129" r="8" fill="#e89a7f" opacity="0.55" />

        <path
          d="M82 156c-20 8-28 26-23 38 5 13 25 11 36-7"
          fill="#8c6040"
        />
        <g className={isHello ? "tanuki-hand-wave" : isBye ? "tanuki-hand-bye" : ""}>
          <path
            d="M158 156c18-14 28-32 25-45-2-10-14-10-20-1-5 8-9 22-14 35"
            fill="#8c6040"
          />
          <ellipse cx="180" cy="106" rx="14" ry="17" fill="#9f7047" />
          <path
            d="M174 96c-3-8-2-16 2-19m8 21c3-8 7-14 12-17"
            fill="none"
            stroke="#6c452d"
            strokeLinecap="round"
            strokeWidth="4"
          />
        </g>

        <path d="M105 161h30l-4 31h-22Z" fill="#4a8a65" />
        <path
          d="M99 161h42l-6-14c-12 6-20 6-30 0Z"
          fill="#65a877"
        />
        <path
          d="M111 163c6 6 12 6 18 0"
          fill="none"
          stroke="#f7e8b0"
          strokeLinecap="round"
          strokeWidth="3"
        />
        <circle cx="120" cy="176" r="4" fill="#f7e8b0" />
      </g>

      {isTalk ? (
        <g>
          <path
            d="M160 35h39c9 0 16 7 16 16v20c0 9-7 16-16 16h-19l-16 13 4-13h-8c-9 0-16-7-16-16V51c0-9 7-16 16-16Z"
            fill="#fff8e6"
            stroke="#8b6846"
            strokeWidth="5"
          />
          <circle className="tanuki-speech-dot" cx="173" cy="62" r="4" fill="#6b4b33" />
          <circle className="tanuki-speech-dot" cx="188" cy="62" r="4" fill="#6b4b33" />
          <circle className="tanuki-speech-dot" cx="203" cy="62" r="4" fill="#6b4b33" />
        </g>
      ) : null}

      {isHello ? (
        <g>
          <path
            d="M42 47c8-10 20-15 33-13"
            fill="none"
            stroke="#5c9d7d"
            strokeLinecap="round"
            strokeWidth="6"
          />
          <path
            d="M38 67c10-9 23-13 36-9"
            fill="none"
            stroke="#5c9d7d"
            strokeLinecap="round"
            strokeWidth="6"
            opacity="0.72"
          />
        </g>
      ) : null}

      {isBye ? (
        <g>
          <path
            className="tanuki-leaf"
            d="M54 182c17-14 33-12 44 1-15 11-30 11-44-1Z"
            fill="#6fb66b"
          />
          <path
            className="tanuki-leaf"
            d="M64 183c10-2 18-2 27 0"
            fill="none"
            stroke="#3f7b45"
            strokeLinecap="round"
            strokeWidth="3"
          />
          <path
            className="tanuki-bye-mark"
            d="M195 56c8 3 14 8 17 16"
            fill="none"
            stroke="#d78354"
            strokeLinecap="round"
            strokeWidth="6"
          />
          <path
            className="tanuki-bye-mark"
            d="M202 34c10 6 17 15 21 26"
            fill="none"
            stroke="#d78354"
            strokeLinecap="round"
            strokeWidth="6"
            opacity="0.72"
          />
        </g>
      ) : null}
    </svg>
  );
}
