const fs = require('fs');
const cheerio = require('cheerio');
const html = fs.readFileSync('safari_clone/www.tanzaniainsideandsafari.com/12-days-tanzania-safari-and-zanzibar-beach.html', 'utf8');
const $ = cheerio.load(html);

console.log('--- RELEVANT TABS/SECTIONS ---');
$('.nav-tabs li, .tab-pane h3').each((i, el) => {
    console.log($(el).text().trim());
});

console.log('--- HERO OVERVIEW INFO ---');
$('.tour-title-info, .tour-info .single-info').each((i, el) => {
    console.log($(el).text().replace(/\s+/g, ' ').trim());
});

console.log('--- SIDEBAR INFO ---');
$('.sidebar-widget').each((i, el) => {
    console.log($(el).find('h4, h3').text().trim());
});
