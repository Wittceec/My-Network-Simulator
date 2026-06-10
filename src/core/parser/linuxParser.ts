import { useNetworkStore } from '../../store/useNetworkStore';
import type { Device } from '../../types/device';
import { simulatePing, tracePath, animatePath, resolveHostname } from '../logic/ping';
import { useDnsStore } from '../../store/useDnsStore';

// Simple mock file system for linux parser
// fileSystem on device is Record<string, string | Record<string, any>> representing files and directories

function resolvePath(cwd: string, path: string): string {
  if (path.startsWith('/')) return path;
  if (path === '.' || path === './') return cwd;
  if (path === '..') {
    const parts = cwd.split('/').filter(p => p);
    parts.pop();
    return '/' + parts.join('/');
  }
  return cwd === '/' ? `/${path}` : `${cwd}/${path}`;
}

export function executeLinuxCommand(rawInput: string, device: Device, cwd: string): { output: string[], newCwd: string } {
  const input = rawInput.trim();
  const args = input.split(/\s+/);
  const cmd = args[0].toLowerCase();
  const output: string[] = [];
  let newCwd = cwd;

  if (!cmd) return { output, newCwd };

  const fs = device.fileSystem || {};

  if (cmd === 'pwd') {
    output.push(cwd);
  } else if (cmd === 'cd') {
    const target = args[1] || '/';
    const resolved = resolvePath(cwd, target);
    
    if (resolved === '/') {
       newCwd = '/';
    } else {
       // Validate path exists as a directory (in our flat mock fs, we just check if any file starts with this path + /)
       const isDir = Object.keys(fs).some(k => k.startsWith(resolved + '/')) || fs[resolved];
       if (isDir) {
         newCwd = resolved;
       } else {
         output.push(`bash: cd: ${target}: No such file or directory`);
       }
    }
  } else if (cmd === 'ls') {
    const target = args[1] ? resolvePath(cwd, args[1]) : cwd;
    const prefix = target === '/' ? '/' : `${target}/`;
    
    const items = new Set<string>();
    Object.keys(fs).forEach(k => {
      if (k.startsWith(prefix)) {
        const remaining = k.substring(prefix.length);
        const nextSlash = remaining.indexOf('/');
        if (nextSlash === -1) items.add(remaining);
        else items.add(remaining.substring(0, nextSlash));
      }
    });

    if (items.size > 0) {
       output.push(Array.from(items).join('  '));
    } else if (!Object.keys(fs).some(k => k.startsWith(prefix))) {
       output.push(`ls: cannot access '${args[1] || '.'}': No such file or directory`);
    }
  } else if (cmd === 'ps' || cmd === 'top') {
     output.push('USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND');
     output.push('root         1  0.0  0.1 169324 13092 ?        Ss   09:00   0:01 /sbin/init');
     output.push('root       120  0.0  0.0  12344  2340 ?        Ss   09:00   0:00 /lib/systemd/systemd-journald');
     output.push('root       341  0.0  0.0  83920  3400 ?        Ss   09:00   0:00 /usr/sbin/cron -f');
     if (fs['/run/nginx.pid']) {
       output.push('root       500  0.0  0.1 143200 12000 ?        Ss   09:00   0:00 nginx: master process /usr/sbin/nginx');
       output.push('www-data   501  0.0  0.2 143500 22000 ?        S    09:00   0:00 nginx: worker process');
     }
     output.push('root      1234  0.0  0.0  14500  3400 pts/0    Ss   09:05   0:00 -bash');
     output.push('root      1300  0.0  0.0   9400  2100 pts/0    R+   10:00   0:00 ps aux');
  } else if (cmd === 'mkdir') {
    const target = args[1];
    if (!target) output.push('mkdir: missing operand');
    else {
      const resolved = resolvePath(cwd, target);
      const newFs = { ...fs, [resolved]: {} };
      useNetworkStore.getState().updateDevice(device.id, (d) => ({ ...d, fileSystem: newFs }));
    }
  } else if (cmd === 'touch') {
    const target = args[1];
    if (!target) output.push('touch: missing file operand');
    else {
      const resolved = resolvePath(cwd, target);
      if (!fs[resolved]) {
        const newFs = { ...fs, [resolved]: '' };
        useNetworkStore.getState().updateDevice(device.id, (d) => ({ ...d, fileSystem: newFs }));
      }
    }
  } else if (cmd === 'rm') {
    const target = args[1] === '-rf' ? args[2] : args[1];
    if (!target) output.push('rm: missing operand');
    else {
      const resolved = resolvePath(cwd, target);
      if (fs[resolved] !== undefined) {
        const newFs = { ...fs };
        delete newFs[resolved];
        useNetworkStore.getState().updateDevice(device.id, (d) => ({ ...d, fileSystem: newFs }));
      } else {
        output.push(`rm: cannot remove '${target}': No such file or directory`);
      }
    }
  } else if (cmd === 'chmod') {
    const perms = args[1];
    const target = args[2];
    if (!perms || !target) {
      output.push('chmod: missing operand');
    } else {
      const resolved = resolvePath(cwd, target);
      if (fs[resolved] !== undefined) {
        // Mock success and store perms
        const newFs = { ...fs, [`${resolved}_perms`]: perms };
        useNetworkStore.getState().updateDevice(device.id, (d) => ({ ...d, fileSystem: newFs }));
        output.push('');
      } else {
        output.push(`chmod: cannot access '${target}': No such file or directory`);
      }
    }
  } else if (cmd === 'chown') {
    const owner = args[1];
    const target = args[2];
    if (!owner || !target) {
      output.push('chown: missing operand');
    } else {
      const resolved = resolvePath(cwd, target);
      if (fs[resolved] !== undefined) {
        output.push('');
      } else {
        output.push(`chown: cannot access '${target}': No such file or directory`);
      }
    }
  } else if (cmd === 'cat') {
    const target = args[1];
    if (!target) {
       output.push('cat: missing operand');
    } else {
       const resolved = resolvePath(cwd, target);
       const content = fs[resolved];
       
       let finalContent = typeof content === 'string' ? content : null;

       if (finalContent !== null) {
          if (args.includes('|') && args.includes('grep')) {
             const grepIdx = args.indexOf('grep');
             const term = args[grepIdx + 1];
             if (term) {
                const lines = finalContent.split('\\n').filter(l => l.includes(term));
                output.push(...lines);
             } else {
                output.push('grep: missing search term');
             }
          } else {
             output.push(...finalContent.split('\\n'));
          }
       } else {
          output.push(`cat: ${target}: No such file or directory`);
       }
    }
  } else if (cmd === 'grep') {
    output.push('grep: currently only supported via piping (e.g., cat file | grep term)');
  } else if (cmd === 'systemctl') {
    const action = args[1];
    const service = args[2];
    if (!action || !service) {
      output.push('Unknown operation. Usage: systemctl [status|start|stop|restart] [service]');
    } else {
      const isRunning = !!fs[`/run/${service}.pid`];
      if (action === 'status') {
         output.push(`● ${service}.service - ${service} Server`);
         output.push(`   Loaded: loaded (/lib/systemd/system/${service}.service; enabled)`);
         if (isRunning) {
            output.push(`   Active: active (running) since Mon 2026-06-08 09:00:00 UTC`);
            output.push(` Main PID: 500 (${service})`);
            output.push(`    Tasks: 4`);
         } else {
            output.push(`   Active: inactive (dead) since Mon 2026-06-08 08:50:00 UTC`);
         }
      } else if (['start', 'stop', 'restart'].includes(action)) {
         output.push('==== AUTHENTICATING FOR org.freedesktop.systemd1.manage-units ===');
         output.push('Authentication is required to manage system services or other units.');
         output.push('Authenticating as: root');
         output.push('==== AUTHENTICATION COMPLETE ===');
         
         const newFs = { ...fs };
         if (action === 'start' || action === 'restart') {
            newFs[`/run/${service}.pid`] = '500';
         } else {
            delete newFs[`/run/${service}.pid`];
         }
         useNetworkStore.getState().updateDevice(device.id, (d) => ({ ...d, fileSystem: newFs }));
      } else {
         output.push(`Unknown command verb ${action}.`);
      }
    }
  } else if (cmd === 'ping') {
    const targetIp = args[1];
    if (!targetIp) {
      output.push('Usage: ping <destination>');
    } else {
      const resolved = targetIp.match(/[a-zA-Z]/) ? resolveHostname(targetIp) : targetIp;
      if (!resolved) {
        output.push(`ping: ${targetIp}: Name or service not known`);
      } else {
        output.push(`PING ${resolved} (${resolved}) 56(84) bytes of data.`);
        const success = simulatePing(device, resolved);
        if (success) {
          const trace = tracePath(device, resolved);
          if (trace.success) animatePath(trace.links);
          output.push(`64 bytes from ${resolved}: icmp_seq=1 ttl=64 time=0.042 ms`);
          output.push(`64 bytes from ${resolved}: icmp_seq=2 ttl=64 time=0.040 ms`);
          output.push(`64 bytes from ${resolved}: icmp_seq=3 ttl=64 time=0.041 ms`);
          output.push(`64 bytes from ${resolved}: icmp_seq=4 ttl=64 time=0.039 ms`);
          output.push('');
          output.push(`--- ${resolved} ping statistics ---`);
          output.push('4 packets transmitted, 4 received, 0% packet loss, time 3000ms');
        } else {
          output.push('From 10.0.0.1 icmp_seq=1 Destination Host Unreachable');
          output.push('From 10.0.0.1 icmp_seq=2 Destination Host Unreachable');
          output.push('From 10.0.0.1 icmp_seq=3 Destination Host Unreachable');
          output.push('From 10.0.0.1 icmp_seq=4 Destination Host Unreachable');
          output.push('');
          output.push(`--- ${resolved} ping statistics ---`);
          output.push('4 packets transmitted, 0 received, 100% packet loss, time 3000ms');
        }
      }
    }
  } else if (cmd === 'ip' && args[1] === 'a' || cmd === 'ifconfig') {
    const intf = device.interfaces['eth0'];
    const ip = intf?.ipv4?.ip || '127.0.0.1';
    const mask = intf?.ipv4?.mask || '255.0.0.0';
    const mac = intf?.macAddress && intf.macAddress !== '0000.0000.0000' ? intf.macAddress : `00:00:11:11:${device.id.padStart(2, '0')}:${device.id.padStart(2, '0')}`;

    if (cmd === 'ifconfig') {
      output.push(`eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500`);
      output.push(`        inet ${ip}  netmask ${mask}  broadcast 10.0.0.255`);
      output.push(`        ether ${mac}  txqueuelen 1000  (Ethernet)`);
      output.push(`        RX packets 154231  bytes 23049102 (23.0 MB)`);
      output.push(`        TX packets 123491  bytes 12930219 (12.9 MB)`);
    } else {
      output.push(`1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000`);
      output.push(`    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00`);
      output.push(`    inet 127.0.0.1/8 scope host lo`);
      output.push(`2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000`);
      output.push(`    link/ether ${mac} brd ff:ff:ff:ff:ff:ff`);
      output.push(`    inet ${ip}/24 brd 10.0.0.255 scope global eth0`);
    }
  } else if (cmd === 'clear') {
     // Handled by UI, but we can pass a special flag or just return empty output
     output.push('___CLEAR___');
  } else {
    output.push(`bash: ${cmd}: command not found`);
  }

  return { output, newCwd };
}
