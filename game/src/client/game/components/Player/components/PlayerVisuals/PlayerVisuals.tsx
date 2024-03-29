import React, {Suspense, useEffect, useState} from "react";
import Knight from "../../../../../3d/models/Knight/Knight";
import { proxy, useSnapshot } from "valtio";
import {attackState} from "../../hooks/attack";
import {playerHealth, playerState} from "../../../../../state/player";

export const playerVisualState = proxy({
    rollCooldown: false,
    rolling: false,
    moving: false,
    running: false,
})

const PlayerVisuals: React.FC = () => {

    const { recharging, preRecharging } = useSnapshot(playerState);
    const localPlayerState = useSnapshot(playerVisualState);
    const { lastAttack } = useSnapshot(attackState);
    const { lastDamaged } = useSnapshot(playerHealth);

    return (
      <Suspense fallback={null}>
        <Knight
          onPointerDown={(event) => console.log("down?", event)}
          onPointerOver={() => {
            // console.log("over");
          }}
          recharging={recharging || preRecharging}
          lastDamaged={lastDamaged}
          lastAttack={lastAttack}
          moving={localPlayerState.moving}
          running={localPlayerState.running}
          position={[0, localPlayerState.rolling ? -1.5 : 0, 0]}
        />
      </Suspense>
    );
};

export default PlayerVisuals;