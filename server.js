const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 8080;

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.json': 'application/json',
    '.ico': 'image/x-icon'
};

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

const localIP = getLocalIP();

const server = http.createServer((req, res) => {
    let reqUrl = req.url === '/' ? '/index.html' : req.url;
    reqUrl = reqUrl.split('?')[0];
    const safePath = path.normalize(reqUrl).replace(/^(\.\.[\/\\])+/, '');
    const filePath = path.join(__dirname, safePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('404 Sayfa Bulunamadı');
            return;
        }
        res.writeHead(200, { 
            'Content-Type': contentType,
            'Cache-Control': 'no-cache'
        });
        res.end(data);
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log('========================================================');
    console.log('🎮 EFSANEVİ KAHRAMAN SAVUNMASI - MOBİL YAYIN SUNUCUSU');
    console.log('========================================================');
    console.log(`\n💻 Bilgisayardan oynamak için:`);
    console.log(`   http://localhost:${PORT}`);
    console.log(`\n📱 MOBİL TELEFONDAN / TABLETTEN OYNAMAK İÇİN:`);
    console.log(`   1. Telefonunuzun aynı Wi-Fi ağına bağlı olduğundan emin olun.`);
    console.log(`   2. Telefonunuzun tarayıcısını (Chrome / Safari) açın ve şu adresi yazın:`);
    console.log(`   👉 http://${localIP}:${PORT}`);
    console.log('\n(Sunucuyu kapatmak için bu pencereyi kapatabilir veya Ctrl+C yapabilirsiniz.)\n');
});
