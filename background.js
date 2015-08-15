var allData = {};

function validUrl(url) {
    if (url.substring(0, 4) === 'http') {
        return true;
    }
    return false;
}

function createRequestUrl(url) {
    return 'http://hn.algolia.com/api/v1/search?query=' + url;
}
//
function openHNStoryLink(tab) {
    var data = allData[tab.id];
    if (data) {
        window.open(data.hnUrl);
    }
}

chrome.browserAction.onClicked.addListener(openHNStoryLink);

function changeBadgeForTab(tab) {
    var id = tab.id;

    if (allData[id] && allData[id].hnUrl) {
        chrome.browserAction.setBadgeText({
            text: 'yes',
            tabId: id
        });
        chrome.browserAction.setBadgeBackgroundColor({
            color: '#49C510',
            tabId: id
        });
    } else {
        chrome.browserAction.setBadgeText({
            text: 'no',
            tabId: id
        });
        chrome.browserAction.setBadgeBackgroundColor({
            color: '#AD8D6E',
            tabId: id
        });
    }
}

function getHnUrls(response, url) {
    var goodHits = response.hits.filter(function(hit) {
        return hit.url === url;
    });
    if (goodHits.length) {
        return goodHits.map(function(hit) {
            return 'https://news.ycombinator.com/item?id=' + hit.objectID;
        });
    }
    return '';
}

function saveHnUrl(hnUrls, tab) {
    allData[tab.id] = {
        hnUrl: hnUrls[0],
        tabUrl: tab.url
    };
}

function handleRequestResponse(x, tab, url) {
    if (x.status === 200) {
        var response = JSON.parse(x.responseText);
        var hnUrls = getHnUrls(response, url);
        saveHnUrl(hnUrls, tab);
        changeBadgeForTab(tab);
    } else {
        changeBadgeForTab(tab);
        console.log('error');
    }
}

function makeRequest(tab, url) {
    var x = new XMLHttpRequest();
    if (validUrl(url)) {
        x.open('GET', createRequestUrl(url));
        x.onload = handleRequestResponse.bind(null, x, tab, url);
        x.send();
    } else {
        changeBadgeForTab(tab);
    }
}

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    // if the url changed make a request to HN
    if (changeInfo.url) {
        makeRequest(tab, changeInfo.url);
    }
});
