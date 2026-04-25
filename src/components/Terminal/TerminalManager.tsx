import { useUIStore } from '../../store/useUIStore';
import TerminalWindow from './TerminalWindow';

export default function TerminalManager() {
  const openTerminals = useUIStore((state) => state.openTerminals);

  return (
    <>
      {openTerminals.map((id, index) => (
        <TerminalWindow key={id} deviceId={id} index={index} />
      ))}
    </>
  );
}