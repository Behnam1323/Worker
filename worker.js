export default {
  async fetch(request) {
    // 1. بررسی نوع درخواست
    const upgradeHeader = request.headers.get('Upgrade');
    
    if (upgradeHeader !== 'websocket') {
      // اگر درخواست وب‌سوکت نیست، یک پاسخ ساده HTTP بده تا خطا ندهد
      return new Response('WebSocket Proxy Ready', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    // 2. ایجاد دو سر اتصال برای وب‌سوکت
    const { 0: client, 1: server } = new WebSocketPair();
    server.accept();

    // 3. آدرس ورسل خودت
    const vercelWsUrl = 'wss://vercel-main-2.vercel.app/api/ws';

    // 4. ایجاد اتصال به ورسل
    const upstream = new WebSocket(vercelWsUrl);

    // 5. مدیریت داده‌ها
    server.addEventListener('message', function(event) {
      if (upstream.readyState === WebSocket.OPEN) {
        upstream.send(event.data);
      }
    });

    upstream.addEventListener('message', function(event) {
      if (server.readyState === WebSocket.OPEN) {
        server.send(event.data);
      }
    });

    server.addEventListener('close', function() {
      if (upstream.readyState !== WebSocket.CLOSED) {
        upstream.close();
      }
    });

    upstream.addEventListener('close', function() {
      server.close();
    });

    // 6. بازگرداندن اتصال به کلاینت
    return new Response(null, {
      status: 101,
      webSocket: client
    });
  }
}
