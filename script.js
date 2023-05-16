



function calc_suggested_numplayers (best, currentValue) {
    if (parseInt(currentValue.getAttribute("numvotes")) >= parseInt(best.getAttribute("numvotes"))) {
        return currentValue;
    } else {
        return best;
    }
}

function image_players(value) {
    switch (value) {
        case 'Best':
            return `<img class="game-img" src="verde.png" width = 20px height=20px object-fit: fill>`
        case 'Recommended':
            return `<img class="game-img" src="amarillo.png" width = 20px height=20px object-fit: fill>`
        case 'Not Recommended':
            return `<img class="game-img" src="rojo.png" width = 20px height=20px object-fit: fill>`
        default:
            return `<img class="game-img" src="gris.png" width = 20px height=20px object-fit: fill>`
    }

}

function change_selected_players() {
    var players = parseInt(document.getElementById("list-of-players").value);
    document.getElementById('game-list').innerHTML = '';
    load_games(players);
}

function load_games(players) {
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

        for(var i =0; i< gameIDs.length; i++) {
            var id = gameIDs[i];

            fetch("https://boardgamegeek.com/xmlapi2/thing?id="+id)
            .then(response => response.text())
            .then((data) => {

                xml = parser.parseFromString(data, "text/xml"); 
                var gameID = xml.getElementsByTagName("item")[0].getAttribute("id");
                var name = xml.getElementsByTagName("name")[0].getAttribute("value");
                var minPlayers = parseInt(xml.getElementsByTagName("minplayers")[0].getAttribute("value"));
                var maxPlayers = parseInt(xml.getElementsByTagName("maxplayers")[0].getAttribute("value"));
                var imgUrl = xml.getElementsByTagName("image")[0].innerHTML;

                //players
                var suggestion = "Not Playable";
                var numPlayersDiv = ''
                var suggested_numplayers = xml.getElementsByName("suggested_numplayers")[0].children;
                for(var p = 0; p < suggested_numplayers.length; p++) {
                    var numplayers = parseInt(suggested_numplayers[p].getAttribute("numplayers"));
                    if (numplayers < minPlayers) {
                        numPlayersDiv += '<li>' + image_players("Not playable") + '</li>';
                    } else { 
                        if (numplayers <= maxPlayers) {
                            best_fit = Array.from(suggested_numplayers[p].children).reduce(calc_suggested_numplayers);
                            numPlayersDiv += '<li>' + image_players(best_fit.getAttribute("value")) + '</li>'; 
                        }
                        if (numplayers == players) {
                            suggestion = best_fit.getAttribute("value"); 
                        }
                    }

                    

                    if (numplayers == maxPlayers) {
                        break;
                    }
                }
                
                if (suggestion != "Not Playable" || players == 0) {
                    var div = document.createElement('div');
                    div.classList.add('game-item', "suggestion-"+ suggestion.toLowerCase().replace(' ','-'));
                    div.innerHTML = `
                        <a href="https://boardgamegeek.com/boardgame/${gameID}"><img class="game-img" src=${imgUrl} width = 150px height=150px object-fit: fill></a>
                        <div class="game-info">
                            <h2>${name}</h2>
                            <ul>
                                ${numPlayersDiv}
                            </ul>
                        </div>
                    `;
                    document.getElementById('game-list').appendChild(div);
                }

            });
        }
    });
}


load_games(0);