// Vercel sert 404.html (avec un vrai code 404) pour toute adresse inconnue.
// On y place la coquille de l’application : le routeur affiche alors la page « introuvable ».
import { copyFileSync, existsSync } from 'node:fs';

const out = 'dist/laurent-bury/browser';
const shell = `${out}/index.csr.html`;
if (!existsSync(shell)) {
  console.error(`postbuild : ${shell} est introuvable.`);
  process.exit(1);
}
copyFileSync(shell, `${out}/404.html`);
console.log('postbuild : 404.html créé.');
