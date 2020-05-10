// Load the data from a Google Spreadsheet
// https://docs.google.com/spreadsheets/d/1uLutbZWlXedYKbXhxpS5NKH2dCSjQiwMKkVJhP0kmzQ/pubhtml

Highcharts.data({
    googleSpreadsheetKey: '1uLutbZWlXedYKbXhxpS5NKH2dCSjQiwMKkVJhP0kmzQ',

    // Custom handler when the spreadsheet is parsed
    parsed: function (columns) {

        // Read the columns into the data array
        var data = [];
        Highcharts.each(columns[0], function (code, i) {

            lastSixDays = []
            for (let j = 1; j < 7; j++){
                lastSixDays.push(parseInt(columns[columns.length - j][i]))
            }

            data.push({
                code: code.toUpperCase(),
                name: columns[0][i],
                value: parseInt(columns[columns.length - 1][i]),
                lastSixDays: lastSixDays
            });
        });

        // Initiate the chart
        Highcharts.mapChart('container', {
            chart: {
                map: 'custom/world',
                borderWidth: 1
            },

            colors: ['rgba(19,64,117,0.05)', 'rgba(19,64,117,0.2)', 'rgba(19,64,117,0.4)',
                'rgba(19,64,117,0.5)', 'rgba(19,64,117,0.6)', 'rgba(19,64,117,0.8)', 'rgba(19,64,117,1)'],

            title: {
                text: 'COVID-19 Cases by Country'
            },

            mapNavigation: {
                enabled: true
            },

            legend: {
                title: {
                    text: 'Number of infected individuals',
                },
                align: 'left',
                verticalAlign: 'bottom',
                floating: true,
                layout: 'vertical',
                valueDecimals: 0,
                backgroundColor: ( // theme
                    Highcharts.defaultOptions &&
                    Highcharts.defaultOptions.legend &&
                    Highcharts.defaultOptions.legend.backgroundColor
                ) || 'rgba(255, 255, 255, 0.85)',
                symbolRadius: 0,
                symbolHeight: 14
            },

            colorAxis: {
                dataClasses: [{
                    to: 100
                }, {
                    from: 100,
                    to: 500
                }, {
                    from: 500,
                    to: 1000
                }, {
                    from: 1000,
                    to: 5000
                }, {
                    from: 5000,
                    to: 10000
                }, {
                    from: 10000,
                    to: 50000
                }, {
                    from: 50000
                }]
            },

            series: [{
                data: data,
                joinBy: 'name',
                animation: true,
                name: 'Coronavirus',
                states: {
                    hover: {
                        color: '#a4edba'
                    }
                },
                shadow: false
            }],

            plotOptions: {
                series: {
                    point: {
                        events: {
                            click: function () {
                                
                                let countryCode = getKeyByValue(isoCountries, this.name);
                                if (!countryCode){
                                    countryCode = this.name;
                                } else {
                                    countryCode = countryCode.toLowerCase()
                                }

                                var url = 'http://newsapi.org/v2/top-headlines?' +
                                    'q=COVID-19&' +
                                    'country=' + countryCode + '&' +
                                    'apiKey=91ccf16755274ef89fa7454c07ba1c16';
                                
                                var req = new Request(url);

                                fetch(req)
                                    .then((response) =>response.json())
                                    .then(res => {
                                        $("#news").empty();
                                        $("#stats").empty();
                                        $("#newsfeed").css("background-color", "white");
                                        if (res.articles.length == 0) {
                                            const nameWithoutSpaces = this.name.replace(" ", "%20")
                                            var url = 'http://newsapi.org/v2/everything?' +
                                                'q=%22COVID-19%22%20' + nameWithoutSpaces + '&' +
                                                'qInTitle=%22COVID-19%22&' +
                                                'from=2020-05-10&' +
                                                'sortBy=relevancy&' +
                                                'apiKey=91ccf16755274ef89fa7454c07ba1c16';

                                            var req = new Request(url);
                                            
                                            fetch(req)
                                                .then((response) => response.json())
                                                .then(res => {
                                                    addNews(res.articles, this.name);
                                                    addStats(this, countryCode);
                                                })
                                        }
                                        else{
                                            addNews(res.articles, this.name);
                                            addStats(this, countryCode);
                                        }
                                    });
                            }
                        }
                    }
                }
            }
        
        });
    },
    error: function () {
        document.getElementById('container').innerHTML = '<div class="loading">' +
            '<i class="icon-frown icon-large"></i> ' +
            'Error loading data' +
            '</div>';
    }
});

