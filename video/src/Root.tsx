import React from 'react';
import { Composition, Folder } from 'remotion';
import { QuickStart } from './compositions/QuickStart';
import { StatusDashboard } from './compositions/StatusDashboard';
import { ApiWorkflow } from './compositions/ApiWorkflow';
import { AgentIntegration } from './compositions/AgentIntegration';

const SHARED = {
  fps: 30,
  width: 1920,
  height: 1080,
};

export const RemotionRoot: React.FC = () => {
  return (
    <Folder name="FreeClimb-CLI">
      <Composition
        id="QuickStart"
        component={QuickStart}
        durationInFrames={600}
        {...SHARED}
      />
      <Composition
        id="StatusDashboard"
        component={StatusDashboard}
        durationInFrames={540}
        {...SHARED}
      />
      <Composition
        id="ApiWorkflow"
        component={ApiWorkflow}
        durationInFrames={660}
        {...SHARED}
      />
      <Composition
        id="AgentIntegration"
        component={AgentIntegration}
        durationInFrames={450}
        {...SHARED}
      />
    </Folder>
  );
};
