const dateStr = "2026-03-22";

const classes = [
  {
    "title": "Clase Crossfit",
    "description": "clase dirigida de Crosffit",
    "coachId": "MXdRSTsbK6XFFADjQeVQWm1EfW32",
    "coachName": "jose Prueba  Prueba franco",
    "category": "ALMODOVARFIT",
    "startTime": "22:30",
    "capacity": 24,
    "isRecurring": false,
    "recurringDays": null,
    "specificDate": "2026-03-22",
    "status": "active"
  }
];

const selectedDate = new Date(); // Right now is sun 22nd

const myDateStr = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
console.log("myDateStr:", myDateStr);
console.log("specificDate:", classes[0].specificDate);

const todaysClasses = classes.filter(c => {
    if (c.isRecurring) {
        return c.recurringDays.includes(selectedDate.getDay());
    }
    return c.specificDate === myDateStr;
});

console.log("todays classes len:", todaysClasses.length);
