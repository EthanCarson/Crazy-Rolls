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
        const diceValues = PlayFeild.dice.map((die) => die.value);
        //The approach now is to selectively enable components.
        //If a score type has already been used, disable it.
        //TODO - Update this feature once the score data is set up

        //If none of the dice rolls contain the desired number (ones-sixes), disable the option on the score card.
        for (let i = 1; i <= 6; i++) {
            const hasNumber = diceValues.some((die) => die === i);
            hasNumber && (scoreForm.querySelector(`input[value="${i}"]`).disabled = false);
            //In human terms, this checks if any value of the array matches i, and disables the coreesponding form input if there are no shared values.
        }

        const counts = new Array(6).fill(0); //array of 6 0s
        for (let i = 0; i < 6; i++) {
            for (let die of diceValues) {
                die === i + 1 && counts[i]++;
            }
        }
        /*
        This fills counts into an array where each value represents the count of the index number + 1 in dice.
        ex. If there are 3 2s in dice, the index 1 in counts will have the value 3.
        */

        //These are the multiple of a kind checks
        scoreForm.querySelector("#threeKind").disabled = !counts.some((value) => value >= 3); //Enabled if any count in counts is 3 or greater.
        scoreForm.querySelector("#fourKind").disabled = !counts.some((value) => value >= 4);

        scoreForm.querySelector("#fullHouse").disabled = !(counts.includes(3) && counts.includes(2)); //Enabled if The counts include both 3 and 2
        //console.log(counts);

        //Check for a small and large straight
        const smalls = {
            small1: [ 1, 2, 3, 4 ],
            small2: [ 2, 3, 4, 5 ],
            small3: [ 3, 4, 5, 6 ],
        };
        const larges = {
            large1: [ 1, 2, 3, 4, 5 ],
            large2: [ 2, 3, 4, 5, 6 ],
        };
        for (let small in smalls) {
            scoreForm.querySelector("#small").disabled = !small.every((value) => diceValues.includes(value)); //Enabled if every value in one of the smalls is found in the die array.
        }
        for (let large in larges) {
            scoreForm.querySelector("#large").disabled = !large.every((value) => diceValues.includes(value));
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
    PlayFeild.updateScores(); //Time to ensure the avalible scores match.
}
