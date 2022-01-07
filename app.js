const express = require('express');
const app = express();
const puppeteer = require('puppeteer');
const port = process.env.PORT || 8080;
const validUrl = require('valid-url');

var parseUrl = function(url) {
    url = decodeURIComponent(url)
    if (!/^(?:f|ht)tps?\:\/\//.test(url)) {
        url = 'http://' + url;
    }

    return url;
};

app.get('/', function(req, res) {
    var urlToScreenshot = parseUrl(req.query.url);

    if (validUrl.isWebUri(urlToScreenshot)) {
        console.log('Screenshotting: ' + urlToScreenshot);
        (async() => {
            const browser = await puppeteer.launch({
                args: [
					'--no-sandbox',
					'--disable-setuid-sandbox',
					'--disable-features=SameSiteByDefaultCookies,CookiesWithoutSameSiteMustBeSecure',
					'--disable-web-security'
				]
            });

            const page = await browser.newPage();
			page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
			
			await page.setExtraHTTPHeaders({
				'user-agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.131 Safari/537.36',
				'upgrade-insecure-requests': '1',
				'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
				'accept-encoding': 'gzip, deflate, br',
				'accept-language': 'en-US,en;q=0.9,en;q=0.8'
			});
			
            await page.goto(urlToScreenshot, {
			  timeout: 0,
			  waitUntil: ['domcontentloaded', 'networkidle0', 'networkidle2'],
			});
			console.log('Start loading');
			await page.waitForTimeout(3000).then(async() => {
				console.log('Capture');
				await page.screenshot({omitBackground: true}).then(function(buffer) {
					res.setHeader('Content-Disposition', 'attachment;filename="' + urlToScreenshot + '.png"');
					res.setHeader('Content-Type', 'image/png');
					res.send(buffer)
				});

				await browser.close();
			});
        })();
    } else {
        res.send('Invalid url: ' + urlToScreenshot);
    }

});

app.listen(port, function() {
    console.log('App listening on port ' + port)
})