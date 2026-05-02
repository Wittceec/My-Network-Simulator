const fs = require('fs');
let content = fs.readFileSync('src/data/premadeLabs.ts', 'utf8');

content = content.replace(/routingTable: \[\], macAddressTable: \{\}, arpTable: \{\}, vlans: \{\}, acls: \{\}/g, 
  "routingTable: [], macAddressTable: {}, arpTable: {}, vlans: {}, acls: {}, ospf: { processId: '1', networks: [{ network: '10.0.0.0', wildcard: '0.255.255.255', area: '0' }] }");

fs.writeFileSync('src/data/premadeLabs.ts', content);
console.log("Fixed OSPF");
