'use strict';
var gameSelect = document.getElementById('gameSelect');
var searchButton = document.getElementById('searchButton');
var dateInput = document.getElementById('date');
var resolutionSelect = document.getElementById('resolutionSelect');
var resultsDiv = document.getElementById('results');
var url = 'http://bugzilla.darkcreations.org/jsonrpc.cgi';
var games = [
    "TES IV: Oblivion",
    "TES V: Skyrim",
    "Fallout 3",
    "Fallout: New Vegas"
];
var hashmap = {};

function arr_exists(arr, elem) {
    for (var i in arr) {
        if (arr[i] == elem) {
            return true;
        }
    }
    return false;
}
function isEmpty(obj) {
    for(var i in obj) {
        if(obj.hasOwnProperty(i)) {
            return false;
        }
    }
    return true;
}

function outputBugData() {
    /* First combine duplicate bugs. */
    var plugins = {};
    for (var i in hashmap) {
        if (plugins.hasOwnProperty(hashmap[i].name)) {
            plugins[hashmap[i].name] = plugins[hashmap[i].name].concat(hashmap[i].comments);
        } else if (hashmap[i].comments.length > 0) {
            plugins[hashmap[i].name] = hashmap[i].comments;
        }
    }
    
    resultsDiv.textContent = '';
    for (var i in plugins) {
        
        var text = '  - name: ' + JSON.stringify(i) + '\n';
        
        if (plugins[i].length > 0) {
            text += '    url:\n';
        }
        
        var urls = [];
        for (var j in plugins[i]) {
            if (urls.indexOf(plugins[i][j]) == -1) {
                text += '      - ' + JSON.stringify(plugins[i][j]) + '\n';
            }
            urls.push(plugins[i][j]);
        }
        
        resultsDiv.textContent += text + '\n';
    }
}
function processBugComments() {
    if (this.status == 200 && JSON.parse(this.responseText).error == null) {
        var response = JSON.parse(this.responseText);
        if (!isEmpty(response.result.bugs)) {
            for (var i in response.result.bugs) {
                for (var j in response.result.bugs[i].comments) {
                    hashmap[i].comments.push(response.result.bugs[i].comments[j].text);
                }
            }
            outputBugData();
        } else { 
            console.log("No bug comments found.");
            resultsDiv.textContent = "No bug comments found.";
        }
    } else {
        console.log("Error while getting bug comments list.");
        resultsDiv.textContent = "Error while getting bug comments list.";
    }
}
function processBugIDs() {
    if (this.status == 200 && JSON.parse(this.responseText).error == null) {
        var response = JSON.parse(this.responseText);
        if (response.result.bugs.length > 0) {
            /* Now we have an array of bug objects. However, the info in these objects doesn't include comments, so that'll have to be gotten for the bugs. */
            var ids = [];
            for (var i in response.result.bugs) {
                var id = response.result.bugs[i].id;
                ids.push(id);
                hashmap[id] = {
                    "name": response.result.bugs[i].summary,
                    "comments": []
                };
            }
            
            var date = dateInput.value;
            if (!date) {
                date = '2009-09-09';
            }
            
            var req = {
                "Bugzilla_login": "bossguest@darkcreations.org",
                "Bugzilla_password": "bosspassword",
                "method": "Bug.comments",
                "id": 2,
                "params": [{
                    "ids": ids,
                    "new_since": date + 'T00:00:00Z'
                }]
            };
            
            console.log("Getting comments for bugs...");
            resultsDiv.textContent = "Getting comments for bugs...";
            
            try {
                this.onload = processBugComments;
                this.open('POST', url, true);
                this.setRequestHeader('Content-Type', 'application/json');
                this.send(JSON.stringify(req));
            } catch (err) {
                console.log("Error while getting bug list: " + err.message);
                resultsDiv.textContent = "Error while getting bug list: " + err.message;
            }
            
        } else { 
            console.log("No bugs found.");
            resultsDiv.textContent = "No bugs found.";
        }
    } else {
        console.log("Error while getting bug list.");
        console.log(this.response);
        resultsDiv.textContent = "Error while getting bug list.";
    }
}

function onExtractInit(evt) {

    if (evt.keyCode != 0 && evt.keyCode != 13) {
        return;
    }
    
    var date = dateInput.value;
    if (!date) {
        date = '2009-09-09';
    }
    
    var req = {
        "Bugzilla_login": "bossguest@darkcreations.org",
        "Bugzilla_password": "bosspassword",
        "method": "Bug.search",
        "id": 1,
        "params": [{
            "product": "BOSS",
            "component": gameSelect.value,
            "last_change_time": date + 'T00:00:00Z',
            "resolution": resolutionSelect.value
        }]
    };
    console.log("Getting bug list...");
    resultsDiv.textContent = "Getting bug list...";
    
    try {
        var xhr = new XMLHttpRequest();
        xhr.onload = processBugIDs;
        xhr.open('POST', url, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify(req));
    } catch (err) {
        console.log("Error while getting bug list: " + err.message);
        resultsDiv.textContent = "Error while getting bug list: " + err.message;
    }
}

/* Fill the drop-down games box with stuff. */
for (var i in games) {
    var option = document.createElement('option');
    option.innerText = games[i];
    option.setAttribute('value', games[i]);
    gameSelect.appendChild(option);
}

searchButton.addEventListener("click", onExtractInit, false);
document.body.addEventListener("keypress", onExtractInit, false);