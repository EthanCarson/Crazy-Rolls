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
        //The approach now is to selectively enable components.
        //If a score type has already been used, disable it.
        //TODO - Update this feature once the score data is set up

        //If none of the dice rolls contain the desired number (ones-sixes), disable the option on the score card.
        for (let i = 1; i <= 6; i++) {
            const hasNumber = PlayFeild.dice.some((die) => die.value === i);
            hasNumber && (scoreForm.querySelector(`input[value="${i}"]`).disabled = false);
            //In human terms, this checks if any value of the array matches i, and disables the coreesponding form input if there are no shared values.
        }

        //If the same value repeats for 3 dice, enable 3 of a kind

        const multipleKindCheck = PlayFeild.dice.reduce((acc, die) => {
            const value = die.value;
            acc.set(value, (acc.get(value) || 0) + 1);
            return acc;
        }, new Map());
        // This part uses the reduce method to create a Map that counts the occurrences of each unique die value.
        // The accumulator (acc) stores each die value as a key and its count as the value.
        // acc.get(value) checks if we have already counted this value, and if not, Starts the count at 1.
        // The final result is a new array with the original value as the key and the count as the value.

        //Essentially, this is just the easiest way for me to check for Three and Four of a kinds.
        const multipleArray = Array.from(multipleKindCheck.values());
        //Calling these values into an array simply because its easier for my understanding.

        //Now that we have an array, I can use some to 
        if (multipleArray.some((count) => count >= 3)) {
            scoreForm.querySelector("threeOfAKind").disabled = false;
        }
        if (multipleArray.some((count) => count >= 4)) {
            scoreForm.querySelector("fourOfAKind").disabled = false;
        }
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
}
