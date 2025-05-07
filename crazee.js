"use strict";

//Core objects for the game.

//1. The die. Keeps data for everything you need to know about a die and how to use it.
class Die {
    constructor(id) {
        this.id = id;
        this.value = "";
        this.isReserved = false;
    }

    roll() {
        this.value = Math.floor(Math.random() * 6 + 1);
    }

    toggleReserved() {
        this.isReserved = !this.isReserved;
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
        return total;
    }

    submitScore(score, scoreType) {
        this.currentScore += score;
        this.usedScoreTypes.push(scoreType);
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
        StorageHandler.saveGame(this);
        return true;
    }

    startNewTurn() {
        this.turnNum++;
        this.rollNum = 0;
        this.dice = Array.from({length: 5}, (_, i) => new Die(i)); //Make some new die
        if (this.turnNum >= 14) {
            window.alert(`The game has ended!`);
            window.alert(`Final Score: ${this.score.currentScore}`);
            restartGame();
            return;
        }
    }
    restartGame() {
        this.turnNum = 1;
        this.score.usedScoreTypes = [];
        this.score.currentScore = 0;
        StorageHandler.clearStorage();
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

    saveGame(gameState) {
        if (!this.isAvailable()) return false;

        const saveData = {
            dice: gameState.dice,
            currentScore: gameState.score.currentScore,
            turnNum: gameState.turnNum,
            rollNum: gameState.rollNum,
            usedScoreTypes: gameState.score.usedScoreTypes,
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
        gameState.score.currentScore = data.currentScore;
        gameState.turnNum = data.turnNum;
        gameState.rollNum = data.rollNum;
        gameState.score.usedScoreTypes = data.usedScoreTypes;

        // Restore dice
        if (data.dice && data.dice.length === gameState.dice.length) {
            gameState.dice.forEach((die, index) => {
                Object.assign(die, data.dice[index]); // Copy properties from loaded data to existing Die instance
            });
        }

        return true;
    },
    clearStorage() {
        localStorage.clear();
    },
};

//5. UIControl. This object holds and updates all DOM elements.
class UIControl {
    constructor(gameState) {
        this.gameState = gameState;

        //Store DOM elements
        this.diceDiv = $("#dice");
        this.reserveDiv = $("#reserve");
        this.scoreSpan = $("#score");
        this.logDiv = $("#log");
        this.scoreForm = $("#scoreForm");
        this.rollButton = $("button");

        //Initialize Event Listeners
        $(this.rollButton).click(() => this.handleRollClick());
        $(this.scoreForm).change(() => this.updateSubmitButton());
        $(this.scoreForm).submit((e) => this.handleScoreSubmit(e));

        //Initialize Score UI
        this.scoreForm.find("input").prop("disabled", true);
        //Update UI on start
        this.updateUI();
    }

    handleRollClick() {
        const didRoll = this.gameState.rollDice();
        if (didRoll) {
            this.updateUI();
            this.updateScoreForm();
            StorageHandler.saveGame(this.gameState);
        } else {
            this.showMessage("You can not roll any more this turn!");
        }
    }
    handleScoreSubmit(e) {
        e.preventDefault();
        const checkedScore = this.scoreForm.find("input:checked");
        let calculatedScore;
        if (!checkedScore.hasClass("highlighted")) {
            calculatedScore = 0;
        } else {
            calculatedScore = this.gameState.score.calculateForType(
                checkedScore.val(),
                this.gameState.dice.map((die) => die.value)
            );
        }
        if (calculatedScore != undefined) {
            this.gameState.score.submitScore(calculatedScore, checkedScore.val());
            this.scoreForm.find("input").prop("checked", false).removeClass("highlighted").prop("disabled", true);
            this.gameState.startNewTurn();
            this.showMessage(`Turn ${this.gameState.turnNum}`);
            this.updateUI();
            StorageHandler.saveGame(this.gameState);
        } else {
            console.error("A problem occured in recording the score");
        }
    }

    createDieElement(die) {
        const dieElement = $(`<div data-die-id="${die.id}">${die.value}</div>`);
        dieElement.click(() => {
            die.toggleReserved();
            this.updateUI();
        });
        return dieElement;
    }

    updateAllUI() {
        this.updateDiceDisplay();
        this.updateScoreForm();
        this.updateScoreDisplay();
    }

    updateDiceDisplay() {
        // Update active dice
        $(this.diceDiv).html("");
        this.gameState.getActiveDice().forEach((die) => {
            this.diceDiv.append(this.createDieElement(die));
        });

        // Update reserved dice
        $(this.reserveDiv).html("");
        this.gameState.getReservedDice().forEach((die) => {
            this.reserveDiv.append(this.createDieElement(die));
        });
    }

    updateScoreForm() {
        this.scoreForm.find("input").removeClass("highlighted");
        this.scoreForm.find("input").prop("disabled", false);
        const diceValues = this.gameState.dice.map((die) => die.value);

        // Enable single number scores (ones through sixes)
        for (let i = 1; i <= 6; i++) {
            const hasNumber = diceValues.some((die) => die === i);
            hasNumber && this.scoreForm.find(`input[value="${i}"]`).addClass("highlighted");
        }

        // Count occurrences of each die value
        const counts = new Array(6).fill(0); // array of 6 0s
        for (let die of diceValues) {
            counts[die - 1]++; // Increment the count for this die value
        }

        // Multiple of a kind checks
        counts.some((value) => value >= 3) && this.scoreForm.find("#threeKind").addClass("highlighted");
        counts.some((value) => value >= 4) && this.scoreForm.find("#fourKind").addClass("highlighted");

        // Full house check) = !counts.some((value) => value >= 4);

        // Full house check
        counts.includes(3) && counts.includes(2) && this.scoreForm.find("#fullHouse").addClass("highlighted");

        // Check for straights
        const smalls = [
            [1, 2, 3, 4],
            [2, 3, 4, 5],
            [3, 4, 5, 6],
        ];

        const larges = [
            [1, 2, 3, 4, 5],
            [2, 3, 4, 5, 6],
        ];

        // Check if any small straight pattern exists in the dice
        for (let smallArray of smalls) {
            /*
     I could maybe simplify this farther, but I struggled a bit with this part,
     so I am fine leaving it as is.
     */
            if (smallArray.every((value) => diceValues.includes(value))) {
                this.scoreForm.find("#small").addClass("highlighted");
                break; //We found a straight, stop iterating.
            }
        }

        // Check if any large straight pattern exists in the dice
        for (let largeArray of larges) {
            if (largeArray.every((value) => diceValues.includes(value))) {
                this.scoreForm.find("#large").addClass("highlighted");
                break;
            }
        }

        //If all 5 values match, enable the Crazee!
        diceValues.every((value) => value === diceValues[0]) && this.scoreForm.find("#crazee").addClass("highlighted"); //Enabled if every value matches the first.

        //Always enable the chance
        this.scoreForm.find("#chance").addClass("highlighted");

        //Finally, disable any score options previously used
        for (const type of this.gameState.score.usedScoreTypes) {
            this.scoreForm.find(`input[value="${type}"]`).prop("disabled", true); //Disable the input with associated type.
        }
    }
    updateScoreDisplay() {
        this.scoreSpan.text(this.gameState.score.currentScore);
    }

    updateSubmitButton() {
        const submitButton = this.scoreForm.find('input[type="submit"]');
        this.scoreForm.find("input:checked") && submitButton.prop("disabled", false);
    }

    showMessage(message) {
        this.logDiv.html("");
        this.logDiv.append(`<p>${message}</p>`);
    }
}

//6.CrazeeGame. This object is our motherboard. It traces all these elements together and runs them appropiately.

class CrazeeGame {
    constructor() {
        this.gameState = new GameState();
        this.ui = new UIControl(this.gameState);

        //Load Saved game
        StorageHandler.loadGame(this.gameState);
        this.ui.updateUI();
        this.ui.showMessage(`Turn ${this.gameState.turnNum}`);
    }
}

//Initialiaze
const game = new CrazeeGame();
