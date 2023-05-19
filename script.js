
var players = 0;
var gameList = [];
load_games();


function load_games() {
    fetch("https://boardgamegeek.com/xmlapi2/collection?username=wesnet")
    .then(response => response.text())
    .then((data) => {
        let parser = new DOMParser(), 
        xml = parser.parseFromString(data, "text/xml"); 
        
        games = xml.getElementsByTagName("item")
        var gameIDs = [];
        for(var i =0; i< games.length; i++) {
            var game = games[i];
            if (game.getElementsByTagName("status")[0].getAttribute("own") == 1) {
                gameIDs.push(game.getAttribute("objectid"));
            }
        }
        return gameIDs;
    }).then( (gameIDs) => {
        load_games_info(gameIDs);
    });
}

function load_games_info(gameIDs) {
    var games = [];
    var promises = [];
    
    console.log("RELOAD LIST");
    for(var i =0; i<gameIDs.length; i++) {

        const promise = fetch("https://boardgamegeek.com/xmlapi2/thing?id="+gameIDs[i]+"&stats=1")
        .then(response => response.text())
        .then((data) => {

            let parser = new DOMParser(), 
            xml = parser.parseFromString(data, "text/xml");

            players_votes = new Object();
            minPlayers= parseInt(xml.getElementsByTagName("minplayers")[0].getAttribute("value"));
            maxPlayers= parseInt(xml.getElementsByTagName("maxplayers")[0].getAttribute("value"));
            
            var suggested_numplayers = xml.getElementsByName("suggested_numplayers")[0].children;
            for(var p = 0; p < suggested_numplayers.length; p++) {
                var suggestion = "Not Playable";
                var numplayers = parseInt(suggested_numplayers[p].getAttribute("numplayers"));
                if (numplayers < minPlayers) {
                    suggestion = "Not Playable";
                } else { 
                    if (numplayers <= maxPlayers) {
                        best_fit = Array.from(suggested_numplayers[p].children).reduce(calc_suggested_numplayers);
                        suggestion = best_fit.getAttribute("value"); 
                    }
                    if (numplayers == players) {
                        suggestion = best_fit.getAttribute("value"); 
                    }
                }
                players_votes[numplayers] = suggestion;
                if (numplayers >= maxPlayers) {
                    break;
                }
                
            }

            const game = {
                gameID: xml.getElementsByTagName("item")[0].getAttribute("id"),
                name: xml.getElementsByTagName("name")[0].getAttribute("value"),
                minPlayers: parseInt(xml.getElementsByTagName("minplayers")[0].getAttribute("value")),
                maxPlayers: parseInt(xml.getElementsByTagName("maxplayers")[0].getAttribute("value")),
                averageweight: parseFloat(xml.getElementsByTagName("averageweight")[0].getAttribute("value")),
                imgUrl: xml.getElementsByTagName("image")[0].innerHTML,
                suggested_numplayers: players_votes
            };
            gameList.push(game);
        });
        promises.push(promise);
    }
    Promise.all(promises).then( () => {
        load_html();
    });
}

function load_html() {
    for(var i =0; i<gameList.length; i++) {

        if (players == 0 || get_recommendation_for(gameList[i], players) != "Not Playable") {
            
            var numPlayersDiv = '';
            for(var p = 1; p <= Object.keys(gameList[i]["suggested_numplayers"]).length; p++) {
                numPlayersDiv += '<li>' + image_players(gameList[i], p) + '</li>';
            }
        
            var div = document.createElement('div');
            if(players > 0 && players <= Object.keys(gameList[i]["suggested_numplayers"]).length) {
                div.classList.add('game-item', "suggestion-"+ gameList[i]["suggested_numplayers"][players].toLowerCase().replace(' ','-'));
            } else {
                div.classList.add('game-item');
            }
            div.innerHTML = `
                <a href="https://boardgamegeek.com/boardgame/${gameList[i]["gameID"]}"><img class="game-img" src=${gameList[i]["imgUrl"]} width = 150px height=150px object-fit: fill></a>
                <div class="game-info">
                    <h3>${gameList[i]["name"]}</h3>
                    <ul>
                        ${numPlayersDiv}
                    </ul>
                    <div class="averageweight-bar">
                        <span class="${color_weight(gameList[i]["averageweight"])}" style="--weight: ${gameList[i]["averageweight"]*100/5}%;">${gameList[i]["averageweight"].toFixed(2)}</span>
                    </div>
                </div>
            `;
            document.getElementById('game-list').appendChild(div);
        }
    }   
}

function calc_suggested_numplayers (best, currentValue) {
    if (parseInt(currentValue.getAttribute("numvotes")) >= parseInt(best.getAttribute("numvotes"))) {
        return currentValue;
    } else {
        return best;
    }
}

function image_players(game, p) {
    const value = get_recommendation_for(game, p);
    switch (value) {
        case 'Best':
            return `<img class="game-player-img" src="verde.png" width = 20px height=20px object-fit: fill>`
        case 'Recommended':
            return `<img class="game-player-img" src="amarillo.png" width = 20px height=20px object-fit: fill>`
        case 'Not Recommended':
            return `<img class="game-player-img" src="rojo.png" width = 20px height=20px object-fit: fill>`
        default:
            return `<img class="game-player-img" src="gris.png" width = 20px height=20px object-fit: fill>`
    }

}

function color_weight(weight) {
    if (weight < 2.5) { return "weight-green"};
    if (weight < 3.0) { return "weight-yellow"};
    if (weight < 3.5) { return "weight-orange"};
    return "weight-red";
}

function change_selected_players() {
    players = parseInt(document.getElementById("list-of-players").value);
    document.getElementById('game-list').innerHTML = '';
    load_html();
}

function get_recommendation_for(game, p) {
    if (p in game["suggested_numplayers"]) {
        return game["suggested_numplayers"][p];
    } else {
        return "Not Playable";
    }
}