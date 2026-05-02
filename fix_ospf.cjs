const fs = require('fs');
let content = fs.readFileSync('src/data/premadeLabs.ts', 'utf8');

const ospfBlock = "routingTable: [], macAddressTable: {}, arpTable: {}, vlans: {}, acls: {}, ospf: { processId: '1', networks: [{ network: '10.0.0.0', wildcard: '0.255.255.255', area: '0' }] }";

// Replace only the occurrences within the ospf-advanced block
const startIndex = content.indexOf("id: 'ospf-advanced'");
const endIndex = content.length;

let before = content.substring(0, startIndex);
let after = content.substring(startIndex, endIndex);

after = after.replace(/routingTable: \[\], macAddressTable: \{\}, arpTable: \{\}, vlans: \{\}, acls: \{\}/g, ospfBlock);

fs.writeFileSync('src/data/premadeLabs.ts', before + after);
console.log("Fixed OSPF");
