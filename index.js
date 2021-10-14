
const express = require('express'),
    app = express(),
    puppeteer = require('puppeteer');

app.get("/", async (request, response) => {
  try {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox']
    });
    const page = await browser.newPage();
    await page.goto(request.query.url); // Read url query parameter.
    const image = await page.screenshot({fullPage : true});
    await browser.close();
    response.set('Content-Type', 'image/png');
    response.send(image);
  } catch (error) {
    console.log(error);
  }
});

const PORT = process.env.PORT || 3000;
var listener = app.listen(PORT, () => {
    console.log(`Our app is running on port ${ PORT }`);
});