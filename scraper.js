const express = require('express');
const app = express();
const port = process.env.PORT || 4000;
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');

process.setMaxListeners(0);

app.use(bodyParser.json());
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    next();
});

app.get('/', function (req, res) {
    res.send('Hello World')
  })

app.get('/info', async (req, res) => {
    res.send(await getInfo('https://www.worldometers.info/coronavirus/country/us'));
})



app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})



async function getInfo(url) {
    let browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setRequestInterception(true);

    page.on('request', (req) => {
        if(req.resourceType() == 'stylesheet' || req.resourceType() == 'font' || req.resourceType() === 'image'){
            req.abort();
        }
        else {
            req.continue();
        }
    });

    await page.goto(url);

    const [date] = await page.$x('/html/body/div[3]/div[2]/div[1]/div/div[2]');
    const dateStr = await date.getProperty('innerText');
    const dateFinal = await dateStr.jsonValue();

    const [totaCases] = await page.$x('/html/body/div[3]/div[2]/div[1]/div/div[4]/div/span');
    const totaCasesStr = await totaCases.getProperty('innerText');
    const totaCasesFinal = await totaCasesStr.jsonValue();

    const [totalDeaths] = await page.$x('/html/body/div[3]/div[2]/div[1]/div/div[5]/div/span');
    const totalDeathsStr = await totalDeaths.getProperty('innerText');
    const totalDeathsFinal = await totalDeathsStr.jsonValue();

    const [totalRecovered] = await page.$x('/html/body/div[3]/div[2]/div[1]/div/div[6]/div/span');
    const totalRecoveredStr = await totalRecovered.getProperty('innerText');
    const totalRecoveredFinal = await totalRecoveredStr.jsonValue();


    const [totaNewCases] = await page.$x('/html/body/div[4]/div[1]/div/div[5]/div[1]/div/table/tbody[1]/tr[1]/td[4]');
    const totaNewCasesStr = await totaNewCases.getProperty('innerText');
    const totaNewCasesFinal = await totaNewCasesStr.jsonValue();

    const [totalNewDeaths] = await page.$x('/html/body/div[4]/div[1]/div/div[5]/div[1]/div/table/tbody[1]/tr[1]/td[6]');
    const totalNewDeathsStr = await totalNewDeaths.getProperty('innerText');
    const totalNewDeathsFinal = await totalNewDeathsStr.jsonValue();


    let pageDetails = await page.evaluate(() => {
        
        let table = document.querySelector('#usa_table_countries_today');
        let tableBody = table.querySelector('tbody');
        let states = Array.from(tableBody.children);

        let rowDetails = states.map( (row, index) => {
            if (index == 0) {
                return;
            }
            let stateInfo = Array.from(row.children);
            console.log(stateInfo);
            let name = stateInfo[1].innerText;
            let cases = stateInfo[2].innerText;
            let deaths = stateInfo[4].innerText;
            let newCases = stateInfo[3].innerText;
            let newDeaths = stateInfo[5].innerText;

            
 
            return {name: name, cases: cases, deaths: deaths, newCases: newCases, newDeaths: newDeaths}

        })
        return rowDetails;

    });
    browser.close();
    let obj = {arr: pageDetails, date: dateFinal, totalCases: totaCasesFinal, totalDeaths: totalDeathsFinal,
         totalRecovered: totalRecoveredFinal, totalNewCases: totaNewCasesFinal, totalNewDeaths: totalNewDeathsFinal}
    return obj;
}

