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

//Core objects for the game.

//1. The die. Keeps data for everything you need to know about a die and how to use it.
class Die {
    constructor(id) {
        this.id = id;
        this.value = 0;
        this.isReserved = false;
        this.roll(); //Update die's value immediately
    }

    roll() {
        this.value = Math.floor(Math.random() * 6 + 1);
    }

    toggleReserved() {
        this.isReserved = !this.isReserved;
        //Come back here later to update UI
    }
}

//2. Game state Manager. This handles all internal logic needed for the game to run.

class GameState {
    constructor() {
        this.dice = Array.from({length: 5}, (_, i) => new Die(i)); //Pull just the index from it, not the value.
        this.currentScore = 0;
        this.turnNum = 1;
        this.rollNum = 0;
        this.usedScoreTypes = [];
    }

    getActiveDice() {
        return this.dice.filter((die) => !die.isReserved);
    }

    getReservedDice() {
        return this.dice.filter((die) => die.isReserved);
    }

    rollDice() {
        if (this.rollNum >= 3) {
            return false;
        }

        for (let die of this.rollNum === 0 ? this.dice : this.getActiveDice()) {
            //This is kinda akward, but the first time ONLY do I want to roll all dice.
            die.roll(); //Make a roll for each of the 5 die.
        }
        this.rollNum++; //We roled the dice, so increment this to track that.
        return true;
    }

    calculateScoreForType(scoreType) {
        const diceValues = this.dice.map((die) => die.value);
        //Logic
    }

    submitScore(scoreType) {
        //Logic
    }

    getAvalibleScoretTypes() {
        //More logic
    }
}

//3. Storage Handler: Stores and loads data to and from local storage.
class StorageHandler {
    static isAvailable() {
        try {
            const testKey = "_test";
            localStorage.setItem(testKey, testKey);
            localStorage.removeItem(testKey);
            return true;
        } catch (error) {
            return false;
        }
    }

    static saveGame(gameSate) {
        if (!this.isAvailable()) return false;

        const saveData = {
            dice: GameState.dice.map((die) => ({
                value: die.value,
                isReserved: die.isReserved,
            })),
            currentScore: gameSate.currentScore,
            turnNum: GameState.turnNum,
            rollNum: GameState.rollNum,
            usedScoreTypes: GameState.usedScoreTypes,
        };

        localStorage.setItem("saveData", JSON.stringify(saveData));
        return true;
    }

    static loadGame(gameState) {
        if (!this.isAvailable()) return false;

        const saveData = localStorage.getItem("yahtzeeSave");
        if (!saveData) return false;

        const data = JSON.parse(saveData);

        // Restore basic properties
        gameState.currentScore = data.currentScore;
        gameState.turnNum = data.turnNum;
        gameState.rollNum = data.rollNum;
        gameState.usedScoreTypes = data.usedScoreTypes;

        // Restore dice state
        if (data.dice && data.dice.length === gameState.dice.length) {
            data.dice.forEach((dieData, index) => {
                gameState.dice[index].value = dieData.value;
                gameState.dice[index].isReserved = dieData.isReserved;
            });
        }

        return true;
    }
}

//4. UIControl. This object holds and updates all DOM elements.
class UIControl {
    constructor(gameState) {
        this.gameState = gameState;

        //Store DOM elements
        this.diceDiv = document.querySelector("#dice");
        this.reserveDiv = document.querySelector("#reserve");
        this.scoreSpan = document.querySelector("#score");
        this.logDiv = document.querySelector("#log");
        this.scoreForm = document.querySelector("#scoreForm");
        this.rollButton = document.querySelector("button");

        //Initialize
        this.setupEventListeners();
        this.updateUI();
    }
    setupEventListeners() {
        // Roll button
        this.rollButton.addEventListener("click", () => this.handleRollClick());

        // Score form
        this.scoreForm.addEventListener("change", () => this.updateSubmitButton());
        this.scoreForm.addEventListener("submit", (e) => this.handleScoreSubmit(e));
    }

    handleRollClick() {
        //Logic to check if roll was true and then assigning message
    }

    handleScoreSubmit(e) {
        //Logic
        //May move this
    }

    createDieElement(die) {
        //create a die L
    }

    updateUI() {
        this.updateDiceDisplay();
        this.updateScoreOptions();
        this.updateScoreDisplay();
    }

    updateDiceDisplay() {
        // Update active dice
        this.diceDiv.innerHTML = "";
        this.gameState.getActiveDice().forEach((die) => {
            this.diceDiv.appendChild(this.createDieElement(die));
        });

        // Update reserved dice
        this.reserveDiv.innerHTML = "";
        this.gameState.getReservedDice().forEach((die) => {
            this.reserveDiv.appendChild(this.createDieElement(die));
        });
    }

    updateScoreDisplay() {
        this.scoreSpan.textContent = this.gameState.currentScore;
    }

    updateSubmitButton() {
        const submitButton = this.scoreForm.querySelector('input[type="submit"]');
        //Logic to enable or disable button
    }

    showMessage(message) {
        this.logDiv.innerHTML = "";
        const p = document.createElement("p");
        p.textContent = message;
        this.logDiv.appendChild(p);
    }
}

//5.CrazeeGame. This object is our motherboard. It traces all these elements together and runs them appropiately.

class CrazeeGame {
    constructor() {
        this.gameSate = new GameState();
        this.ui = new GamepadHapticActuator(this.gameSate);

        //Load Saved game
        StorageHandler.loadGame(this.gameSate);
        this.ui.updateUI();
    }
}

//Initialiaze
const game = new CrazeeGame();
