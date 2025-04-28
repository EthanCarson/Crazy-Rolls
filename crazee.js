"use strict";
//Page elements
document.querySelector("button").addEventListener("click", rollDice);
//document.querySelector("form").onsubmit = submitForm;

const diceDiv = document.querySelector("#dice");
const reserveDiv = document.querySelector("#reserve");
const scoreSpan = document.querySelector("#score");
const logDiv = document.querySelector("#log");

const scoreForm = document.querySelector("#scoreForm");
// Disable ALL inputs by default
scoreForm.querySelectorAll("input").forEach((input) => {
    input.disabled = true;
});
scoreForm.addEventListener("change", updateSubmit);

//a Dice class for each of the 5 dice.
//Used for simple tracking of reserved dice, rolling, and HTML generation
class Dice {
    constructor() {
        this.value = this.roll();
        this.isReserved = false;
    }

    roll() {
        this.value = Math.floor(Math.random() * 6 + 1);
    }
    changeReserve() {
        this.isReserved = !this.isReserved; //Reverse the state
        PlayFeild.updatePlayDice();
        PlayFeild.updateReserve();
    }
    generateHTML(destination) {
        const dieP = makePageElement("p", this.value, destination);
        dieP.addEventListener("click", () => {
            this.changeReserve();
        }); //Arrow syntax is needed here to call this function with the proper this.
    }
}

//This PlayFeild object contains all vital properties of the play feild, including the dice at play, sortment for reserved dice, adding an element to the feild, alerting the user, and so on
const PlayFeild = {
    //Fastest way I found to do this, creates an array of length 5 where each value is created with the Dice class.
    dice: Array.from({length: 5}, () => {
        return new Dice();
    }),
    playDice: [],
    reserve: [],
    rollNum: 0, //Counter to store number of rolls in turn
    turnNum: 1, //Counter to store turn number;

    getPlayDice() {
        this.playDice = this.dice.filter((die) => !die.isReserved);
    },
    getReserve() {
        this.reserve = this.dice.filter((die) => die.isReserved);
    },
    messageLog(message) {
        logDiv.innerHTML = "";
        makePageElement("p", message, logDiv);
    },
    updatePlayDice() {
        this.getPlayDice();
        diceDiv.innerHTML = "";
        for (let die of this.playDice) {
            die.generateHTML(diceDiv);
        }
    },
    updateReserve() {
        this.getReserve();
        reserveDiv.innerHTML = "";
        for (let die of this.reserve) {
            die.generateHTML(reserveDiv);
        }
    },

    //This is the BIG one
    updateScores() {
        const diceValues = PlayFeild.dice.map((die) => die.value);

        // Enable single number scores (ones through sixes)
        for (let i = 1; i <= 6; i++) {
            const hasNumber = diceValues.some((die) => die === i);
            scoreForm.querySelector(`input[value="${i}"]`).disabled = !hasNumber;
        }

        // Count occurrences of each die value
        const counts = new Array(6).fill(0); // array of 6 0s
        for (let die of diceValues) {
            counts[die - 1]++; // Increment the count for this die value
        }

        // Multiple of a kind checks
        scoreForm.querySelector("#threeKind").disabled = !counts.some((value) => value >= 3);
        scoreForm.querySelector("#fourKind").disabled = !counts.some((value) => value >= 4);

        // Full house check
        scoreForm.querySelector("#fullHouse").disabled = !(counts.includes(3) && counts.includes(2));

        // Check for straights
        const smalls = [
            [ 1, 2, 3, 4 ],
            [ 2, 3, 4, 5 ],
            [ 3, 4, 5, 6 ],
        ];

        const larges = [
            [ 1, 2, 3, 4, 5 ],
            [ 2, 3, 4, 5, 6 ],
        ];

        // Check if any small straight pattern exists in the dice
        for (let smallArray of smalls) {
            /*
             I could maybe simplify this farther, but I struggled a bit with this part,
             so I am fine leaving it as is.
             */
            if (smallArray.every((value) => diceValues.includes(value))) {
                scoreForm.querySelector("#small").disabled = false;
                break; //We found a straight, stop iterating.
            }
        }

        // Check if any large straight pattern exists in the dice
        for (let largeArray of larges) {
            if (largeArray.every((value) => diceValues.includes(value))) {
                scoreForm.querySelector("#large").disabled = false;
                break;
            }
        }

        //If all 5 values match, enable the Crazee!
        scoreForm.querySelector("#crazee").disabled = !diceValues.every((value) => value === diceValues[0]); //Enabled if every value matches the first.

        //Always enable the chance
        scoreForm.querySelector("#chance").disabled = false;

        //Finally, disable any score options previously used
        //TODO: Implement this functionality once the tracking of game turns and storage is better implemented.
    },
};

//Below are any functions not specific to one object and/or called by something other than an object.
function makePageElement(element, text, destination) {
    const pageElement = document.createElement(`${element}`);
    pageElement.textContent = text;
    destination.append(pageElement); //append the destination an element with text content
    return pageElement;
}
function rollDice() {
    if (PlayFeild.rollNum >= 3) {
        PlayFeild.messageLog("You already rolled 3 times this turn!");
        return;
    }

    for (let die of PlayFeild.rollNum === 0 ? PlayFeild.dice : PlayFeild.playDice) {
        //This is kinda akward, but the first time ONLY do I want to roll all dice.
        die.roll(); //Make a roll for each of the 5 die.
    }
    PlayFeild.rollNum++; //We roled the dice, so increment this to track that.
    PlayFeild.updatePlayDice(); //Now the dice are rolled, update the rolled display.
    PlayFeild.updateScores(); //Time to ensure the avalible scores match.
}
function updateSubmit() {
    //Enable submit as long as one input is checked.
    const radios = scoreForm.querySelectorAll('input[type="radio"]');
    scoreForm.querySelector(`input[type="submit"]`).disabled = !Array.from(radios).some((radio) => radio.checked);
}