function addStats(info, countryCode){

    
    let html = `
    <h5 class="font-weight-bold">${info.name}</h5>

    <h6>Total Confirmed Cases: ${info.value}</h6>

    <h6>Percentage of Population Infected: <span id="infected"></span><h6>

    <br>
    <table class="table">
    <thead class="">
        <tr>
        <th scope="col">Date</th>
        <th scope="col">Cases</th>
        <th scope="col">Change</th>
        </tr>
    </thead>
    <tbody>
        ${makeTable(info)}
    </tbody>
    </table>
    `

    getPopulation(countryCode, info.value);
    $("#stats").append(html);
}

function makeTable(info){

    let rows = ""
    const dates = [25, 24, 23, 22, 21]
    
    for (let i = 0; i < info.lastSixDays.length - 1; i++){

        let change = ""
        if (info.lastSixDays[i] - info.lastSixDays[i + 1] > 0){
            change = `<td class="red">${Math.round(((info.lastSixDays[i] - info.lastSixDays[i + 1]) / info.lastSixDays[i + 1]) * 100, 1)}%</td>`
        } else {
            change = `<td class="green">${Math.round(((info.lastSixDays[i + 1] - info.lastSixDays[i]) / info.lastSixDays[i + 1]) * 100, 1)}%</td>`
        }

        rows += `
        <tr>
            <td>${dates[i]}-Apr</td>
            <td>${info.lastSixDays[i]}</td>
            ${change}
        </tr>
        `
    }
    return rows
}

function getPopulation(countryCode, cases){
    var url = 'http://localhost:3000/population?country=' + countryCode

    var req = new Request(url);

    fetch(req)
    .then((response) => response.json())
    .then(data => {
        let percentAffected = (cases / data["population"]) * 100;
        percentAffected = Math.round((percentAffected + Number.EPSILON) * 100) / 100
        $("#infected").text(percentAffected + "%");
    });
}

function addNews(articles, name){
    $("#news-heading").text(`Latest News of COVID-19`)
    $("#newsfeed").css("background-color", "rgb(242, 242, 242)");
    for (let i = 0; i < 3; i++) {
        currNewsItem = articles[i];
        newsHtml = makeNewsHtml(currNewsItem);
        $("#news").append(newsHtml)
    }
}

function makeNewsHtml(currNewsItem) {
    if (!currNewsItem){
        currNewsItem = {
            urlToImage: "NA",
            title: "NA",
            description: "NA",
            source: {name: "NA"},
            url: "NA",
            publishedAt: "NA"
        } 
    }
    return `
    <div class="col-4">
        <div class="card">
            <img class="card-img-top" src="${currNewsItem.urlToImage}">
            <div class="card-body">
                <h6 class="card-title font-weight-bold">${currNewsItem.title}</h6>
                <p class="card-text">${currNewsItem.description}</p>
                <p class="card-text">${currNewsItem.source.name}</p>
                <a class="card-link" href="${currNewsItem.url}">View Full Article</a>
                <p class="card-text"><small class="text-muted">${currNewsItem.publishedAt}</small></p>
            </div>
        </div>
    </div>
    `
}

// API key: 91ccf16755274ef89fa7454c07ba1c16

// Citation
// https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/maps/demo/data-class-ranges/

