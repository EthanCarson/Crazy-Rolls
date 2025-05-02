"use strict";

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

//2. Score. This handles all logic specific to the score data.

class Score {
    constructor() {
        this.currentScore = 0;
        this.usedScoreTypes = [];
        this.scoreValues = {};
    }

    calculateForType(scoreType, diceValues) {
        let total = 0; // Initialize total outside the switch
        switch (scoreType) {
            case "1":
            case "2":
            case "3":
            case "4":
            case "5":
            case "6":
                const targetValue = +scoreType;
                //For most of these sums, I am using array.reduce. In simple terms, this reduces the array down to a single number, in most cases being a way to sum up the values within an array, altough there are other applications.
                total = diceValues.reduce(
                    (sum, die) => {
                        return die === targetValue ? sum + die : sum;
                    },
                    // initialValue = 0
                    0
                );
                break;
            //Funny huh? The reduce function accepts 2 parameters, with one being a function that itself accepts up to 4 parameters, being accumulator, value, index, array. Most of the time only 2 are needed.
            case "threeKind":
            case "fourKind":
            case "chance":
                total = diceValues.reduce((sum, die) => {
                    return sum + die; //Add each die to the sum.
                }, 0);
                break;
            //The remainder of the scores are all trivial.
            case "fullHouse":
                total = 25;
                break;
            case "small":
                total = 30;
                break;
            case "large":
                total = 40;
                break;
            case "crazee":
                total = 50;
                break;
            case "default":
                console.error("Invalid score type sent");
                return; //STOP RUNNING CODE IF THIS HAPPENS
        }
        //TODO: Maybe add Crazee bonuses as scores.
        //TODO: Store Selecrted Score Type for future use
        //TODO: Store score.
        return total;
    }

    submitScore(scoreType, diceValues) {
        const score = this.calculateForType(scoreType, diceValues);
        this.currentScore += score;
        this.usedScoreTypes.push(scoreType);
        return score;
    }

    // getAvalibleScoreTypes() {
    //     //Even more logic
    // }
}
//3. Game state Manager. This handles all internal logic needed for the game to run.

class GameState {
    constructor() {
        this.dice = Array.from({length: 5}, (_, i) => new Die(i)); //Pull just the index from it, not the value.
        this.score = new Score();
        this.turnNum = 1;
        this.rollNum = 0;
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
}

//4. Storage Handler: Stores and loads data to and from local storage.
//Actually making this an object literal seeing as we only need the object itself and not a specific instance per game or anything like that.
const StorageHandler = {
    isAvailable() {
        try {
            const testKey = "_test";
            localStorage.setItem(testKey, testKey);
            localStorage.removeItem(testKey);
            return true;
        } catch (error) {
            console.warn("Local storage is not available.");
            return false;
        }
    },

    saveGame(gameSate) {
        if (!this.isAvailable()) return false;

        const saveData = {
            dice: GameState.dice,
            currentScore: gameSate.currentScore,
            turnNum: GameState.turnNum,
            rollNum: GameState.rollNum,
            usedScoreTypes: GameState.usedScoreTypes,
        };

        localStorage.setItem("saveData", JSON.stringify(saveData));
        return true;
    },

    loadGame(gameState) {
        if (!this.isAvailable()) return false;

        const saveData = localStorage.getItem("saveData");
        if (!saveData) return false;

        const data = JSON.parse(saveData);

        // Restore basic properties
        gameState.currentScore = data.currentScore;
        gameState.turnNum = data.turnNum;
        gameState.rollNum = data.rollNum;
        gameState.usedScoreTypes = data.usedScoreTypes;
        gameState.dice = data.dice;

        return true;
    },
};

//5. UIControl. This object holds and updates all DOM elements.
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

        //Initialize Event Listeners
        this.rollButton.addEventListener("click", () => this.handleRollClick());
        this.scoreForm.addEventListener("change", () => this.updateSubmitButton());
        this.scoreForm.addEventListener("submit", (e) => this.handleScoreSubmit(e));

        //Update UI on start
        this.updateUI();
    }

    handleRollClick() {
        const didRoll = this.gameState.rollDice();
        if (didRoll) {
            this.updateUI();
        } else {
            this.showMessage("You can not roll any more this turn!");
        }
    }
    handleScoreSubmit(e) {
        e.preventDefault();
        const didScore = this.gameState.score.submitScore(this.scoreForm.querySelector(`input[checked="true"]`).value), this.gameState);
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
        this.scoreForm.querySelector('input[type="submit"]');
        //Logic to enable or disable button
    }

    showMessage(message) {
        this.logDiv.innerHTML = "";
        const p = document.createElement("p");
        p.textContent = message;
        this.logDiv.appendChild(p);
    }
}

//6.CrazeeGame. This object is our motherboard. It traces all these elements together and runs them appropiately.

class CrazeeGame {
    constructor() {
        this.gameState = new GameState();
        this.ui = new GamepadHapticActuator(this.gameStte);

        //Load Saved game
        StorageHandler.loadGame(this.gameState);
        this.ui.updateUI();
    }
}

//Initialiaze
const game = new CrazeeGame();
