// ==UserScript==
// @name		Auto-Trooops
// @author      Leonardo
// @description Evita di farsi collerare hehe
// @include		https://*.grepolis.com/game/*
// ==/UserScript==


// da aggiungere
// segnare quando messo in coda
// sistemare altre risorse
// delete button
// aggiunta la coda
(function() {
    'use strict';
    var polis_units = {}
    var delai = 10;

    function updateIndicator() {
        if (polis_units[Game.townId] != null) {
            for (let key in polis_units[Game.townId]) {
                if (key != null) {
                    let current_troops = document.getElementById(key);
                    if (current_troops == null) return;
                    let child = current_troops.getElementsByClassName("unit unit_order_unit_image unit_icon50x50");
                    if (polis_units[Game.townId][key] == 0) {
                        child[0].firstElementChild.innerText = "0";
                    } else {
                        child[0].firstElementChild.innerText = "+" + polis_units[Game.townId][key];
                    }
                } else {
                    let current_troops = document.getElementById(key);
                    let child = current_troops.getElementsByClassName("unit unit_order_unit_image unit_icon50x50");
                    child[0].firstElementChild.innerText = "0";
                }
            }
        }
    }

    $(document).on("click",".unit_tab", function() {
        updateIndicator();
    });

    // append auto button
    $(document).ajaxComplete(function() {
        updateIndicator();
        if (document.getElementById("unit_order_count") == null) return;
        if (document.getElementById("autoTropsButton") == null) {
            let butt = document.createElement("div");
            butt.className = "button_new";
            butt.id = "autoTropsButton";
            butt.style = "float: right; margin: 0px; left: -87px; position: absolute; top: 93px;";
            butt.innerHTML = '<div class="left"></div><div class="right"></div><div class="caption js-caption"> Auto <div class="effect js-effect"></div></div>';
            document.getElementById("unit_order_count").appendChild(butt);
            let inpu = document.createElement("input");
            inpu.className = "";
            inpu.id = "autoTropsInput";
            inpu.style = "float: right; margin: 0px; left: -20px; position: absolute; top: 93px; height: 17px; border: 0px; text-align: center; padding: 3px; width: 52px; background: url(https://gpit.innogamescdn.com/images/game/barracks/input.png) no-repeat";
            document.getElementById("unit_order_count").appendChild(inpu);
        }
    });

    // add action to the button
    $(document).on("click","#autoTropsButton", function() {
        let current_polis = Game.townId;
        let current_troops = document.getElementsByClassName("unit_order_tab bold unit_active")[0].id.substr(15);
        let count = document.getElementById("autoTropsInput").value;
        let egual;
        if (count[0] == "=") {
            count = parseInt(count.substr(1));
            egual = true;
        } else {
            count = parseInt(count);
            egual = false;
        }
        // add polis to the list if not present
        if (polis_units[current_polis] == null) {
            polis_units[current_polis] = {};
        }
        // remove if count = 0
        let to_do = 0;
        if (count == 0) {
            delete polis_units[current_polis][current_troops];
        } else {
            if (egual) {
                let current_units = ITowns.towns[current_polis].getLandUnits()[current_troops];
                to_do = count - current_units;
            } else {
                to_do = count;
            }
        }

        // check that current quantities is duable
        let popolation = ITowns.towns[current_polis].getAvailablePopulation();
        let current_in_list = 0;
        // check for others unit in list
        for (let i in polis_units[current_polis]) {
            if (i != null) {
                if (i != current_troops) {
                    current_in_list += polis_units[current_polis][i]*GameData.units[i].population;
                }
            }
        }

        if ((popolation - current_in_list)/GameData.units[current_troops].population >= to_do) {
            polis_units[current_polis][current_troops] = to_do;
        } else {
            polis_units[current_polis][current_troops] = parseInt((popolation - current_in_list)/GameData.units[current_troops].population);
        }
        // update the user
        updateIndicator();
    });

     function calculateAmmount(troop) {
        let is_Naval = GameData.units[troop].is_naval
        if (!is_Naval) {
            BarracksWindowFactory.openBarracksWindow();
        }
        else {
            DocksWindowFactory.openDocksWindow()
        }
            let min = document.getElementById(`unit_order_max_build_${troop}`).innerText.substr(1);
            console.log(min);
        return parseInt(min)
    }

    function buildPost(polis, unit, count) {
        console.log(count)
        let data = {
            "unit_id":unit,
            "amount":count,
            "town_id":polis
        };
        gpAjax.ajaxPost("building_docks", "build", data);
        HumanMessage.success("Recrutement de " + count + " " + GameData.units[unit].name);
    }

    function checkStorage(polis, troop) {
        let storage = ITowns.towns[polis].getStorage();
        storage = storage/100;
        let wood = ITowns.towns[polis].resources().wood/GameData.units[troop].resources.wood
        let stone = ITowns.towns[polis].resources().stone/GameData.units[troop].resources.stone
        let iron = ITowns.towns[polis].resources().iron/GameData.units[troop].resources.iron
        let min = parseInt(Math.min(wood, stone, iron));
        let max_resources = Math.max(GameData.units[troop].resources.wood, GameData.units[troop].resources.stone, GameData.units[troop].resources.iron);
        let checker = parseInt(storage/max_resources);
        if (min >= checker) {
            return true;
        }
        return false;
    }


    function checkCoda(polis, troop) {
        // if troop not in coda, return;
        if (polis_units[polis][troop] == null) return;
        // if storage not full
        if (!checkStorage(polis, troop, 95)) {
            let ammount = calculateAmmount(troop);
            if (ammount >= polis_units[polis][troop]) {
                buildPost(polis, troop, polis_units[polis][troop]);
                delete polis_units[polis][troop];
                updateIndicator();
            }
            return;
        }
        else {
        let ammount = calculateAmmount(troop);
        if (ammount > polis_units[polis][troop]) {
            buildPost(polis, troop, polis_units[polis][troop]);
            delete polis_units[polis][troop];
            updateIndicator();
        } else {
            buildPost(polis, troop, ammount);
            polis_units[polis][troop] -= ammount;
            updateIndicator();
            return;
        }
     }
    }
    // check if enought materials are in polis
    function check(polis) {
        // check if quee is full --> has to be fixed with land or sea
        let quee = ITowns.towns[polis].getUnitOrdersCollection().models.length;
        if (quee >= 7) {
            delete polis_units[polis];
            return;
        }

        checkCoda(polis, "catapult"); // catapult has priority
        for (let troop in polis_units[polis]) {
            if (troop != null) {
                checkCoda(polis, troop);
            }
        }
    }
    // define main function
    function main() {
        if (polis_units.length == 0) return;
        for (let key in polis_units) {
            if (key != null) {
                //console.log(checkStorage(key, "sword", "95"));
                check(key);
                console.log("Check for recruit");
            }
        }
    }

    // call main
    setInterval(main, delai * 1000);
})();

// tipo terra
// ITowns.towns[Game.townId].getUnitOrdersCollection().models[2].attributes.kind
// unità
// ITowns.towns[Game.townId].getUnitOrdersCollection().models[2].attributes.unit_type
// ITowns.towns[Game.townId].getUnitOrdersCollection().models[0].attributes.units_left
// ITowns.towns[polis].casted_powers_collection.models



