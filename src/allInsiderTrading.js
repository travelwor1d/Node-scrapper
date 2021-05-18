const axios = require('axios');
const cheerio = require('cheerio');
const AWS = require('aws-sdk');
require('dotenv').config()

const siteUrl = "https://finviz.com/";
const insiderPage = "https://finviz.com/insidertrading.ashx"
const companyPage = "https://finviz.com/quote.ashx?t="

const fetchDataAllInsider = async () => {
    const result = await axios.get(insiderPage);
    return cheerio.load(result.data);
};

async function getAllInsider() {
    let data = []

    const $ = await fetchDataAllInsider();

    $('.body-table tr td').each(function (idx, element) {
        data.push($(element).text().trim())
    });

    data = data.slice(10)

    let insiderArrays = [], chunkSize = 10;

    let today = new Date();
    let curMonth = today.getMonth();
    let curYear = today.getFullYear();

    while (data.length > 0) {
        let newChunk = data.splice(0, chunkSize);

        let tradeDateString = newChunk[3] + " " + curYear
        let tradeDate = new Date(Date.parse(tradeDateString));
        if(tradeDate.getMonth() > curMonth) {
          tradeDate.setFullYear(curYear -1);
        }

        newChunk[3] = newChunk[3] + " " + tradeDate.getFullYear();

        insiderArrays.push(newChunk);
    }

    return insiderArrays;
}

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
});

const BUCKET_NAME = process.env.AWS_BUCKET_TERMINAL_SCRAPE;
function uploadInsider(insiderJson) {
    s3.putObject({
        Bucket: BUCKET_NAME,
        Key: 'all-insider-trading/allInsider.json', // File name you want to save as in S3
        Body: JSON.stringify(insiderJson),
        ACL:'public-read',
        ContentType: "application/json"
    },
        function (err, data) {
            console.log("Error => " + JSON.stringify(err) + " " + JSON.stringify(data));
        }
    );
};

module.exports = {
    runAllInsider:
        function runAllInsider() {
            getAllInsider().then(d => uploadInsider(d))
        }
};
