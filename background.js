// the global object containing all the urls
var allData = {};
// checks if an url is valid
function validUrl(url) {
    if (url.substring(0, 4) === 'http') {
        return true;
    }
    return false;
}
// creates the url used to make the api call
function createRequestUrl(url) {
    return 'http://hn.algolia.com/api/v1/search?query=' + url;
}
// opens a HN tab with story link or submit page
function openHnTab(tab) {
    var data = allData[tab.id];
    if (data && data.hnUrl) {
        window.open(data.hnUrl);
    } else {
        window.open('https://news.ycombinator.com/submit');
    }
}
// adds icon click event listener
chrome.browserAction.onClicked.addListener(openHnTab);
// changes the icon and the title of the tab based on tab id
function changeIconAndTitle(id, path, title) {
    chrome.browserAction.setIcon({
        path: path,
        tabId: id
    });
    chrome.browserAction.setTitle({
        title: title,
        tabId: id
    });
}
// changes the icon and title based on the URL and HN response
function changeIconAndTitleByType(tab, type) {
    if (type === 'invalid') {
        changeIconAndTitle(tab.id, 'images/icon19-invalid.png', 'Invalid URL');
        return;
    }
    if (type === 'active') {
        changeIconAndTitle(tab.id, 'images/icon19-active.png',
            'URL was submitted to HN');
        return;
    }
    if (type === 'error') {
        changeIconAndTitle(tab.id, 'images/icon19-error.png',
            'Something went wrong when checking the URL');
    }
}
// gets all the HN submitted story urls that equal the search url
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
// saves a new url to the global object
function saveHnUrl(hnUrls, tab) {
    allData[tab.id] = {
        hnUrl: hnUrls[0],
        tabUrl: tab.url
    };
}
// handles the response from the HN api
function handleRequestResponse(x, tab, url) {
    if (x.status === 200) {
        var response = JSON.parse(x.responseText);
        var hnUrls = getHnUrls(response, url);

        if (hnUrls) {
            saveHnUrl(hnUrls, tab);
            changeIconAndTitleByType(tab, 'active');
        }
    } else {
        changeIconAndTitleByType(tab, 'error');
        console.log('error');
    }
}
// make request to HN api searching for tab url
function makeRequest(tab, url) {
    var x = new XMLHttpRequest();
    if (validUrl(url)) {
        x.open('GET', createRequestUrl(url));
        x.onload = handleRequestResponse.bind(null, x, tab, url);
        x.send();
    } else {
        changeIconAndTitleByType(tab, 'invalid');
    }
}
// listens to changes for the tab url
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    // if the url changed make a request to HN
    if (changeInfo.url) {
        makeRequest(tab, changeInfo.url);
    }
});
// cleans data when a tab is closed
chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
    if (allData[tabId]) {
        allData[tabId] = null;
    }
});
