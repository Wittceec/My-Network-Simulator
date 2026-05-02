const fs = require('fs');
let content = fs.readFileSync('src/data/premadeLabs.ts', 'utf8');

// Regex to replace ipAddress/subnetMask with ipv4 object
content = content.replace(/ipAddress:\s*'([^']+)',\s*subnetMask:\s*'([^']+)'/g, "ipv4: { ip: '$1', mask: '$2' }");

// Regex to add missing required interface fields.
// We can do this by finding '{ id: '...' ' and injecting the defaults if they are missing.
content = content.replace(/{\s*id:\s*'([^']+)',/g, (match, id) => {
  let shortName = id;
  if (id.startsWith('fastethernet')) shortName = 'fa' + id.replace('fastethernet', '');
  else if (id.startsWith('gigabitethernet')) shortName = 'gi' + id.replace('gigabitethernet', '');
  else if (id === 'eth0') shortName = 'eth0';
  
  return `{ id: '${id}', shortName: '${shortName}', mode: 'routed', accessVlan: 1, macAddress: '0000.0000.0000',`;
});

fs.writeFileSync('src/data/premadeLabs.ts', content);
console.log("Fixed premadeLabs.ts");
