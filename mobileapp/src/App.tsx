import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import { useSettings } from '@ombori/ga-settings';
import { useStatus, usePublish, useSubscribe, setDefaultChannel } from '@ombori/ga-messaging';
import { Settings } from './schema';

// connect to mobile remote message bus 
if (document.location.hash) {
  const id = document.location.hash.replace(/^#/, '');
  setDefaultChannel(`remote/${id}`);
}

function App() {
  const settings = useSettings<Settings>();
  const connected = useStatus(); // true when we're connected to message bus
  const pub = usePublish();
  const [gameOver, setGameOver] = useState<boolean>(false);

  // send flap message when screen is tapped
  const flap = useCallback(() => {
    console.log('flap');
    pub('remote/Flap', {});
  }, [pub]);

  // handle game state changes
  useSubscribe('remote/Game.over', () => setGameOver(true), [setGameOver]);
  useSubscribe('remote/Game.started', () => setGameOver(false), [setGameOver]);

  if (!settings) return <div>Loading settings...</div>
  if (!connected) return <div>Connecting...</div>

  return (
    <Container onMouseDown={flap}>
      {gameOver ? (
        <p>
          <h1>You have died.</h1>
          <button className="try">Try Again</button>
        </p>
      ) : (
        <button className="flap">Flap</button>
      )}
    </Container>
  );
}

const Container = styled.div`
  width: 100vw; 
  height: 100vh; 
  display: flex;
  align-items: center; 
  justify-content: center;
`;

export default App;
