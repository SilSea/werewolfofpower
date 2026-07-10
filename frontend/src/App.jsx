import { useEffect, useState } from 'react';
import { useSocketEvent } from './hooks/useSocketEvent.js';
import { onContentChange } from './data/contentSync.js';
import Lobby from './components/Lobby/Lobby.jsx';
import RoomLobby from './components/RoomLobby/RoomLobby.jsx';
import GameScreen from './components/GameScreen/GameScreen.jsx';

function App() {
  const [room, setRoom] = useState(null);
  const [publicState, setPublicState] = useState(null);
  const [myState, setMyState] = useState(null);
  const [showRoleReveal, setShowRoleReveal] = useState(false);
  const [contentVersion, setContentVersion] = useState(0);

  // These listeners live here (always mounted) instead of inside GameScreen
  // because game:yourRole fires the instant the host starts the game —
  // before React has switched screens to mount GameScreen. A listener
  // attached only on GameScreen mount would miss that first message.
  useSocketEvent('game:update', (state) => setPublicState(state));
  useSocketEvent('game:yourRole', (state) => {
    setMyState(state);
    setShowRoleReveal(true);
  });
  useSocketEvent('game:yourState', (state) => setMyState(state));

  // Card/role text is admin-editable at runtime; contentSync mutates the
  // shared static data objects in place, and this version bump forces a
  // remount so every component re-reads the fresh text.
  useEffect(() => onContentChange(() => setContentVersion((v) => v + 1)), []);

  if (!room) {
    return <Lobby key={contentVersion} onJoined={(joinedRoom) => setRoom(joinedRoom)} />;
  }

  const inGame = publicState && publicState.phase !== 'lobby';

  if (!inGame) {
    return <RoomLobby key={contentVersion} room={room} />;
  }

  return (
    <GameScreen
      key={contentVersion}
      initialRoom={room}
      publicState={publicState}
      myState={myState}
      showRoleReveal={showRoleReveal}
      onDismissRoleReveal={() => setShowRoleReveal(false)}
      onGameEnded={() => setPublicState(null)}
    />
  );
}

export default App;
