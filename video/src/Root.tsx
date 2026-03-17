import React from "react";
import { Composition } from "remotion";
import { TerminalWindow } from "./components/TerminalWindow";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="TerminalDemo"
        component={TerminalWindow}
        durationInFrames={450}
        fps={30}
        width={1280}
        height={1000}
      />
    </>
  );
};
