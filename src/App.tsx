import { ReactFlowProvider } from '@xyflow/react';
import NetworkCanvas from './components/Canvas/NetworkCanvas';
import Sidebar from './components/UI/Sidebar';
import TerminalWindow from './components/Terminal/TerminalManager'; // ADD THIS

function App() {
  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <ReactFlowProvider>
        <Sidebar />
        <NetworkCanvas />
        <TerminalWindow /> {/* ADD THIS */}
      </ReactFlowProvider>
    </div>
  );
}

export default App;