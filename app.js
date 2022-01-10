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
			page.setBypassCSP(true);

			if (parseUrl(req.query.isFB) !== undefined && req.query.isFB === 'true'){
			    console.log('Es FB');
				const pageHTML = `
				  <html>
					  <body style="margin:0px;">
						<div
							class="fb-post"
							data-href="`+urlToScreenshot+`"
						></div>
						<script async defer src="https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v3.2"></script>
					  </body>
					</html>
				`;
				await page.setContent('<script>window.top.location.href ="'+urlToScreenshot+'";</script>', {
					waitUntil: ['domcontentloaded']
				});
			} else if (parseUrl(req.query.isLI) !== undefined && req.query.isLI === 'true'){
			    console.log('Es LinkedIn');
				const pageHTML = `
				  <html>
					  <body style="margin:0px;">
						<div
							class="badge-base LI-profile-badge"
							data-locale="es_ES"
							data-size="large"
							data-theme="light"
							data-type="HORIZONTAL"
							data-vanity="`+urlToScreenshot+`"
							style="width: 336px; display: inline-block;"
						>
						<a class="LI-simple-link" href="`+urlToScreenshot+`?trk=profile-badge"></a>
						</div>
						<script type="text/javascript" src="https://platform.linkedin.com/badges/js/profile.js" async defer></script>
					  </body>
					</html>
				`;
				await page.setContent(pageHTML, {
					waitUntil: ['domcontentloaded']
				});
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