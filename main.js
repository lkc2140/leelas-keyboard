
// Initialize an audio context

document.addEventListener("DOMContentLoaded", function(event) {

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    var wave_type;
    var squares = [];
    const clearButton = document.querySelector('button');

    // Generating squares
    // SOURCE: https://www.codeguage.com/courses/js/cssom-colored-squares-exercise
    // USED PARTS OF THEIR CODE to generate random integer, color, and square 
    // (randomInt, randomColor, getSquare)

    function randomInt(start, end) {
        return start + Math.floor(Math.random() * (end - start + 1))
    }

    function randomColor() {

        // SOURCE: https://www.geeksforgeeks.org/how-to-get-value-of-selected-radio-button-using-javascript/
        var color_opt = document.getElementsByName("color");
        for (i = 0; i < color_opt.length; i++) {
            if (color_opt[i].checked)
                color_type = color_opt[i].value;
        }
        if(color_type=="random") {
            return `rgb(${randomInt(0, 255)}, ${randomInt(0, 255)}, ${randomInt(0, 255)})`;
        }
        else if(color_type=="gray") {
            num = randomInt(0, 255);
            return `rgb(${num}, ${num}, ${num})`;
        }
        else if(color_type=="pastel") {
            return `rgb(${randomInt(210, 255)}, ${randomInt(210, 255)}, ${randomInt(210, 255)})`;
        }
        
    }

    
    function getSquare() {
        var divElement = document.createElement('div');
        divElement.className = 'square';
     
        var width = randomInt(50, 100);
        divElement.style.width = divElement.style.height = width + 'px';
     
        divElement.style.backgroundColor = randomColor();
     
        // Keeps square within height and with of screen with a small border
        divElement.style.left = randomInt(0 , innerWidth - width ) + 'px';
        divElement.style.top = randomInt(0 , innerHeight - width ) + 'px';
        squares[squares.length] = divElement;
        return divElement;
    }

    clearButton.addEventListener('click', function () {
        while (squares.length != 0) {
            curSquare = squares.pop();
            curSquare.remove();
        }
    }, false);
    

    const keyboardFrequencyMap = {
        '90': 261.625565300598634,  //Z - C
        '83': 277.182630976872096, //S - C#
        '88': 293.664767917407560,  //X - D
        '68': 311.126983722080910, //D - D#
        '67': 329.627556912869929,  //C - E
        '86': 349.228231433003884,  //V - F
        '71': 369.994422711634398, //G - F#
        '66': 391.995435981749294,  //B - G
        '72': 415.304697579945138, //H - G#
        '78': 440.000000000000000,  //N - A
        '74': 466.163761518089916, //J - A#
        '77': 493.883301256124111,  //M - B
        '81': 523.251130601197269,  //Q - C
        '50': 554.365261953744192, //2 - C#
        '87': 587.329535834815120,  //W - D
        '51': 622.253967444161821, //3 - D#
        '69': 659.255113825739859,  //E - E
        '82': 698.456462866007768,  //R - F
        '53': 739.988845423268797, //5 - F#
        '84': 783.990871963498588,  //T - G
        '54': 830.609395159890277, //6 - G#
        '89': 880.000000000000000,  //Y - A
        '55': 932.327523036179832, //7 - A#
        '85': 987.766602512248223,  //U - B
    }

    window.addEventListener('keydown', keyDown, false);
    window.addEventListener('keyup', keyUp, false);
    
    activeOscillators = {}
    activeGains = {}
    
    function keyDown(event) {
        const key = (event.detail || event.which).toString();
        if (keyboardFrequencyMap[key] && !activeOscillators[key]) {
          playNote(key);
        }
    }
    
    function keyUp(event) {
        const key = (event.detail || event.which).toString();
        if (keyboardFrequencyMap[key] && activeOscillators[key]) {
            gainNode = activeGains[key];
            // SOURCE: https://www.leafwindow.com/en/digital-piano-with-web-audio-api-5-en/
            gainNode.gain.cancelScheduledValues(audioCtx.currentTime); // In case key lifted quickly before ADS
            gainNode.gain.setValueAtTime(gainNode.gain.value, audioCtx.currentTime); // Bc need previous event
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1); // Release
            gainNode.gain.setValueAtTime(0., audioCtx.currentTime + 0.1); 
            activeOscillators[key].stop(audioCtx.currentTime + 0.15);

            delete activeOscillators[key];
            delete activeGains[key];
        }
    }
    
    const globalGain = audioCtx.createGain(); // This will control the volume of all notes
    globalGain.gain.setValueAtTime(0.8, audioCtx.currentTime)
    globalGain.connect(audioCtx.destination);

    function playNote(key) {

        const osc = audioCtx.createOscillator();
        osc.frequency.setValueAtTime(keyboardFrequencyMap[key], audioCtx.currentTime);

        const gainNode = audioCtx.createGain();

        // SOURCE: https://www.delftstack.com/howto/javascript/javascript-dictionary-length/
        numNotes = Object.keys(activeGains).length + 1

        // SOURCE: https://www.leafwindow.com/en/digital-piano-with-web-audio-api-5-en/
        gainNode.gain.setValueAtTime(0.001, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.75 / numNotes, audioCtx.currentTime + 0.1); // Attack
        gainNode.gain.exponentialRampToValueAtTime(0.5 / numNotes, audioCtx.currentTime + 0.2);    // Decay
        
        // Loop through each other active gain node and decrease gain for each
        // SOURCE: https://stackoverflow.com/questions/34913675/how-to-iterate-keys-values-in-javascript
        Object.keys(activeGains).forEach(function(key) {
            var curGainNode = activeGains[key];
            curGainNode.gain.setTargetAtTime(0.5 / numNotes, audioCtx.currentTime + 0.2, 0.2);
        });

        osc.connect(gainNode).connect(globalGain) // You will need a new gain node for each node to control the adsr of that note
    
        // Check wave type
        // SOURCE: https://www.geeksforgeeks.org/how-to-get-value-of-selected-radio-button-using-javascript/
        var wave_opt = document.getElementsByName("wave");
        for (i = 0; i < wave_opt.length; i++) {
            if (wave_opt[i].checked)
                wave_type = wave_opt[i].value;
        }

        osc.type = wave_type; //choose your favorite waveform
        //osc.connect(audioCtx.destination)
        osc.start();
        document.body.appendChild(getSquare()); // Draw square
        activeOscillators[key] = osc
        activeGains[key] = gainNode
      }
} ); 