// To get ISO 3166 country code for news
var isoCountries = {
    'AF': 'Afghanistan',
    'AX': 'Aland Islands',
    'AL': 'Albania',
    'DZ': 'Algeria',
    'AS': 'American Samoa',
    'AD': 'Andorra',
    'AO': 'Angola',
    'AI': 'Anguilla',
    'AQ': 'Antarctica',
    'AG': 'Antigua And Barbuda',
    'AR': 'Argentina',
    'AM': 'Armenia',
    'AW': 'Aruba',
    'AU': 'Australia',
    'AT': 'Austria',
    'AZ': 'Azerbaijan',
    'BS': 'Bahamas',
    'BH': 'Bahrain',
    'BD': 'Bangladesh',
    'BB': 'Barbados',
    'BY': 'Belarus',
    'BE': 'Belgium',
    'BZ': 'Belize',
    'BJ': 'Benin',
    'BM': 'Bermuda',
    'BT': 'Bhutan',
    'BO': 'Bolivia',
    'BA': 'Bosnia And Herzegovina',
    'BW': 'Botswana',
    'BV': 'Bouvet Island',
    'BR': 'Brazil',
    'IO': 'British Indian Ocean Territory',
    'BN': 'Brunei Darussalam',
    'BG': 'Bulgaria',
    'BF': 'Burkina Faso',
    'BI': 'Burundi',
    'KH': 'Cambodia',
    'CM': 'Cameroon',
    'CA': 'Canada',
    'CV': 'Cape Verde',
    'KY': 'Cayman Islands',
    'CF': 'Central African Republic',
    'TD': 'Chad',
    'CL': 'Chile',
    'CN': 'China',
    'CX': 'Christmas Island',
    'CC': 'Cocos (Keeling) Islands',
    'CO': 'Colombia',
    'KM': 'Comoros',
    'CG': 'Congo',
    'CD': 'Congo, Democratic Republic',
    'CK': 'Cook Islands',
    'CR': 'Costa Rica',
    'CI': 'Cote D\'Ivoire',
    'HR': 'Croatia',
    'CU': 'Cuba',
    'CY': 'Cyprus',
    'CZ': 'Czech Republic',
    'DK': 'Denmark',
    'DJ': 'Djibouti',
    'DM': 'Dominica',
    'DO': 'Dominican Republic',
    'EC': 'Ecuador',
    'EG': 'Egypt',
    'SV': 'El Salvador',
    'GQ': 'Equatorial Guinea',
    'ER': 'Eritrea',
    'EE': 'Estonia',
    'ET': 'Ethiopia',
    'FK': 'Falkland Islands (Malvinas)',
    'FO': 'Faroe Islands',
    'FJ': 'Fiji',
    'FI': 'Finland',
    'FR': 'France',
    'GF': 'French Guiana',
    'PF': 'French Polynesia',
    'TF': 'French Southern Territories',
    'GA': 'Gabon',
    'GM': 'Gambia',
    'GE': 'Georgia',
    'DE': 'Germany',
    'GH': 'Ghana',
    'GI': 'Gibraltar',
    'GR': 'Greece',
    'GL': 'Greenland',
    'GD': 'Grenada',
    'GP': 'Guadeloupe',
    'GU': 'Guam',
    'GT': 'Guatemala',
    'GG': 'Guernsey',
    'GN': 'Guinea',
    'GW': 'Guinea-Bissau',
    'GY': 'Guyana',
    'HT': 'Haiti',
    'HM': 'Heard Island & Mcdonald Islands',
    'VA': 'Holy See (Vatican City State)',
    'HN': 'Honduras',
    'HK': 'Hong Kong',
    'HU': 'Hungary',
    'IS': 'Iceland',
    'IN': 'India',
    'ID': 'Indonesia',
    'IR': 'Iran, Islamic Republic Of',
    'IQ': 'Iraq',
    'IE': 'Ireland',
    'IM': 'Isle Of Man',
    'IL': 'Israel',
    'IT': 'Italy',
    'JM': 'Jamaica',
    'JP': 'Japan',
    'JE': 'Jersey',
    'JO': 'Jordan',
    'KZ': 'Kazakhstan',
    'KE': 'Kenya',
    'KI': 'Kiribati',
    'KR': 'Korea',
    'KW': 'Kuwait',
    'KG': 'Kyrgyzstan',
    'LA': 'Lao People\'s Democratic Republic',
    'LV': 'Latvia',
    'LB': 'Lebanon',
    'LS': 'Lesotho',
    'LR': 'Liberia',
    'LY': 'Libyan Arab Jamahiriya',
    'LI': 'Liechtenstein',
    'LT': 'Lithuania',
    'LU': 'Luxembourg',
    'MO': 'Macao',
    'MK': 'Macedonia',
    'MG': 'Madagascar',
    'MW': 'Malawi',
    'MY': 'Malaysia',
    'MV': 'Maldives',
    'ML': 'Mali',
    'MT': 'Malta',
    'MH': 'Marshall Islands',
    'MQ': 'Martinique',
    'MR': 'Mauritania',
    'MU': 'Mauritius',
    'YT': 'Mayotte',
    'MX': 'Mexico',
    'FM': 'Micronesia, Federated States Of',
    'MD': 'Moldova',
    'MC': 'Monaco',
    'MN': 'Mongolia',
    'ME': 'Montenegro',
    'MS': 'Montserrat',
    'MA': 'Morocco',
    'MZ': 'Mozambique',
    'MM': 'Myanmar',
    'NA': 'Namibia',
    'NR': 'Nauru',
    'NP': 'Nepal',
    'NL': 'Netherlands',
    'AN': 'Netherlands Antilles',
    'NC': 'New Caledonia',
    'NZ': 'New Zealand',
    'NI': 'Nicaragua',
    'NE': 'Niger',
    'NG': 'Nigeria',
    'NU': 'Niue',
    'NF': 'Norfolk Island',
    'MP': 'Northern Mariana Islands',
    'NO': 'Norway',
    'OM': 'Oman',
    'PK': 'Pakistan',
    'PW': 'Palau',
    'PS': 'Palestinian Territory, Occupied',
    'PA': 'Panama',
    'PG': 'Papua New Guinea',
    'PY': 'Paraguay',
    'PE': 'Peru',
    'PH': 'Philippines',
    'PN': 'Pitcairn',
    'PL': 'Poland',
    'PT': 'Portugal',
    'PR': 'Puerto Rico',
    'QA': 'Qatar',
    'RE': 'Reunion',
    'RO': 'Romania',
    'RU': 'Russia',
    'RW': 'Rwanda',
    'BL': 'Saint Barthelemy',
    'SH': 'Saint Helena',
    'KN': 'Saint Kitts And Nevis',
    'LC': 'Saint Lucia',
    'MF': 'Saint Martin',
    'PM': 'Saint Pierre And Miquelon',
    'VC': 'Saint Vincent And Grenadines',
    'WS': 'Samoa',
    'SM': 'San Marino',
    'ST': 'Sao Tome And Principe',
    'SA': 'Saudi Arabia',
    'SN': 'Senegal',
    'RS': 'Serbia',
    'SC': 'Seychelles',
    'SL': 'Sierra Leone',
    'SG': 'Singapore',
    'SK': 'Slovakia',
    'SI': 'Slovenia',
    'SB': 'Solomon Islands',
    'SO': 'Somalia',
    'ZA': 'South Africa',
    'GS': 'South Georgia And Sandwich Isl.',
    'ES': 'Spain',
    'LK': 'Sri Lanka',
    'SD': 'Sudan',
    'SR': 'Suriname',
    'SJ': 'Svalbard And Jan Mayen',
    'SZ': 'Swaziland',
    'SE': 'Sweden',
    'CH': 'Switzerland',
    'SY': 'Syrian Arab Republic',
    'TW': 'Taiwan',
    'TJ': 'Tajikistan',
    'TZ': 'Tanzania',
    'TH': 'Thailand',
    'TL': 'Timor-Leste',
    'TG': 'Togo',
    'TK': 'Tokelau',
    'TO': 'Tonga',
    'TT': 'Trinidad And Tobago',
    'TN': 'Tunisia',
    'TR': 'Turkey',
    'TM': 'Turkmenistan',
    'TC': 'Turks And Caicos Islands',
    'TV': 'Tuvalu',
    'UG': 'Uganda',
    'UA': 'Ukraine',
    'AE': 'United Arab Emirates',
    'GB': 'United Kingdom',
    'US': 'United States of America',
    'UM': 'United States Outlying Islands',
    'UY': 'Uruguay',
    'UZ': 'Uzbekistan',
    'VU': 'Vanuatu',
    'VE': 'Venezuela',
    'VN': 'Viet Nam',
    'VG': 'Virgin Islands, British',
    'VI': 'Virgin Islands, U.S.',
    'WF': 'Wallis And Futuna',
    'EH': 'Western Sahara',
    'YE': 'Yemen',
    'ZM': 'Zambia',
    'ZW': 'Zimbabwe'
};

function getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
}
