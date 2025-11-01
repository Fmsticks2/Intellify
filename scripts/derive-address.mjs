import dotenv from "dotenv";
import { ethers } from "ethers";

dotenv.config({ override: true });

const pk = process.env.PRIVATE_KEY || process.env.OG_PRIVATE_KEY || process.env.OG_PRIVATEKEY;
if (!pk) {
  console.error("No PRIVATE_KEY found in env.");
  process.exit(1);
}

try {
  const wallet = new ethers.Wallet(pk);
  console.log("Derived address:", wallet.address);
  console.log("PK prefix:", pk.slice(0, 12));
} catch (e) {
  console.error("Failed to derive address:", e.message);
  process.exit(1);
}