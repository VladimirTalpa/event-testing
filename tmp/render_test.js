const fs = require('fs');
const path = require('path');
const { buildPackOpeningImage, buildCardRevealImage } = require('../src/ui/card-pack');

async function main() {
  try {
    const buf1 = await buildPackOpeningImage({ username: 'Tester', packName: 'Bleach Test Pack' });
    fs.writeFileSync(path.join(__dirname, 'pack_opening_test.png'), buf1);
    console.log('Wrote tmp/pack_opening_test.png');

    const card = { id: 'ichigo', name: 'Ichigo Kurosaki', rarity: 'Legendary' };
    const buf2 = await buildCardRevealImage({ username: 'Tester', card, countOwned: 2, level: 5 });
    fs.writeFileSync(path.join(__dirname, 'card_reveal_test.png'), buf2);
    console.log('Wrote tmp/card_reveal_test.png');
  } catch (e) {
    console.error('Render test failed:', e);
    process.exit(1);
  }
}

main();
