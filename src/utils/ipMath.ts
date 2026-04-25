// Converts "192.168.1.1" into a 32-bit number
export function ipToLong(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

// Checks if two IPs are in the same subnet based on the mask
export function isSameSubnet(ip1: string, ip2: string, mask: string): boolean {
  try {
    const ip1Long = ipToLong(ip1);
    const ip2Long = ipToLong(ip2);
    const maskLong = ipToLong(mask);
    
    // Bitwise AND operation to find the network address
    return (ip1Long & maskLong) === (ip2Long & maskLong);
  } catch (e) {
    return false;
  }
}