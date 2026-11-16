import bcrypt from "bcryptjs";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

const rl = createInterface({ input: stdin, output: stdout });
const password = await rl.question("Password admin baru: ");
rl.close();
if (password.length < 12) {
  console.error("Gunakan minimal 12 karakter.");
  process.exit(1);
}
console.log("\nADMIN_PASSWORD_HASH=" + await bcrypt.hash(password, 12));
