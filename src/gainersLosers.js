const axios = require('axios');
const cheerio = require('cheerio');
const AWS = require('aws-sdk');
require('dotenv').config()

const siteUrl = "https://money.cnn.com/data/markets/";

const fetchGainers = async () => {
    const result = await axios.get(siteUrl);
    return cheerio.load(result.data);
};

async function getGainers()  {
    const $ = await fetchGainers();
    let gainers = []

    $('.gainers li').each(function (index, element){
        // console.log($(element).find('.quote-name').text().trim())
        let name = $(element).find('.quote-name').text().trim()
        let pctChange = $(element).find('.quote-change').text().trim()
        let symbol = $(element).find('a').attr('href')
        symbol = symbol.slice(symbol.indexOf('=') + 1, )
        let gainerItem = {
            name: name,
            pctChange: pctChange,
            symbol: symbol
        }

        gainers.push(gainerItem)
     });
    return gainers;
}


const fetchLosers = async () => {
    const result = await axios.get(siteUrl);
    return cheerio.load(result.data);
};

async function getLosers()  {
    const $ = await fetchLosers();
    let losers = []

    $('.losers li').each(function (index, element){
        // console.log($(element).find('.quote-name').text().trim())
        let name = $(element).find('.quote-name').text().trim()
        let pctChange = $(element).find('.quote-change').text().trim()
        let symbol = $(element).find('a').attr('href')
        symbol = symbol.slice(symbol.indexOf('=') + 1, )

        let loserItem = {
            name: name,
            pctChange: pctChange,
            symbol: symbol
        }

        losers.push(loserItem)
     });

    return losers ;
}

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const BUCKET_NAME = process.env.AWS_BUCKET_TERMINAL_SCRAPE;

function uploadGainers(gainersJson) {
    s3.putObject({
        Bucket: BUCKET_NAME,
        Key: 'gainers/gainers.json', // File name you want to save as in S3
        Body: JSON.stringify(gainersJson),
        ACL:'public-read',
        ContentType: "application/json"
    },
        function (err, data) {
            console.log("Error => " + JSON.stringify(err) + " " + JSON.stringify(data));
        }
    );
};

function uploadLosers(losersJson) {
    s3.putObject({
        Bucket: BUCKET_NAME,
        Key: 'losers/losers.json', // File name you want to save as in S3
        Body: JSON.stringify(losersJson),
        ACL:'public-read',
        ContentType: "application/json"
    },
        function (err, data) {
            console.log("Error => " + JSON.stringify(err) + " " + JSON.stringify(data));
        }
    );
};

module.exports = {
    runGainers:
        function runGainers () {
            getGainers().then(d => uploadGainers(d))
        },
    runLosers:
        function runLosers() {
            getLosers().then(d => uploadLosers(d))
        },

};