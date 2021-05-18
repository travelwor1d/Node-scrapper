const axios = require('axios');
const cheerio = require('cheerio');
const AWS = require('aws-sdk');
require('dotenv').config()

const siteUrl = "https://finance.yahoo.com/trending-tickers";

const fetchTrending = async () => {
    const result = await axios.get(siteUrl)
    return cheerio.load(result.data)
}

async function getTrending() {
    const $ = await fetchTrending();
    let trending = [];

    $('table tr').each(function (index, element) {
        // console.log($(element).find('td').text())
        // trending.push($(element).text())
        let ticker = $(element).find('td.data-col0').text();
        // let name = $(element).find('td.data-col0').text();
        let lastPrice = $(element).find('td.data-col2').text();
        let change = $(element).find('td.data-col5').text();

        let item = {
            ticker,
            lastPrice,
            change
        }
        trending.push(item);
    })

    // console.log(trending.slice(1,));
    return trending.slice(1,);
};

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const BUCKET_NAME = process.env.AWS_BUCKET_TERMINAL_SCRAPE;
function uploadTrending(trendingJson) {
    s3.putObject({
        Bucket: BUCKET_NAME,
        Key: 'trending/trending.json', // File name you want to save as in S3
        Body: JSON.stringify(trendingJson),
        ACL:'public-read',
        ContentType: "application/json"
    },
        function (err, data) {
            console.log("Error => " + JSON.stringify(err) + " " + JSON.stringify(data));
        }
    );
};

module.exports = {
    runTrending:
        function runTrending() {
            getTrending().then(d => uploadTrending(d))
        }
};
