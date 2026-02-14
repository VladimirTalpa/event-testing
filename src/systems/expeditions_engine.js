// Engine будет полностью в ЧАСТИ 3/3.
// Сейчас — только “привязка client” чтобы проект не падал.

let boundClient = null;

function initExpeditionsEngine(client) {
  boundClient = client;
  // в части 3 добавим таймеры и обработку активных экспедиций
}

function getBoundClient() {
  return boundClient;
}

module.exports = { initExpeditionsEngine, getBoundClient };
