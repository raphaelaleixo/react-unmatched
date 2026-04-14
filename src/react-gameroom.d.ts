declare module "react-gameroom" {
  export interface PlayerSlot {
    id: number;
    status: "empty" | "waiting" | "ready";
    name?: string;
  }

  export interface RoomState {
    roomId: string;
    status: "waiting" | "playing" | "finished";
    players: PlayerSlot[];
    config?: Record<string, unknown>;
  }

  export function joinPlayer(
    roomState: RoomState,
    playerId: number,
    name: string,
  ): RoomState;

  export function startGame(roomState: RoomState): RoomState;
}
