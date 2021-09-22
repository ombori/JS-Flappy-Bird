import React, { useState } from 'react';
import { useSettings } from '@ombori/ga-settings';
import { useHeartbeat, useSubscribe, useMobileRemote, usePublish } from '@ombori/ga-messaging';
import QRCode from 'qrcode.react';
import styled from 'styled-components';

import { Game, useFlap, useGameOver, useGameStarted } from './game';
import { Schema as Settings } from './schema';

function App() {
  useHeartbeat();

  const settings = useSettings<Settings>();
  const [clients, setClients] = useState<number>(0); // id of the connected client

  const flap = useFlap();
  const pub = usePublish();
  const remoteUrl = useMobileRemote(settings?.remote?.prod?.url || '');

  // Service messages are coming in default channel and have `Remote.` prefix
  useSubscribe('Remote.connected', () => setClients(n => n + 1), [setClients]);
  useSubscribe('Remote.disconnected', () => setClients(n => n - 1), [setClients]);

  // Messages to/from mobile remotes are coming via 'remote' channel
  useSubscribe('remote/Flap', () => flap(), [flap]);

  // When game starts/ends, broadcast a message to all connected remotes
  useGameStarted(() => pub('remote/Game.started', {}), [pub]);
  useGameOver(() => pub('remote/Game.over', {}), [pub]);

  if (!settings) {
    return <div>Loading gridapp settings...</div>
  }

  console.log('url', remoteUrl);

  return (
    <Container onClick={flap}>
      <Game />
      {(remoteUrl && clients === 0) && (
        <QRContainer>
          <QR value={remoteUrl} size={400} bgColor="#DED895" fgColor="#503547" />
          <Text>Scan the QR code to begin</Text>
        </QRContainer>
      )}
    </Container>
  );
}

const QR = styled(QRCode)`
  height: 200px;
  width: 200px;
  padding: 40px;
  background: #DED895;  
  box-shadow: 10px 10px 0 #d7a84b;
  border: 10px solid #503547;
`

const Text = styled.h1`
  margin-top: 80px;
  font-size: 3rem;
  color: #503547;
`

const QRContainer = styled.div`
  position: absolute;
  height: 100vh;
  display: flex;
  align-items: center;
  flex-direction: column;
  width: 100vw;
  padding-top: 60vh;
`

const Container = styled.div`
  height: 100vh;
  display: flex;
`

export default App;
