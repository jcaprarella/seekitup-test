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
			
			if (parseUrl(req.query.isFB) !== undefined && req.query.isFB === 'true'){
			    console.log('Es FB');
				page.setContent(`
				  <html>
					  <body style="margin:0px;">
						<div
							class="fb-post"
							data-href="`+urlToScreenshot+`"
						></div>
						<script>
							window.top.appendChild(document.getElementsByClassName('fb-post')[0])
						</script>
					  </body>
					</html>
				`);
			} else {
				await page.goto(urlToScreenshot, {
				  timeout: 0,
				  waitUntil: ['domcontentloaded', 'networkidle0', 'networkidle2'],
				});
			}
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