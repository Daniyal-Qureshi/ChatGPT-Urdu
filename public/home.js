// import { ShiftKeysMapping } from "./keys.js";
// import { KeysMapping } from "./keys.js";



// $(document).ready(function () {
//   alert("Has been loaded")
//   $("#target").keypress(function (event) {
//     if (event.key == "Enter") {
//       return;
//     }
//     var start = event.target.selectionStart;
//     var end = event.target.selectionEnd;
//     var oldValue = event.target.value;
//     var value;

//     if (event.shiftKey) {
//       value = ShiftKeysMapping[event.key.toUpperCase()]
//         ? ShiftKeysMapping[event.key.toUpperCase()]
//         : event.key;
//     } else {
//       value = KeysMapping[event.key.toUpperCase()]
//         ? KeysMapping[event.key.toUpperCase()]
//         : event.key;
//     }

//     var newValue = oldValue.slice(0, start) + value + oldValue.slice(end);

//     event.target.value = newValue;
//     event.target.selectionStart = event.target.selectionEnd = start + 1;
//     event.preventDefault();
//   });
// });


alert("Hello world")
