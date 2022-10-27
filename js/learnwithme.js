
let previous = "hello, lets get started";
let domPrevious = document.getElementById("thePrevious");
let domtheWord = document.getElementById("theWord");
let domDetail = document.getElementById("detail");
let voiceBox = document.getElementById("voiceBox");
let lessonTodo = shuffle(sightList);
let init = "true";
let i = 0
let theWord = shuffle(lessonTodo);

theNewWord = theWord[i];
voiceBox.innerHTML = '<source src="./audio/' + theNewWord + '.mp3" type="audio/mpeg">';
lessonTodo = lesson(lessonTodo);

function nextWord(prev) {

    if (i >= lessonTodo.length) {
        i = 0;
        theWord = shuffle(theWord);
        theNewWord = lessonTodo[i];
    } else if (prev) {
        console.log('he clicked back');
        theNewWord = lessonTodo[i - 1];
    } else {
        theNewWord = lessonTodo[i];
    }

    domtheWord.className = "none";
    if (!lessonTodo[i - 1]) { } else { previous = `<small>previous: ${lessonTodo[i - 1]}</small>` };
    domPrevious.innerHTML = `${previous}`
    domtheWord.innerHTML = `${theNewWord}`;
    voiceBox.innerHTML = "<source src='./audio/" + theNewWord + ".mp3' type='audio/mpeg'>";
    i = i + 1;
    return (i);
}

function lesson(lessonTodo2) {
    if (!lessonTodo[i - 1]) { } else { previous = `<small>something new then...</small>` };

    if (init == 'true') {
        init = 'false';
        lessonTodo = sightList;
    } else {
        i = 0;
        lessonTodo = lessonTodo2
    }
    nextWord();
    domDetail.open = false;
    return lessonTodo;
}

function shuffle(array) {
    let currentIndex = array.length, randomIndex;
    // While there remain elements to shuffle.
    while (currentIndex != 0) {
        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }
    return array;
}

function playAudio() {
    domtheWord.className = 'glow'
    voiceBox.load();
    voiceBox.play();
}

function pauseAudio() {
    voiceBox.pause();
} 