const axios = require('axios');
const cheerio = require('cheerio');
const AWS = require('aws-sdk');
require('dotenv').config();

const url = 'https://www.nerdwallet.com/best/banking/savings-accounts';

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const BUCKET_NAME = process.env.AWS_BUCKET_TERMINAL_SCRAPE;


const fetchDataSavingsAccounts = async () => {
    const result = await axios.get('https://www.nerdwallet.com/best/banking/savings-accounts');
    return cheerio.load(result.data);
};


// const fetchBankPage = async (url) => {
//     const result = await axios.get(url);
//     const $ = cheerio.load(result.data);
//     console.log(url)
//     console.log("---- RESULT -----")
//     const redirectLink = $('meta[http-equiv="refresh"]').attr("content");
//     console.log(redirectLink);
//     console.log("--- NEXT ONE ----")
// }

async function getSavingsAccountsList() {
    let bankURLs = {
      "marcus": "https://www.marcus.com/us/en/savings/high-yield-savings",
      "hsbc": "https://www.hsbcdirect.com/savings/",
      "alliant": "https://www.alliantcreditunion.org/bank/high-yield-savings",
      "synchrony": "https://www.synchronybank.com/banking/high-yield-savings/",
      "sallie mae": "https://www.salliemae.com/banking/high-yield-savings-account/",
      "fnbo direct": "https://www.fnbodirect.com/online-savings-account/",
      "american express": "https://www.americanexpress.com/personalsavings/home.html",
      "barclays": "https://www.banking.barclaysus.com/online-savings.html",
      "nationwide": "https://nationwide.axosbank.com/Personal/Savings/Regular-Savings",
    }
    let data = [];
    const $ = await fetchDataSavingsAccounts();

    $('table').first().find('tr').each(function(idx, element) {
        let firstCol = $(element).find("td").first();
        let bankImg = firstCol.find("img").attr("src");
        let bankName = firstCol.find("p").text();

        let apyCol = $(element).find("td:nth-child(3)");
        let apy = apyCol.find("p").first().text();
        let balance = apyCol.find("p").last().text();

        //let link = $(element).find("td").last().find("a").attr("href")

        if(bankName !== '') {
          Object.keys(bankURLs).forEach((key) => {
            if(bankName.toLowerCase().includes(key)) {
              const account = {
                  name: bankName,
                  img: bankImg,
                  apy: apy,
                  balance: balance,
                  link: bankURLs[key],
              }
              data.push(account);
              delete bankURLs[key];
            }
          });
        }
    });

    return data;
}

function uploadSavingsAccounts(accountsJson) {
    s3.putObject({
        Bucket: BUCKET_NAME,
        Key: 'savings/accounts.json', // File name you want to save as in S3
        Body: JSON.stringify(accountsJson),
        ACL:'public-read',
        ContentType: "application/json"
    },
        function (err, data) {
            console.log("Error => " + JSON.stringify(err) + " " + JSON.stringify(data));
        }
    );
};

module.exports = {
    runSavings:
        function runSavings () {
            getSavingsAccountsList().then(d => uploadSavingsAccounts(d))
        },
};
