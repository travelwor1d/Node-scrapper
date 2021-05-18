const cron = require("node-cron");
const allInsider = require('./allInsiderTrading');
const trending = require('./trending');
const gainersLosers = require('./gainersLosers');
const savingsAccounts = require('./savingsAccounts');

cron.schedule("*/15 * * * *", function () {
    console.log("Running Cron Job");
    allInsider.runAllInsider()
    trending.runTrending()
    gainersLosers.runGainers()
    gainersLosers.runLosers()
});

cron.schedule("* */12 * * *", function () {
  savingsAccounts.runSavings();
});
